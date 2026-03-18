/**
 * 高性能并行扫描器
 * 使用 Promise.all 并行扫描，简单可靠
 */

const fs = require('fs-extra');
const path = require('path');

class ParallelScanner {
  constructor() {
    this.results = {
      categories: {},
      cleanableItems: [],
      largeFiles: [],
      totalCanClean: 0
    };
  }

  async analyze(drive = 'C:') {
    console.log(`[ParallelScanner] 开始并行扫描 ${drive}...`);
    const startTime = Date.now();

    try {
      // 并行执行所有扫描任务
      const [dirResults, junkResults, largeFileResults] = await Promise.all([
        this.scanDirectoriesParallel(drive),
        this.scanJunkFilesParallel(drive),
        this.scanLargeFilesParallel(drive)
      ]);

      // 合并结果
      for (const result of dirResults) {
        if (result && result.size > 0) {
          this.results.categories[result.name] = {
            size: result.size,
            sizeFormatted: this.formatBytes(result.size),
            type: result.type
          };
        }
      }

      const duration = (Date.now() - startTime) / 1000;
      console.log(`[ParallelScanner] 扫描完成，耗时: ${duration.toFixed(1)}秒`);
      console.log(`[ParallelScanner] 发现可清理空间: ${this.formatBytes(this.results.totalCanClean)}`);
      
      return this.results;
    } catch (error) {
      console.error('[ParallelScanner] 扫描失败:', error);
      throw error;
    }
  }

  /**
   * 并行扫描主要目录
   */
  async scanDirectoriesParallel(drive) {
    const directories = [
      { name: '系统文件', path: `${drive}\\Windows`, type: 'system' },
      { name: '应用程序', path: `${drive}\\Program Files`, type: 'application' },
      { name: '应用程序(x86)', path: `${drive}\\Program Files (x86)`, type: 'application' },
      { name: '用户文件', path: `${drive}\\Users`, type: 'user' },
      { name: '程序数据', path: `${drive}\\ProgramData`, type: 'system' }
    ];

    return Promise.all(directories.map(dir => this.scanDirectory(dir)));
  }

  /**
   * 扫描单个目录
   */
  async scanDirectory(dir) {
    try {
      const size = await this.getDirectorySize(dir.path);
      console.log(`[ParallelScanner] ${dir.name}: ${this.formatBytes(size)}`);
      return { name: dir.name, size, type: dir.type };
    } catch (error) {
      console.log(`[ParallelScanner] ${dir.name}: 扫描失败`);
      return { name: dir.name, size: 0, type: dir.type };
    }
  }

  /**
   * 获取目录大小（异步递归）
   */
  async getDirectorySize(dirPath, depth = 0) {
    if (depth > 6) return 0; // 增加深度到6层
    
    try {
      if (!await fs.pathExists(dirPath)) return 0;
      
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      // 并行处理所有条目，增加数量到500
      const promises = entries.slice(0, 500).map(async (entry) => {
        try {
          const fullPath = path.join(dirPath, entry.name);
          
          if (entry.isDirectory()) {
            return await this.getDirectorySize(fullPath, depth + 1);
          } else if (entry.isFile()) {
            const stats = await fs.stat(fullPath);
            return stats.size;
          }
        } catch (error) {
          return 0;
        }
        return 0;
      });
      
      const sizes = await Promise.all(promises);
      return sizes.reduce((sum, size) => sum + size, 0);
    } catch (error) {
      return 0;
    }
  }

  /**
   * 并行扫描垃圾文件
   */
  async scanJunkFilesParallel(drive) {
    const junkLocations = [
      { name: 'Windows临时文件', path: `${drive}\\Windows\\Temp`, safe: true },
      { name: 'Windows更新缓存', path: `${drive}\\Windows\\SoftwareDistribution\\Download`, safe: true },
      { name: '回收站', path: `${drive}\\$Recycle.Bin`, safe: true },
      { name: '缩略图缓存', path: `${drive}\\Users\\Administrator\\AppData\\Local\\Microsoft\\Windows\\Explorer`, safe: true }
    ];

    return Promise.all(junkLocations.map(junk => this.scanJunkFile(junk)));
  }

