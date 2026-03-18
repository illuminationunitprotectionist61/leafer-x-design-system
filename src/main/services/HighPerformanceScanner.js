/**
 * 高性能磁盘扫描器
 * 使用 Windows 命令行工具快速扫描
 */

const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

class HighPerformanceScanner {
  constructor() {
    this.results = {
      categories: {},
      cleanableItems: [],
      largeFiles: [],
      totalCanClean: 0
    };
  }

  async analyze(drive = 'C:') {
    console.log(`[HighPerformanceScanner] 开始高性能扫描 ${drive}...`);
    const startTime = Date.now();

    try {
      // 并行执行所有扫描
      await Promise.all([
        this.scanDirectories(drive),
        this.scanJunkFiles(drive),
        this.scanLargeFiles(drive)
      ]);

      const duration = (Date.now() - startTime) / 1000;
      console.log(`[HighPerformanceScanner] 扫描完成，耗时: ${duration.toFixed(1)}秒`);
      console.log(`[HighPerformanceScanner] 发现可清理空间: ${this.formatBytes(this.results.totalCanClean)}`);
      console.log(`[HighPerformanceScanner] 发现 ${this.results.cleanableItems.length} 个可清理项目`);
      
      return this.results;
    } catch (error) {
      console.error('[HighPerformanceScanner] 扫描失败:', error);
      throw error;
    }
  }

