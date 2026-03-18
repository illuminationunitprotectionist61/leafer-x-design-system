const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');
const ExifReader = require('exifreader');
const DatabaseManager = require('./DatabaseManager');

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.tiff', '.raw', '.heic'];
const DOCUMENT_EXTENSIONS = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.md'];
const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.avi', '.mkv', '.wmv', '.flv'];

class FileOrganizer {
  constructor(databaseManager, configManager) {
    this.db = databaseManager;
    this.config = configManager;
  }

  async organize(options) {
    console.log('开始整理，参数:', options);
    const { sourceFolder, targetFolder, organizeType, rules } = options;
    
    if (!sourceFolder || !targetFolder) {
      throw new Error('源文件夹和目标文件夹不能为空');
    }
    
    // 检查源文件夹是否存在
    if (!await fs.pathExists(sourceFolder)) {
      throw new Error(`源文件夹不存在: ${sourceFolder}`);
    }
    
    // 确保目标文件夹存在
    await fs.ensureDir(targetFolder);
    
    // 检查是否是原地整理（源文件夹和目标文件夹相同）
    const isInPlace = path.resolve(sourceFolder).toLowerCase() === path.resolve(targetFolder).toLowerCase();
    if (isInPlace) {
      console.log('原地整理模式：将在源文件夹内创建子文件夹进行整理');
    }
    
    const results = {
      total: 0,
      success: 0,
      failed: 0,
      skipped: 0,
      errors: [],
      movedFiles: []
    };

    try {
      console.log('扫描文件夹:', sourceFolder);
      const files = await this.scanFolder(sourceFolder);
      console.log('找到文件数量:', files.length);
      results.total = files.length;

      for (const file of files) {
        try {
          console.log(`[organize] 处理文件: ${file}`);
          const fileInfo = await this.analyzeFile(file);
          console.log(`[organize] 文件信息:`, { 
            size: fileInfo.size, 
            fileType: fileInfo.fileType, 
            extension: fileInfo.extension 
          });
          
          let moveResult;
          if (organizeType === 'byDate') {
            moveResult = await this.organizeByDate(file, fileInfo, targetFolder, isInPlace);
          } else if (organizeType === 'byType') {
            moveResult = await this.organizeByType(file, fileInfo, targetFolder, isInPlace);
          } else if (organizeType === 'custom' && rules) {
            moveResult = await this.organizeByRules(file, fileInfo, targetFolder, rules);
          } else {
            throw new Error(`未知的整理类型: ${organizeType}`);
          }

          // 根据移动结果更新统计
          if (moveResult && moveResult.success) {
            results.success++;
            results.movedFiles.push(moveResult);
            
            // 更新数据库中的文件路径
            this.db.addFile({
              path: moveResult.to,
              name: path.basename(moveResult.to),
              extension: path.extname(moveResult.to).toLowerCase(),
              size: fileInfo.size,
              hash: fileInfo.hash,
              created_time: fileInfo.createdTime,
              modified_time: fileInfo.modifiedTime,
              exif_date: fileInfo.exifDate,
              file_type: fileInfo.fileType,
              thumbnail_path: null
            });
          } else if (moveResult && moveResult.reason === 'already_in_target') {
            results.skipped++;
            console.log(`跳过文件 (已在目标位置): ${file}`);
          } else {
            results.skipped++;
          }
        } catch (error) {
          results.failed++;
          results.errors.push({
            file,
            error: error.message
          });
          console.error(`处理文件失败: ${file}`, error);
        }
      }

      console.log('整理完成:', results);
      return results;
    } catch (error) {
      console.error('整理失败:', error);
      throw new Error(`整理失败: ${error.message}`);
    }
  }

  async scanFolder(folderPath) {
    const files = [];
    const items = await fs.readdir(folderPath, { withFileTypes: true });

    for (const item of items) {
      const fullPath = path.join(folderPath, item.name);
      if (item.isDirectory()) {
        const subFiles = await this.scanFolder(fullPath);
        files.push(...subFiles);
      } else if (item.isFile()) {
        files.push(fullPath);
      }
    }

    return files;
  }

