/**
 * 高级磁盘分析器
 * 专门针对大文件和空间占用大的目录进行深度扫描
 */

const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

class AdvancedDiskAnalyzer {
  constructor() {
    this.largeFiles = [];
    this.largeDirectories = [];
    this.analysisResults = {
      totalScanned: 0,
      largeFilesTotal: 0,
      topDirectories: []
    };
  }

  /**
   * 执行高级分析
   */
  async analyze(drive = 'C:') {
    console.log(`[AdvancedDiskAnalyzer] 开始高级分析 ${drive}`);
    const startTime = Date.now();
    
    this.analysisResults = {
      drive,
      totalScanned: 0,
      largeFilesTotal: 0,
      topDirectories: [],
      recommendations: []
    };

    try {
      // 1. 扫描最大的目录（限制时间）
      await this.scanTopDirectories(drive);
      
      // 2. 扫描大文件（限制范围）
      await this.scanLargeFilesAdvanced(drive);
      
      // 3. 分析用户文件夹（只分析最大的几个）
      await this.analyzeUserFolders(drive);
      
      // 4. 分析程序文件夹（简化版）
      await this.analyzeProgramFoldersSimple(drive);
      
      // 5. 生成建议
      this.generateRecommendations();

      const duration = (Date.now() - startTime) / 1000;
      console.log(`[AdvancedDiskAnalyzer] 高级分析完成，耗时: ${duration.toFixed(1)}秒`);
      return this.analysisResults;
      
    } catch (error) {
      console.error('[AdvancedDiskAnalyzer] 分析失败:', error);
      throw error;
    }
  }

  /**
   * 扫描最大的目录
   */
  async scanTopDirectories(drive) {
    console.log('[AdvancedDiskAnalyzer] 扫描最大的目录...');
    
    const topDirs = [
      `${drive}\\Windows`,
      `${drive}\\Program Files`,
      `${drive}\\Program Files (x86)`,
      `${drive}\\ProgramData`,
      `${drive}\\Users`
    ];

    const dirSizes = [];
    
    for (const dir of topDirs) {
      try {
        if (!await fs.pathExists(dir)) continue;
        
        const size = await this.getDirectorySizeFast(dir);
        dirSizes.push({
          path: dir,
          name: path.basename(dir),
          size,
          sizeFormatted: this.formatBytes(size)
        });
        
        console.log(`[AdvancedDiskAnalyzer] ${path.basename(dir)}: ${this.formatBytes(size)}`);
      } catch (error) {
        console.log(`[AdvancedDiskAnalyzer] 无法扫描 ${dir}: ${error.message}`);
      }
    }
    
    // 按大小排序
    dirSizes.sort((a, b) => b.size - a.size);
    this.analysisResults.topDirectories = dirSizes;
  }

  /**
   * 快速获取目录大小（使用 PowerShell）
   */
  async getDirectorySizeFast(dirPath) {
    try {
      // 使用 PowerShell 快速计算目录大小
      const cmd = `powershell -Command "(Get-ChildItem -Path '${dirPath}' -Recurse -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum"`;
      const result = execSync(cmd, { encoding: 'utf8', timeout: 30000 });
      const size = parseInt(result.trim()) || 0;
      return size;
    } catch (error) {
      // 如果 PowerShell 失败，使用普通方法
      return this.getDirectorySize(dirPath);
    }
  }