  /**
   * 扫描主要目录
   */
  async scanDirectories(drive) {
    console.log('[HighPerformanceScanner] 扫描主要目录...');
    
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
        console.log(`[HighPerformanceScanner] ${dir.name}: ${this.formatBytes(size)}`);
      } catch (error) {
        console.log(`[HighPerformanceScanner] ${dir.name}: 扫描失败 - ${error.message}`);
        this.results.categories[dir.name] = { size: 0, sizeFormatted: '0 B', type: dir.type };
      }
    }
  }

  /**
   * 获取目录大小（使用 PowerShell）
   */
  async getDirectorySize(dirPath) {
    try {
      if (!await fs.pathExists(dirPath)) return 0;
      
      // 使用 PowerShell 的 Get-ChildItem
      const cmd = `powershell -NoProfile -Command "(Get-ChildItem -Path '${dirPath}' -Recurse -Force -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum"`;
      const result = execSync(cmd, { encoding: 'utf8', timeout: 60000, maxBuffer: 50 * 1024 * 1024 });
      const size = parseInt(result.trim()) || 0;
      return size;
    } catch (error) {
      // 如果 PowerShell 失败，使用 Node.js 递归
      return await this.getDirectorySizeRecursive(dirPath, 0);
    }
  }

  /**
   * 递归获取目录大小
   */
  async getDirectorySizeRecursive(dirPath, depth) {
    if (depth > 5) return 0;
    
    try {
      if (!await fs.pathExists(dirPath)) return 0;
      
      let totalSize = 0;
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        try {
          const fullPath = path.join(dirPath, entry.name);
          
          if (entry.isDirectory()) {
            totalSize += await this.getDirectorySizeRecursive(fullPath, depth + 1);
          } else if (entry.isFile()) {
            const stats = await fs.stat(fullPath);
            totalSize += stats.size;
          }
        } catch (e) {}
      }
      
      return totalSize;
    } catch (e) {
      return 0;
    }
  }

  /**
   * 扫描垃圾文件
   */
  async scanJunkFiles(drive) {
    console.log('[HighPerformanceScanner] 扫描垃圾文件...');
    
    const junkLocations = [
      { name: 'Windows临时文件', path: `${drive}\\Windows\\Temp`, safe: true },
      { name: 'Windows更新缓存', path: `${drive}\\Windows\\SoftwareDistribution\\Download`, safe: true },
      { name: 'Windows预读取', path: `${drive}\\Windows\\Prefetch`, safe: true },
      { name: 'Windows错误报告', path: `${drive}\\ProgramData\\Microsoft\\Windows\\WER`, safe: true },
      { name: '回收站', path: `${drive}\\$Recycle.Bin`, safe: true },
      { name: '缩略图缓存', path: `${drive}\\Users\\Administrator\\AppData\\Local\\Microsoft\\Windows\\Explorer`, safe: true },
      { name: '系统日志', path: `${drive}\\Windows\\Logs`, safe: false },
      { name: '崩溃转储', path: `${drive}\\Windows\\Minidump`, safe: false },
      { name: 'Windows Installer缓存', path: `${drive}\\Windows\\Installer`, safe: false }
    ];

    for (const junk of junkLocations) {
      try {
        const size = await this.getJunkSize(junk.path);
        
        if (size > 5 * 1024 * 1024) { // 大于5MB
          this.results.categories[junk.name] = {
            size,
            sizeFormatted: this.formatBytes(size),
            type: 'junk',
            safeToClean: junk.safe
          };
          
          this.results.cleanableItems.push({
            id: `junk_${junk.name.replace(/\s+/g, '_').toLowerCase()}`,
            name: junk.name,
            description: '系统垃圾文件',
            impact: junk.safe ? '删除后不会影响系统运行' : '删除前请确认不需要这些文件',
            riskLevel: junk.safe ? 'safe' : 'caution',
            size,
            sizeFormatted: this.formatBytes(size),
            paths: [junk.path],
            safeToClean: junk.safe
          });
          
          if (junk.safe) {
            this.results.totalCanClean += size;
          }
          
          console.log(`[HighPerformanceScanner] ${junk.name}: ${this.formatBytes(size)}`);
        }
      } catch (error) {
        // 忽略
      }
    }

    // 扫描用户临时文件
    await this.scanUserTempFiles(drive);
    
    // 扫描浏览器缓存
    await this.scanBrowserCache(drive);
  }

  /**
   * 获取垃圾文件大小
   */
  async getJunkSize(dirPath) {
    try {
      if (!await fs.pathExists(dirPath)) return 0;
      
      const cmd = `powershell -NoProfile -Command "(Get-ChildItem -Path '${dirPath}' -Recurse -Force -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum"`;
      const result = execSync(cmd, { encoding: 'utf8', timeout: 30000 });
      return parseInt(result.trim()) || 0;
    } catch (error) {
      return await this.getDirectorySizeRecursive(dirPath, 0);
    }
  }

  /**
   * 扫描用户临时文件
   */
  async scanUserTempFiles(drive) {
    try {
      const usersPath = `${drive}\\Users`;
      const entries = await fs.readdir(usersPath, { withFileTypes: true });
      
      for (const entry of entries) {
        if (!entry.isDirectory() || entry.name === 'Public' || entry.name.startsWith('.')) continue;
        
        const tempPath = path.join(usersPath, entry.name, 'AppData', 'Local', 'Temp');
        
        try {
          if (await fs.pathExists(tempPath)) {
            const size = await this.getJunkSize(tempPath);
            
            if (size > 5 * 1024 * 1024) {
              const itemName = `${entry.name}的临时文件`;
              
              this.results.categories[itemName] = {
                size,
                sizeFormatted: this.formatBytes(size),
                type: 'junk',
                safeToClean: true
              };
              
              this.results.cleanableItems.push({
                id: `temp_${entry.name.toLowerCase()}`,
                name: itemName,
                description: `${entry.name}用户的临时文件`,
                impact: '删除后不会影响系统运行',
                riskLevel: 'safe',
                size,
                sizeFormatted: this.formatBytes(size),
                paths: [tempPath],
                safeToClean: true
              });
              
              this.results.totalCanClean += size;
              
              console.log(`[HighPerformanceScanner] ${itemName}: ${this.formatBytes(size)}`);
            }
          }
        } catch (e) {}
      }
    } catch (e) {}
  }

  /**
   * 扫描浏览器缓存
   */
  async scanBrowserCache(drive) {
    const cachePaths = [
      { name: 'Chrome缓存', path: `${drive}\\Users\\Administrator\\AppData\\Local\\Google\\Chrome\\User Data\\Default\\Cache` },
      { name: 'Edge缓存', path: `${drive}\\Users\\Administrator\\AppData\\Local\\Microsoft\\Edge\\User Data\\Default\\Cache` },
      { name: 'Firefox缓存', path: `${drive}\\Users\\Administrator\\AppData\\Local\\Mozilla\\Firefox\\Profiles` }
    ];

    for (const cache of cachePaths) {
      try {
        if (await fs.pathExists(cache.path)) {
          const size = await this.getJunkSize(cache.path);
          
          if (size > 10 * 1024 * 1024) {
            this.results.categories[cache.name] = {
              size,
              sizeFormatted: this.formatBytes(size),
              type: 'junk',
              safeToClean: true
            };
            
            this.results.cleanableItems.push({
              id: `cache_${cache.name.replace(/\s+/g, '_').toLowerCase()}`,
              name: cache.name,
              description: '浏览器缓存文件',
              impact: '删除后浏览器需要重新加载网页资源',
              riskLevel: 'safe',
              size,
              sizeFormatted: this.formatBytes(size),
              paths: [cache.path],
              safeToClean: true
            });
            
            this.results.totalCanClean += size;
            
            console.log(`[HighPerformanceScanner] ${cache.name}: ${this.formatBytes(size)}`);
          }
        }
      } catch (e) {}
    }
  }

  /**
   * 扫描大文件
   */
  async scanLargeFiles(drive) {
    console.log('[HighPerformanceScanner] 扫描大文件...');
    
    try {
      const cmd = `powershell -NoProfile -Command "Get-ChildItem -Path '${drive}\\Users' -Recurse -File -Force -ErrorAction SilentlyContinue | Where-Object { $_.Length -gt 50MB } | Sort-Object Length -Descending | Select-Object -First 20 FullName, Length | ConvertTo-Json"`;
      const result = execSync(cmd, { encoding: 'utf8', timeout: 60000, maxBuffer: 10 * 1024 * 1024 });
      
      if (result.trim()) {
        let files = JSON.parse(result);
        if (!Array.isArray(files)) files = [files];
        
        for (const file of files) {
          if (!file || !file.FullName) continue;
          
          const fileName = path.basename(file.FullName);
          
          this.results.largeFiles.push({
            path: file.FullName,
            name: fileName,
            size: file.Length,
            sizeFormatted: this.formatBytes(file.Length)
          });
          
          this.results.cleanableItems.push({
            id: `large_${Buffer.from(file.FullName).toString('base64').substring(0, 20)}`,
            name: fileName,
            description: `大文件: ${file.FullName}`,
            impact: '删除前请确认不需要此文件',
            riskLevel: 'caution',
            size: file.Length,
            sizeFormatted: this.formatBytes(file.Length),
            paths: [file.FullName],
            safeToClean: true
          });
          
          console.log(`[HighPerformanceScanner] 大文件: ${fileName} (${this.formatBytes(file.Length)})`);
        }
      }
    } catch (error) {
      console.log('[HighPerformanceScanner] 大文件扫描失败:', error.message);
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

module.exports = HighPerformanceScanner;
