/**
 * 简单快速扫描器
 * 使用最简单可靠的方法快速扫描磁盘
 */

const fs = require('fs-extra');
const path = require('path');

class SimpleFastScanner {
  constructor() {
    this.results = {
      categories: {},
      cleanableItems: [],
      largeFiles: [],
      totalCanClean: 0
    };
  }

  async analyze(drive = 'C:') {
    console.log(`[SimpleFastScanner] 开始扫描 ${drive}...`);
    const startTime = Date.now();

    try {
      await this.scanMainDirectories(drive);
      await this.scanJunkFiles(drive);
      await this.scanLargeFiles(drive);

      const duration = (Date.now() - startTime) / 1000;
      console.log(`[SimpleFastScanner] 扫描完成，耗时: ${duration.toFixed(1)}秒`);
      console.log(`[SimpleFastScanner] 发现可清理空间: ${this.formatBytes(this.results.totalCanClean)}`);
      
      return this.results;
    } catch (error) {
      console.error('[SimpleFastScanner] 扫描失败:', error);
      throw error;
    }
  }

  async scanMainDirectories(drive) {
    const directories = [
      { name: '系统文件', path: `${drive}\\Windows`, type: 'system' },
      { name: '应用程序', path: `${drive}\\Program Files`, type: 'application' },
      { name: '应用程序(x86)', path: `${drive}\\Program Files (x86)`, type: 'application' },
      { name: '用户文件', path: `${drive}\\Users`, type: 'user' },
      { name: '程序数据', path: `${drive}\\ProgramData`, type: 'system' }
    ];

    for (const dir of directories) {
      try {
        const size = await this.getDirectorySize(dir.path);
        this.results.categories[dir.name] = {
          size,
          sizeFormatted: this.formatBytes(size),
          type: dir.type
        };
        console.log(`[SimpleFastScanner] ${dir.name}: ${this.formatBytes(size)}`);
      } catch (error) {
        this.results.categories[dir.name] = { size: 0, sizeFormatted: '0 B', type: dir.type };
      }
    }
  }

  async getDirectorySize(dirPath, depth = 0) {
    if (depth > 3) return 0;
    
    try {
      if (!await fs.pathExists(dirPath)) return 0;
      
      let totalSize = 0;
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        try {
          const fullPath = path.join(dirPath, entry.name);
          
          if (entry.isDirectory()) {
            totalSize += await this.getDirectorySize(fullPath, depth + 1);
          } else if (entry.isFile()) {
            const stats = await fs.stat(fullPath);
            totalSize += stats.size;
          }
        } catch (error) {
          // 忽略权限错误
        }
      }
      
      return totalSize;
    } catch (error) {
      return 0;
    }
  }

  async scanJunkFiles(drive) {
    const junkLocations = [
      { name: 'Windows临时文件', path: `${drive}\\Windows\\Temp`, safe: true },
      { name: 'Windows更新缓存', path: `${drive}\\Windows\\SoftwareDistribution\\Download`, safe: true },
      { name: '回收站', path: `${drive}\\$Recycle.Bin`, safe: true }
    ];

    for (const junk of junkLocations) {
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
            description: junk.safe ? '可安全清理的垃圾文件' : '需谨慎清理',
            impact: junk.safe ? '删除后不会影响系统运行' : '删除前请确认',
            riskLevel: junk.safe ? 'safe' : 'caution',
            size,
            sizeFormatted: this.formatBytes(size),
            paths: [junk.path],
            safeToClean: junk.safe
          });
          
          if (junk.safe) {
            this.results.totalCanClean += size;
          }
          
          console.log(`[SimpleFastScanner] ${junk.name}: ${this.formatBytes(size)}`);
        }
      } catch (error) {
        // 忽略
      }
    }
  }

  async scanLargeFiles(drive) {
    try {
      const usersPath = `${drive}\\Users`;
      const entries = await fs.readdir(usersPath, { withFileTypes: true });
      
      for (const entry of entries) {
        if (!entry.isDirectory() || entry.name === 'Public') continue;
        
        const downloadsPath = path.join(usersPath, entry.name, 'Downloads');
        
        try {
          if (await fs.pathExists(downloadsPath)) {
            const files = await fs.readdir(downloadsPath, { withFileTypes: true });
            
            for (const file of files) {
              try {
                const filePath = path.join(downloadsPath, file.name);
                const stats = await fs.stat(filePath);
                
                if (stats.size > 50 * 1024 * 1024) {
                  this.results.largeFiles.push({
                    path: filePath,
                    name: file.name,
                    size: stats.size,
                    sizeFormatted: this.formatBytes(stats.size)
                  });
                  
                  this.results.cleanableItems.push({
                    id: `large_${Buffer.from(filePath).toString('base64').substring(0, 20)}`,
                    name: file.name,
                    description: `大文件: ${filePath}`,
                    impact: '删除前请确认不需要此文件',
                    riskLevel: 'caution',
                    size: stats.size,
                    sizeFormatted: this.formatBytes(stats.size),
                    paths: [filePath],
                    safeToClean: true
                  });
                  
                  console.log(`[SimpleFastScanner] 大文件: ${file.name} (${this.formatBytes(stats.size)})`);
                }
              } catch (error) {
                // 忽略
              }
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

  async getDirectorySizeSimple(dirPath) {
    try {
      if (!await fs.pathExists(dirPath)) return 0;
      
      let totalSize = 0;
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        try {
          const fullPath = path.join(dirPath, entry.name);
          
          if (entry.isDirectory()) {
            const subEntries = await fs.readdir(fullPath, { withFileTypes: true });
            for (const subEntry of subEntries) {
              try {
                const subPath = path.join(fullPath, subEntry.name);
                const stats = await fs.stat(subPath);
                totalSize += stats.size;
              } catch (error) {
                // 忽略
              }
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

  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

module.exports = SimpleFastScanner;