  /**
   * 普通方法获取目录大小
   */
  async getDirectorySize(dirPath) {
    let totalSize = 0;
    
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        
        try {
          if (entry.isDirectory()) {
            totalSize += await this.getDirectorySize(fullPath);
          } else if (entry.isFile()) {
            const stats = await fs.stat(fullPath);
            totalSize += stats.size;
          }
        } catch (error) {
          // 忽略
        }
      }
    } catch (error) {
      // 忽略
    }
    
    return totalSize;
  }

  /**
   * 高级大文件扫描
   */
  async scanLargeFilesAdvanced(drive) {
    console.log('[AdvancedDiskAnalyzer] 扫描大文件...');
    
    // 只扫描用户目录，不扫描整个C盘，限制时间和数量
    const searchPaths = [
      `${drive}\\Users\\*\\Downloads`,
      `${drive}\\Users\\*\\Documents`,
      `${drive}\\Users\\*\\Desktop`,
      `${drive}\\Users\\*\\Pictures`,
      `${drive}\\Users\\*\\Videos`
    ];
    
    for (const searchPath of searchPaths) {
      try {
        await this.scanPathForLargeFiles(searchPath, 100 * 1024 * 1024); // 100MB
      } catch (error) {
        console.log(`[AdvancedDiskAnalyzer] 无法扫描 ${searchPath}: ${error.message}`);
      }
      
      // 如果已经找到50个文件，停止扫描
      if (this.largeFiles.length >= 50) break;
    }
    
    console.log(`[AdvancedDiskAnalyzer] 找到 ${this.largeFiles.length} 个大文件`);
  }
  
  /**
   * 扫描指定路径的大文件
   */
  async scanPathForLargeFiles(pathPattern, minSize) {
    const basePath = pathPattern.replace(/\\\*$/, '');
    
    try {
      if (!await fs.pathExists(basePath)) return;
      
      const entries = await fs.readdir(basePath, { withFileTypes: true });
      
      for (const entry of entries) {
        if (this.largeFiles.length >= 50) return; // 限制数量
        
        const fullPath = path.join(basePath, entry.name);
        
        try {
          if (entry.isDirectory()) {
            // 只递归一层
            await this.scanDirectoryForLargeFiles(fullPath, minSize, 1);
          } else if (entry.isFile()) {
            const stats = await fs.stat(fullPath);
            if (stats.size >= minSize) {
              this.largeFiles.push({
                path: fullPath,
                size: stats.size,
                sizeFormatted: this.formatBytes(stats.size),
                modifiedTime: stats.mtime,
                isSafeToDelete: this.isSafeToDelete(fullPath)
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
   * 递归扫描目录中的大文件
   */
  async scanDirectoryForLargeFiles(dirPath, minSize, depth) {
    if (depth > 2) return; // 限制递归深度为2
    if (this.largeFiles.length >= 50) return;
    
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        if (this.largeFiles.length >= 50) return;
        
        const fullPath = path.join(dirPath, entry.name);
        
        try {
          if (entry.isDirectory()) {
            await this.scanDirectoryForLargeFiles(fullPath, minSize, depth + 1);
          } else if (entry.isFile()) {
            const stats = await fs.stat(fullPath);
            if (stats.size >= minSize) {
              this.largeFiles.push({
                path: fullPath,
                size: stats.size,
                sizeFormatted: this.formatBytes(stats.size),
                modifiedTime: stats.mtime,
                isSafeToDelete: this.isSafeToDelete(fullPath)
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
   * 备用大文件扫描方法
   */
  async scanLargeFilesFallback(drive) {
    const searchPaths = [
      `${drive}\\Users`,
      `${drive}\\ProgramData`
    ];

    for (const searchPath of searchPaths) {
      try {
        await this.findLargeFilesRecursive(searchPath, 100 * 1024 * 1024);
      } catch (error) {
        console.log(`[AdvancedDiskAnalyzer] 无法扫描 ${searchPath}`);
      }
    }
  }

  /**
   * 递归查找大文件
   */
  async findLargeFilesRecursive(dirPath, minSize, depth = 0) {
    if (depth > 2) return; // 限制递归深度
    if (this.largeFiles.length >= 50) return; // 限制数量
    
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        if (this.largeFiles.length >= 50) break;
        
        const fullPath = path.join(dirPath, entry.name);
        
        try {
          if (entry.isDirectory()) {
            await this.findLargeFilesRecursive(fullPath, minSize, depth + 1);
          } else if (entry.isFile()) {
            const stats = await fs.stat(fullPath);
            
            if (stats.size >= minSize) {
              this.largeFiles.push({
                path: fullPath,
                size: stats.size,
                sizeFormatted: this.formatBytes(stats.size),
                modifiedTime: stats.mtime,
                isSafeToDelete: this.isSafeToDelete(fullPath)
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
   * 分析用户文件夹
   */
  async analyzeUserFolders(drive) {
    console.log('[AdvancedDiskAnalyzer] 分析用户文件夹...');
    
    const userFolders = [
      { name: '下载', path: `${drive}\\Users\\*\\Downloads` },
      { name: '文档', path: `${drive}\\Users\\*\\Documents` },
      { name: '桌面', path: `${drive}\\Users\\*\\Desktop` },
      { name: '图片', path: `${drive}\\Users\\*\\Pictures` },
      { name: '视频', path: `${drive}\\Users\\*\\Videos` }
    ];

    for (const folder of userFolders) {
      try {
        const size = await this.getPathSize(folder.path);
        if (size > 1024 * 1024 * 1024) { // 大于 1GB
          this.analysisResults.recommendations.push({
            type: 'user_folder',
            name: folder.name,
            path: folder.path,
            size,
            sizeFormatted: this.formatBytes(size),
            suggestion: `${folder.name}文件夹占用空间较大，建议清理不需要的文件`
          });
        }
      } catch (error) {
        // 忽略
      }
    }
  }

  /**
   * 分析程序文件夹（简化版，更快）
   */
  async analyzeProgramFoldersSimple(drive) {
    console.log('[AdvancedDiskAnalyzer] 分析程序文件夹（简化版）...');
    
    // 只检查几个常见的大程序目录
    const programDirs = [
      { name: 'Program Files', path: `${drive}\\Program Files` },
      { name: 'Program Files (x86)', path: `${drive}\\Program Files (x86)` }
    ];
    
    for (const dir of programDirs) {
      try {
        if (!await fs.pathExists(dir.path)) continue;
        
        const entries = await fs.readdir(dir.path, { withFileTypes: true });
        
        for (const entry of entries) {
          if (!entry.isDirectory()) continue;
          
          const fullPath = path.join(dir.path, entry.name);
          
          try {
            // 快速估算大小（只扫描一层）
            let size = 0;
            const subEntries = await fs.readdir(fullPath, { withFileTypes: true });
            
            for (const subEntry of subEntries.slice(0, 10)) { // 只检查前10个子目录
              const subPath = path.join(fullPath, subEntry.name);
              try {
                if (subEntry.isDirectory()) {
                  // 只获取直接子目录的大小
                  const files = await fs.readdir(subPath);
                  for (const file of files.slice(0, 100)) { // 限制文件数量
                    try {
                      const filePath = path.join(subPath, file);
                      const stats = await fs.stat(filePath);
                      if (stats.isFile()) size += stats.size;
                    } catch (e) {}
                  }
                } else if (subEntry.isFile()) {
                  const stats = await fs.stat(subPath);
                  size += stats.size;
                }
              } catch (e) {}
            }
            
            // 如果超过 2GB，添加到建议
            if (size > 2 * 1024 * 1024 * 1024) {
              this.analysisResults.recommendations.push({
                type: 'large_program',
                name: entry.name,
                path: fullPath,
                size,
                sizeFormatted: this.formatBytes(size),
                suggestion: `程序 ${entry.name} 占用约 ${this.formatBytes(size)}，如不再使用可考虑卸载`
              });
            }
          } catch (error) {
            // 忽略
          }
        }
      } catch (error) {
        console.log(`[AdvancedDiskAnalyzer] 无法扫描 ${dir.path}: ${error.message}`);
      }
    }
  }

  /**
   * 生成建议
   */
  generateRecommendations() {
    console.log('[AdvancedDiskAnalyzer] 生成建议...');
    
    // 添加大文件建议
    if (this.largeFiles.length > 0) {
      const safeFiles = this.largeFiles.filter(f => f.isSafeToDelete);
      const totalSize = safeFiles.reduce((sum, f) => sum + f.size, 0);
      
      if (totalSize > 0) {
        this.analysisResults.recommendations.push({
          type: 'large_files',
          name: '可删除的大文件',
          size: totalSize,
          sizeFormatted: this.formatBytes(totalSize),
          fileCount: safeFiles.length,
          suggestion: `发现 ${safeFiles.length} 个可安全删除的大文件，共占用 ${this.formatBytes(totalSize)}`,
          files: safeFiles.slice(0, 10) // 只显示前10个
        });
      }
    }
    
    // 添加目录建议（系统目录标记为需深入分析）
    const systemDirs = ['Windows', 'Program Files', 'Program Files (x86)', 'System32', 'SysWOW64'];
    
    for (const dir of this.analysisResults.topDirectories) {
      if (dir.size > 5 * 1024 * 1024 * 1024) { // 大于 5GB
        const isSystemDir = systemDirs.some(sysDir => 
          dir.name.toLowerCase().includes(sysDir.toLowerCase())
        );
        
        if (isSystemDir) {
          // 系统目录 - 标记为需深入分析
          this.analysisResults.recommendations.push({
            type: 'system_directory_analysis',
            name: dir.name,
            path: dir.path,
            size: dir.size,
            sizeFormatted: dir.sizeFormatted,
            suggestion: `${dir.name} 是系统目录，占用 ${dir.sizeFormatted}。需要深入分析子目录才能确定可安全删除的文件`,
            riskLevel: 'danger',
            requiresDeepAnalysis: true,
            subDirectories: [] // 可以在这里添加子目录分析
          });
        } else {
          // 用户目录 - 正常建议
          this.analysisResults.recommendations.push({
            type: 'large_directory',
            name: dir.name,
            path: dir.path,
            size: dir.size,
            sizeFormatted: dir.sizeFormatted,
            suggestion: `${dir.name} 目录占用 ${dir.sizeFormatted}，建议检查其中的大文件`,
            riskLevel: 'caution'
          });
        }
      }
    }
  }

  /**
   * 获取路径大小
   */
  async getPathSize(pathPattern) {
    // 简化处理，假设路径是具体的
    if (pathPattern.includes('*')) {
      const basePath = pathPattern.replace(/\\\*$/, '');
      let totalSize = 0;
      
      try {
        if (await fs.pathExists(basePath)) {
          const entries = await fs.readdir(basePath);
          for (const entry of entries) {
            const fullPath = path.join(basePath, entry);
            totalSize += await this.getDirectorySizeFast(fullPath);
          }
        }
      } catch (error) {
        // 忽略
      }
      
      return totalSize;
    }
    
    return this.getDirectorySizeFast(pathPattern);
  }

  /**
   * 判断是否安全删除
   */
  isSafeToDelete(filePath) {
    const unsafePatterns = [
      'Windows',
      'System32',
      'SysWOW64',
      'Program Files',
      'pagefile.sys',
      'hiberfil.sys',
      '.exe',
      '.dll'
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

  /**
   * 获取分析结果
   */
  getResults() {
    return this.analysisResults;
  }
}

module.exports = AdvancedDiskAnalyzer;
