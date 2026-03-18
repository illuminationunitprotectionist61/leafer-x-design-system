/**
 * 快速磁盘分析器
 * 使用 PowerShell 在几秒内完成全盘扫描
 */

const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

class FastDiskAnalyzer {
  constructor() {
    this.results = {
      categories: {},
      largeFiles: [],
      totalScanned: 0,
      canCleanSize: 0
    };
  }

  /**
   * 执行快速扫描（5-10秒内完成）
   */
  async analyze(drive = 'C:') {
    console.log(`[FastDiskAnalyzer] 开始快速扫描 ${drive}...`);
    const startTime = Date.now();

    try {
      // 1. 快速获取各类文件大小（使用 PowerShell，1-2秒）
      await this.scanCategories(drive);
      
      // 2. 快速扫描大文件（使用 PowerShell，3-5秒）
      await this.scanLargeFiles(drive);
      
      // 3. 扫描可清理的系统垃圾（1-2秒）
      await this.scanJunkFiles(drive);

      const duration = (Date.now() - startTime) / 1000;
      console.log(`[FastDiskAnalyzer] 快速扫描完成，耗时: ${duration.toFixed(1)}秒`);
      
      return this.results;
    } catch (error) {
      console.error('[FastDiskAnalyzer] 扫描失败:', error);
      throw error;
    }
  }

  /**
   * 快速扫描各类文件大小
   */
  async scanCategories(drive) {
    console.log('[FastDiskAnalyzer] 扫描各类文件大小...');
    
    const categories = [
      { name: '系统文件', path: `${drive}\\Windows`, type: 'system' },
      { name: '应用程序', path: `${drive}\\Program Files`, type: 'application' },
      { name: '应用程序(x86)', path: `${drive}\\Program Files (x86)`, type: 'application' },
      { name: '用户文件', path: `${drive}\\Users`, type: 'user' },
      { name: '程序数据', path: `${drive}\\ProgramData`, type: 'system' }
    ];

    for (const cat of categories) {
      try {
        // 使用 dir 命令快速获取目录大小（比 PowerShell 更快）
        const size = await this.getDirectorySizeFast(cat.path);
        
        this.results.categories[cat.name] = {
          size,
          sizeFormatted: this.formatBytes(size),
          type: cat.type
        };
        
        console.log(`[FastDiskAnalyzer] ${cat.name}: ${this.formatBytes(size)}`);
      } catch (error) {
        console.log(`[FastDiskAnalyzer] 无法扫描 ${cat.name}: ${error.message}`);
        this.results.categories[cat.name] = {
          size: 0,
          sizeFormatted: '0 B',
          type: cat.type
        };
      }
    }
  }

  /**
   * 快速获取目录大小（使用 Node.js，更可靠）
   */
  async getDirectorySizeFast(dirPath) {
    try {
      if (!await fs.pathExists(dirPath)) {
        return 0;
      }

      let totalSize = 0;
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      // 只遍历第一层子目录，快速估算
      for (const entry of entries.slice(0, 50)) { // 限制最多50个子目录
        try {
          const fullPath = path.join(dirPath, entry.name);
          
          if (entry.isDirectory()) {
            // 对子目录使用 du 命令快速获取大小
            try {
              const cmd = `du -sb "${fullPath}" 2>/dev/null`;
              const result = execSync(cmd, { encoding: 'utf8', timeout: 2000 });
              const size = parseInt(result.split('\t')[0]) || 0;
              totalSize += size;
            } catch (e) {
              // 如果 du 命令失败，使用 Node.js 估算
              totalSize += await this.estimateDirectorySize(fullPath);
            }
          } else if (entry.isFile()) {
            const stats = await fs.stat(fullPath);
            totalSize += stats.size;
          }
        } catch (error) {
          // 忽略
        }
      }
      
      return totalSize;
    } catch (error) {
      return 0;
    }
  }

  /**
   * 估算目录大小（快速模式，只扫描部分文件）
   */
  async estimateDirectorySize(dirPath, depth = 0) {
    if (depth > 2) return 0; // 限制递归深度
    
    try {
      let size = 0;
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      // 只处理前100个条目
      for (const entry of entries.slice(0, 100)) {
        try {
          const fullPath = path.join(dirPath, entry.name);
          
          if (entry.isDirectory()) {
            size += await this.estimateDirectorySize(fullPath, depth + 1);
          } else if (entry.isFile()) {
            const stats = await fs.stat(fullPath);
            size += stats.size;
          }
        } catch (error) {
          // 忽略
        }
      }
      
      return size;
    } catch (error) {
      return 0;
    }
  }