  /**
   * 扫描单个垃圾文件位置
   */
  async scanJunkFile(junk) {
    try {
      const size = await this.getDirectorySizeSimple(junk.path);
      
      if (size > 10 * 1024 * 1024) {
        this.results.categories[junk.name] = {
          size,
          sizeFormatted: this.formatBytes(size),
          type: 'junk',
          safeToClean: junk.safe
        };
        
        this.results.cleanableItems.push({
          id: `junk_${junk.name.replace(/\s+/g, '_').toLowerCase()}`,
          name: junk.name,
          description: '可安全清理的垃圾文件',
          impact: '删除后不会影响系统运行',
          riskLevel: 'safe',
          size,
          sizeFormatted: this.formatBytes(size),
          paths: [junk.path],
          safeToClean: true
        });
        
        if (junk.safe) {
          this.results.totalCanClean += size;
        }
        
        console.log(`[ParallelScanner] ${junk.name}: ${this.formatBytes(size)}`);
      }
    } catch (error) {
      // 忽略
    }
  }

  /**
   * 简单获取目录大小
   */
  async getDirectorySizeSimple(dirPath) {
    try {
      if (!await fs.pathExists(dirPath)) return 0;
      
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      const promises = entries.map(async (entry) => {
        try {
          const fullPath = path.join(dirPath, entry.name);
          
          if (entry.isDirectory()) {
            const subEntries = await fs.readdir(fullPath, { withFileTypes: true });
            return subEntries.reduce(async (sumPromise, subEntry) => {
              const sum = await sumPromise;
              try {
                const subPath = path.join(fullPath, subEntry.name);
                const stats = await fs.stat(subPath);
                return sum + stats.size;
              } catch (error) {
                return sum;
              }
            }, Promise.resolve(0));
          } else if (entry.isFile()) {
            const stats = await fs.stat(fullPath);
            return stats.size;
          }
        } catch (error) {
          return 0;
        }
        return 0;
      });
      
      const sizes = await Promise.all(promises);
      return sizes.reduce((sum, size) => sum + size, 0);
    } catch (error) {
      return 0;
    }
  }

  /**
   * 并行扫描大文件
   */
  async scanLargeFilesParallel(drive) {
    try {
      const usersPath = `${drive}\\Users`;
      const entries = await fs.readdir(usersPath, { withFileTypes: true });
      
      const promises = entries
        .filter(entry => entry.isDirectory() && entry.name !== 'Public')
        .map(entry => this.scanUserLargeFiles(path.join(usersPath, entry.name), entry.name));
      
      return Promise.all(promises);
    } catch (error) {
      return [];
    }
  }

  /**
   * 扫描用户大文件
   */
  async scanUserLargeFiles(userPath, userName) {
    try {
      const downloadsPath = path.join(userPath, 'Downloads');
      
      if (!await fs.pathExists(downloadsPath)) return;
      
      const entries = await fs.readdir(downloadsPath, { withFileTypes: true });
      
      for (const entry of entries) {
        try {
          const filePath = path.join(downloadsPath, entry.name);
          const stats = await fs.stat(filePath);
          
          if (stats.size > 50 * 1024 * 1024) {
            this.results.largeFiles.push({
              path: filePath,
              name: entry.name,
              size: stats.size,
              sizeFormatted: this.formatBytes(stats.size)
            });
            
            this.results.cleanableItems.push({
              id: `large_${Buffer.from(filePath).toString('base64').substring(0, 20)}`,
              name: entry.name,
              description: `${userName}的大文件: ${filePath}`,
              impact: '删除前请确认不需要此文件',
              riskLevel: 'caution',
              size: stats.size,
              sizeFormatted: this.formatBytes(stats.size),
              paths: [filePath],
              safeToClean: true
            });
            
            console.log(`[ParallelScanner] 大文件: ${entry.name} (${this.formatBytes(stats.size)})`);
          }
        } catch (error) {
          // 忽略
        }
      }
    } catch (error) {
      // 忽略
    }
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

module.exports = ParallelScanner;