  async analyzeFile(filePath) {
    const stats = await fs.stat(filePath);
    const ext = path.extname(filePath).toLowerCase();
    
    const fileInfo = {
      size: stats.size,
      createdTime: stats.birthtime,
      modifiedTime: stats.mtime,
      extension: ext,
      fileType: this.getFileType(ext),
      hash: null,
      exifDate: null
    };

    if (fileInfo.fileType === 'image') {
      try {
        fileInfo.exifDate = await this.extractExifDate(filePath);
      } catch (e) {
        console.warn('EXIF提取失败:', filePath, e.message);
      }
    }

    if (fileInfo.size < 100 * 1024 * 1024) {
      fileInfo.hash = await this.calculateHash(filePath);
    }

    return fileInfo;
  }

  getFileType(extension) {
    if (IMAGE_EXTENSIONS.includes(extension)) return 'image';
    if (DOCUMENT_EXTENSIONS.includes(extension)) return 'document';
    if (VIDEO_EXTENSIONS.includes(extension)) return 'video';
    return 'other';
  }

  async extractExifDate(filePath) {
    try {
      const tags = await ExifReader.load(filePath);
      
      const dateFields = ['DateTimeOriginal', 'CreateDate', 'DateTime'];
      for (const field of dateFields) {
        if (tags[field]) {
          const dateStr = tags[field].description || tags[field].value;
          const date = this.parseExifDate(dateStr);
          if (date) return date;
        }
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }

  parseExifDate(dateStr) {
    if (typeof dateStr === 'string') {
      const cleaned = dateStr.replace(/[:\s]/g, '-');
      const parts = cleaned.split('-');
      if (parts.length >= 6) {
        const year = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1;
        const day = parseInt(parts[2]);
        const hour = parseInt(parts[3]);
        const minute = parseInt(parts[4]);
        const second = parseInt(parts[5]);
        return new Date(year, month, day, hour, minute, second);
      }
    }
    return null;
  }

  async calculateHash(filePath) {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('md5');
      const stream = fs.createReadStream(filePath);
      stream.on('data', chunk => hash.update(chunk));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  }

  async organizeByDate(filePath, fileInfo, targetFolder, isInPlace = false) {
    const date = fileInfo.exifDate || fileInfo.modifiedTime;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    const targetDir = path.join(targetFolder, String(year), `${year}-${month}`, `${year}-${month}-${day}`);
    
    console.log(`[organizeByDate] 目标目录: ${targetDir}`);
    console.log(`[organizeByDate] 原地整理模式: ${isInPlace}`);
    await fs.ensureDir(targetDir);

    const targetPath = await this.getUniqueTargetPath(filePath, targetDir);
    console.log(`[organizeByDate] 源路径: ${filePath}`);
    console.log(`[organizeByDate] 目标路径: ${targetPath}`);
    
    // 检查文件是否已经在目标位置（仅在非原地整理模式下）
    if (!isInPlace && filePath.toLowerCase() === targetPath.toLowerCase()) {
      console.log(`[organizeByDate] 跳过文件 (已在目标位置)`);
      return { success: false, reason: 'already_in_target', path: filePath };
    }

    // 使用 copy + delete 替代 move，更可靠
    try {
      console.log(`[organizeByDate] 开始复制文件...`);
      await fs.copy(filePath, targetPath, { overwrite: false, preserveTimestamps: true });
      console.log(`[organizeByDate] 复制成功，删除源文件...`);
      await fs.remove(filePath);
      console.log(`[organizeByDate] 文件已移动: ${filePath} -> ${targetPath}`);
      return { success: true, from: filePath, to: targetPath };
    } catch (error) {
      console.error(`[organizeByDate] 移动文件失败: ${filePath}`, error);
      // 如果复制成功但删除失败，尝试清理
      if (await fs.pathExists(targetPath)) {
        try {
          await fs.remove(targetPath);
        } catch (cleanupError) {
          console.error(`[organizeByDate] 清理失败的目标文件:`, cleanupError);
        }
      }
      throw error;
    }
  }

  async organizeByType(filePath, fileInfo, targetFolder, isInPlace = false) {
    const typeFolder = fileInfo.fileType;
    const targetDir = path.join(targetFolder, typeFolder);
    
    console.log(`[organizeByType] 目标目录: ${targetDir}`);
    console.log(`[organizeByType] 原地整理模式: ${isInPlace}`);
    await fs.ensureDir(targetDir);

    const targetPath = await this.getUniqueTargetPath(filePath, targetDir);
    console.log(`[organizeByType] 源路径: ${filePath}`);
    console.log(`[organizeByType] 目标路径: ${targetPath}`);
    
    // 检查文件是否已经在目标位置（仅在非原地整理模式下）
    if (!isInPlace && filePath.toLowerCase() === targetPath.toLowerCase()) {
      console.log(`[organizeByType] 跳过文件 (已在目标位置)`);
      return { success: false, reason: 'already_in_target', path: filePath };
    }

    // 使用 copy + delete 替代 move，更可靠
    try {
      console.log(`[organizeByType] 开始复制文件...`);
      await fs.copy(filePath, targetPath, { overwrite: false, preserveTimestamps: true });
      console.log(`[organizeByType] 复制成功，删除源文件...`);
      await fs.remove(filePath);
      console.log(`[organizeByType] 文件已移动: ${filePath} -> ${targetPath}`);
      return { success: true, from: filePath, to: targetPath };
    } catch (error) {
      console.error(`[organizeByType] 移动文件失败: ${filePath}`, error);
      // 如果复制成功但删除失败，尝试清理
      if (await fs.pathExists(targetPath)) {
        try {
          await fs.remove(targetPath);
        } catch (cleanupError) {
          console.error(`[organizeByType] 清理失败的目标文件:`, cleanupError);
        }
      }
      throw error;
    }
  }

  async organizeByRules(filePath, fileInfo, targetFolder, rules) {
    for (const rule of rules) {
      if (this.matchesRule(filePath, fileInfo, rule)) {
        const targetDir = path.join(targetFolder, rule.targetFolder);
        
        console.log(`[organizeByRules] 目标目录: ${targetDir}`);
        await fs.ensureDir(targetDir);
        
        const targetPath = await this.getUniqueTargetPath(filePath, targetDir);
        console.log(`[organizeByRules] 源路径: ${filePath}`);
        console.log(`[organizeByRules] 目标路径: ${targetPath}`);
        
        if (filePath.toLowerCase() === targetPath.toLowerCase()) {
          console.log(`[organizeByRules] 跳过文件 (已在目标位置)`);
          return { success: false, reason: 'already_in_target', path: filePath };
        }

        // 使用 copy + delete 替代 move，更可靠
        try {
          console.log(`[organizeByRules] 开始复制文件...`);
          await fs.copy(filePath, targetPath, { overwrite: false, preserveTimestamps: true });
          console.log(`[organizeByRules] 复制成功，删除源文件...`);
          await fs.remove(filePath);
          console.log(`[organizeByRules] 文件已移动: ${filePath} -> ${targetPath}`);
          return { success: true, from: filePath, to: targetPath };
        } catch (error) {
          console.error(`[organizeByRules] 移动文件失败: ${filePath}`, error);
          // 如果复制成功但删除失败，尝试清理
          if (await fs.pathExists(targetPath)) {
            try {
              await fs.remove(targetPath);
            } catch (cleanupError) {
              console.error(`[organizeByRules] 清理失败的目标文件:`, cleanupError);
            }
          }
          throw error;
        }
      }
    }
    return { success: false, reason: 'no_matching_rule', path: filePath };
  }

  matchesRule(filePath, fileInfo, rule) {
    switch (rule.type) {
      case 'extension':
        return fileInfo.extension === rule.pattern;
      case 'name':
        return path.basename(filePath).includes(rule.pattern);
      case 'size':
        const sizeMatch = rule.pattern.match(/([<>=]+)(\d+)/);
        if (sizeMatch) {
          const operator = sizeMatch[1];
          const size = parseInt(sizeMatch[2]) * 1024 * 1024;
          return this.compareSize(fileInfo.size, operator, size);
        }
        return false;
      case 'date':
        return true;
      default:
        return false;
    }
  }

  compareSize(actual, operator, target) {
    switch (operator) {
      case '<': return actual < target;
      case '>': return actual > target;
      case '<=': return actual <= target;
      case '>=': return actual >= target;
      case '=': return actual === target;
      default: return false;
    }
  }

  /**
   * 获取唯一的文件路径（处理文件名冲突）
   * @param {string} sourcePath - 源文件路径
   * @param {string} targetDir - 目标目录
   * @returns {Promise<string>} 唯一的目标路径
   */
  async getUniqueTargetPath(sourcePath, targetDir) {
    const originalName = path.basename(sourcePath);
    const ext = path.extname(originalName);
    const nameWithoutExt = path.basename(originalName, ext);
    
    let targetPath = path.join(targetDir, originalName);
    
    // 如果文件已存在，添加序号
    let counter = 1;
    while (await fs.pathExists(targetPath)) {
      const newName = `${nameWithoutExt}_${counter}${ext}`;
      targetPath = path.join(targetDir, newName);
      counter++;
      
      // 防止无限循环
      if (counter > 1000) {
        throw new Error(`无法生成唯一文件名: ${originalName}`);
      }
    }
    
    return targetPath;
  }

  async scanDuplicates(folderPath) {
    const files = await this.scanFolder(folderPath);
    const hashMap = new Map();
    const duplicates = [];

    for (const file of files) {
      try {
        const stats = await fs.stat(file);
        if (stats.size > 100 * 1024 * 1024) continue;
        
        const hash = await this.calculateHash(file);
        
        if (hashMap.has(hash)) {
          hashMap.get(hash).push(file);
        } else {
          hashMap.set(hash, [file]);
        }
      } catch (error) {
        console.warn('扫描文件失败:', file, error.message);
      }
    }

    for (const [hash, paths] of hashMap) {
      if (paths.length > 1) {
        const stats = await fs.stat(paths[0]);
        const duplicate = {
          hash,
          files: paths,
          size: stats.size,
          count: paths.length
        };
        duplicates.push(duplicate);
        this.db.addDuplicate(hash, paths, stats.size);
      }
    }

    return duplicates;
  }

  async deleteDuplicates(duplicates, keepIndex = 0) {
    const results = {
      deleted: 0,
      freedSpace: 0,
      errors: []
    };

    for (const duplicate of duplicates) {
      const filesToDelete = duplicate.files.filter((_, index) => index !== keepIndex);
      
      for (const file of filesToDelete) {
        try {
          const stats = await fs.stat(file);
          await fs.remove(file);
          results.deleted++;
          results.freedSpace += stats.size;
          this.db.deleteFile(file);
        } catch (error) {
          results.errors.push({ file, error: error.message });
        }
      }
      
      this.db.deleteDuplicate(duplicate.hash);
    }

    return results;
  }

  async getTimeline(options) {
    const { startDate, endDate, fileType } = options;
    let files;

    if (startDate && endDate) {
      files = this.db.getFilesByDateRange(startDate, endDate);
    } else {
      files = this.db.getFilesByType(fileType || 'image');
    }

    const timeline = {};
    
    for (const file of files) {
      const date = file.exif_date || file.created_time;
      const dateKey = new Date(date).toISOString().split('T')[0];
      
      if (!timeline[dateKey]) {
        timeline[dateKey] = [];
      }
      
      timeline[dateKey].push({
        id: file.id,
        name: file.name,
        path: file.path,
        size: file.size,
        type: file.file_type,
        date: date
      });
    }

    return timeline;
  }

  async browseFolder(folderPath) {
    try {
      const items = await fs.readdir(folderPath, { withFileTypes: true });
      
      return items.map(item => ({
        name: item.name,
        path: path.join(folderPath, item.name),
        isDirectory: item.isDirectory(),
        isFile: item.isFile()
      }));
    } catch (error) {
      throw new Error(`无法浏览文件夹: ${error.message}`);
    }
  }

  async batchRename(folderPath, pattern) {
    const files = await fs.readdir(folderPath);
    const results = [];
    
    for (let i = 0; i < files.length; i++) {
      const oldPath = path.join(folderPath, files[i]);
      const stats = await fs.stat(oldPath);
      
      if (stats.isDirectory()) continue;
      
      const ext = path.extname(files[i]);
      const date = stats.mtime;
      
      let newName = pattern
        .replace('{date}', date.toISOString().split('T')[0])
        .replace('{index}', String(i + 1).padStart(4, '0'))
        .replace('{original}', path.basename(files[i], ext));
      
      newName = newName + ext;
      const newPath = path.join(folderPath, newName);
      
      if (oldPath !== newPath) {
        await fs.rename(oldPath, newPath);
        results.push({
          oldName: files[i],
          newName
        });
      }
    }
    
    return results;
  }
}

module.exports = FileOrganizer;