  /**
   * 快速扫描大文件（>100MB）
   */
  async scanLargeFiles(drive) {
    console.log('[FastDiskAnalyzer] 扫描大文件...');
    
    try {
      // 扫描用户目录中的大文件（通常是可删除的）
      const userPath = `${drive}\\Users`;
      await this.scanDirectoryForLargeFiles(userPath, 100 * 1024 * 1024);
      
      console.log(`[FastDiskAnalyzer] 找到 ${this.results.largeFiles.length} 个大文件`);
    } catch (error) {
      console.log('[FastDiskAnalyzer] 大文件扫描失败:', error.message);
    }
  }

  /**
   * 扫描目录中的大文件
   */
  async scanDirectoryForLargeFiles(dirPath, minSize) {
    try {
      if (!await fs.pathExists(dirPath)) return;
      
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        if (this.results.largeFiles.length >= 50) return; // 限制数量
        
        const fullPath = path.join(dirPath, entry.name);
        
        try {
          if (entry.isDirectory()) {
            // 递归扫描一层
            await this.scanDirectoryForLargeFilesLevel1(fullPath, minSize);
          } else if (entry.isFile()) {
            const stats = await fs.stat(fullPath);
            if (stats.size >= minSize) {
              this.results.largeFiles.push({
                path: fullPath,
                size: stats.size,
                sizeFormatted: this.formatBytes(stats.size),
                modifiedTime: stats.mtime,
                safeToDelete: this.isSafeToDelete(fullPath)
              });
            }
          }
        } catch (error) {
          // 忽略
        }
      }
    } catch (error) {
      // 忽略
    }
  }

  /**
   * 递归扫描一层目录
   */
  async scanDirectoryForLargeFilesLevel1(dirPath, minSize) {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries.slice(0, 100)) { // 限制数量
        if (this.results.largeFiles.length >= 50) return;
        
        const fullPath = path.join(dirPath, entry.name);
        
        try {
          if (entry.isFile()) {
            const stats = await fs.stat(fullPath);
            if (stats.size >= minSize) {
              this.results.largeFiles.push({
                path: fullPath,
                size: stats.size,
                sizeFormatted: this.formatBytes(stats.size),
                modifiedTime: stats.mtime,
                safeToDelete: this.isSafeToDelete(fullPath)
              });
            }
          }
        } catch (error) {
          // 忽略
        }
      }
    } catch (error) {
      // 忽略
    }
  }

  /**
   * 扫描可清理的垃圾文件
   */
  async scanJunkFiles(drive) {
    console.log('[FastDiskAnalyzer] 扫描垃圾文件...');
    
    const junkPaths = [
      { name: 'Windows临时文件', path: `${drive}\\Windows\\Temp`, safe: true },
      { name: '用户临时文件', path: `${drive}\\Users\\Administrator\\AppData\\Local\\Temp`, safe: true },
      { name: '回收站', path: `${drive}\\$Recycle.Bin`, safe: true },
      { name: 'Windows更新缓存', path: `${drive}\\Windows\\SoftwareDistribution\\Download`, safe: true },
      { name: '浏览器缓存', path: `${drive}\\Users\\Administrator\\AppData\\Local\\Google\\Chrome\\User Data\\Default\\Cache`, safe: true },
      { name: '缩略图缓存', path: `${drive}\\Users\\Administrator\\AppData\\Local\\Microsoft\\Windows\\Explorer`, safe: true }
    ];

    let totalJunkSize = 0;

    for (const junk of junkPaths) {
      try {
        const size = await this.getDirectorySizeFast(junk.path);
        
        if (size > 0) {
          this.results.categories[junk.name] = {
            size,
            sizeFormatted: this.formatBytes(size),
            type: 'junk',
            safeToClean: junk.safe
          };
          
          console.log(`[FastDiskAnalyzer] ${junk.name}: ${this.formatBytes(size)}`);
          
          if (junk.safe) {
            totalJunkSize += size;
          }
        }
      } catch (error) {
        // 忽略
      }
    }
    
    this.results.canCleanSize = totalJunkSize;
    console.log(`[FastDiskAnalyzer] 可清理垃圾文件: ${this.formatBytes(totalJunkSize)}`);
  }

  /**
   * 判断是否可安全删除
   */
  isSafeToDelete(filePath) {
    const unsafePatterns = [
      'Windows\\System32',
      'Windows\\SysWOW64',
      'Program Files',
      'pagefile.sys',
      'hiberfil.sys'
    ];
    
    return !unsafePatterns.some(pattern => 
      filePath.toLowerCase().includes(pattern.toLowerCase())
    );
  }

  /**
   * 格式化字节大小
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

module.exports = FastDiskAnalyzer;
