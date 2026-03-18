/**
 * 终极高性能磁盘扫描器
 * 使用最优化策略实现快速、全面的磁盘扫描
 */

const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');

class UltimateScanner {
  constructor() {
    this.results = {
      categories: {},
      cleanableItems: [],
      largeFiles: [],
      totalCanClean: 0
    };
    this.userName = os.userInfo().username;
  }

  async analyze(drive = 'C:') {
    console.log(`[UltimateScanner] 开始终极扫描 ${drive}...`);
    const startTime = Date.now();

    try {
      // 并行执行所有扫描任务
      await Promise.all([
        this.scanMainDirectories(drive),
        this.scanAllJunkFiles(drive),
        this.scanAllLargeFiles(drive),
        this.scanUserDirectories(drive)
      ]);

      const duration = (Date.now() - startTime) / 1000;
      console.log(`[UltimateScanner] 扫描完成，耗时: ${duration.toFixed(1)}秒`);
      console.log(`[UltimateScanner] 发现可清理空间: ${this.formatBytes(this.results.totalCanClean)}`);
      console.log(`[UltimateScanner] 发现 ${this.results.cleanableItems.length} 个可清理项目`);
      
      return this.results;
    } catch (error) {
      console.error('[UltimateScanner] 扫描失败:', error);
      throw error;
    }
  }

  /**
   * 扫描主要目录
   */
  async scanMainDirectories(drive) {
    console.log('[UltimateScanner] 扫描主要目录...');
    
    const dirs = [
      { name: '系统文件', path: `${drive}\\Windows`, type: 'system' },
      { name: '应用程序', path: `${drive}\\Program Files`, type: 'application' },
      { name: '应用程序(x86)', path: `${drive}\\Program Files (x86)`, type: 'application' },
      { name: '用户文件', path: `${drive}\\Users`, type: 'user' },
      { name: '程序数据', path: `${drive}\\ProgramData`, type: 'system' }
    ];

    // 并行扫描所有目录
    const promises = dirs.map(async (dir) => {
      try {
        const size = await this.fastGetSize(dir.path);
        this.results.categories[dir.name] = {
          size,
          sizeFormatted: this.formatBytes(size),
          type: dir.type
        };
        console.log(`[UltimateScanner] ${dir.name}: ${this.formatBytes(size)}`);
      } catch (e) {
        this.results.categories[dir.name] = { size: 0, sizeFormatted: '0 B', type: dir.type };
      }
    });

    await Promise.all(promises);
  }

  /**
   * 扫描所有垃圾文件
   */
  async scanAllJunkFiles(drive) {
    console.log('[UltimateScanner] 扫描所有垃圾文件...');

    const junkList = [
      // Windows 系统垃圾
      { name: 'Windows临时文件', path: `${drive}\\Windows\\Temp`, safe: true, desc: 'Windows系统临时文件' },
      { name: 'Windows更新缓存', path: `${drive}\\Windows\\SoftwareDistribution\\Download`, safe: true, desc: 'Windows更新下载缓存' },
      { name: 'Windows预读取', path: `${drive}\\Windows\\Prefetch`, safe: true, desc: 'Windows预读取文件' },
      { name: 'Windows错误报告', path: `${drive}\\ProgramData\\Microsoft\\Windows\\WER`, safe: true, desc: 'Windows错误报告' },
      { name: 'Windows日志', path: `${drive}\\Windows\\Logs`, safe: false, desc: 'Windows系统日志' },
      { name: '崩溃转储', path: `${drive}\\Windows\\Minidump`, safe: false, desc: '系统崩溃转储' },
      { name: 'Windows Installer缓存', path: `${drive}\\Windows\\Installer`, safe: false, desc: 'Windows安装程序缓存' },
      
      // 回收站
      { name: '回收站', path: `${drive}\\$Recycle.Bin`, safe: true, desc: '回收站文件' },
      
      // 用户缓存
      { name: '缩略图缓存', path: `${drive}\\Users\\${this.userName}\\AppData\\Local\\Microsoft\\Windows\\Explorer`, safe: true, desc: '缩略图缓存' },
      { name: '用户临时文件', path: `${drive}\\Users\\${this.userName}\\AppData\\Local\\Temp`, safe: true, desc: '用户临时文件' },
      
      // 浏览器缓存
      { name: 'Chrome缓存', path: `${drive}\\Users\\${this.userName}\\AppData\\Local\\Google\\Chrome\\User Data\\Default\\Cache`, safe: true, desc: 'Chrome浏览器缓存' },
      { name: 'Edge缓存', path: `${drive}\\Users\\${this.userName}\\AppData\\Local\\Microsoft\\Edge\\User Data\\Default\\Cache`, safe: true, desc: 'Edge浏览器缓存' },
      { name: 'Firefox缓存', path: `${drive}\\Users\\${this.userName}\\AppData\\Local\\Mozilla\\Firefox\\Profiles`, safe: true, desc: 'Firefox浏览器缓存' },
      
      // 应用缓存
      { name: 'Windows升级缓存', path: `${drive}\\Windows.old`, safe: true, desc: 'Windows升级旧文件' },
      { name: 'Windows备份', path: `${drive}\\Windows\\WinSxS\\Backup`, safe: false, desc: 'Windows组件备份' }
    ];

    // 并行扫描所有垃圾文件位置
    const promises = junkList.map(async (junk) => {
      try {
        if (await fs.pathExists(junk.path)) {
          const size = await this.fastGetSize(junk.path);
          
          if (size > 1 * 1024 * 1024) { // 大于1MB就显示
            this.addCleanableItem(junk.name, size, junk.safe, junk.desc, junk.path);
          }
        }
      } catch (e) {}
    });

    await Promise.all(promises);
  }

  /**
   * 扫描用户目录
   */
  async scanUserDirectories(drive) {
    console.log('[UltimateScanner] 扫描用户目录...');
    
    try {
      const usersPath = `${drive}\\Users`;
      const entries = await fs.readdir(usersPath, { withFileTypes: true });
      
      for (const entry of entries) {
        if (!entry.isDirectory() || entry.name === 'Public' || entry.name.startsWith('.')) continue;
        
        // 扫描用户的各个目录
        const userDirs = [
          { name: 'Downloads', desc: '下载文件' },
          { name: 'Documents', desc: '文档' },
          { name: 'Desktop', desc: '桌面' },
          { name: 'Videos', desc: '视频' },
          { name: 'Pictures', desc: '图片' },
          { name: 'Music', desc: '音乐' }
        ];

        for (const userDir of userDirs) {
          const dirPath = path.join(usersPath, entry.name, userDir.name);
          
          try {
            if (await fs.pathExists(dirPath)) {
              const size = await this.fastGetSize(dirPath);
              
              if (size > 100 * 1024 * 1024) { // 大于100MB
                const itemName = `${entry.name}的${userDir.desc}`;
                this.addCleanableItem(itemName, size, true, `${entry.name}用户的${userDir.desc}`, dirPath);
              }
            }
          } catch (e) {}
        }
      }
    } catch (e) {}
  }

  /**
   * 扫描所有大文件
   */
  async scanAllLargeFiles(drive) {
    console.log('[UltimateScanner] 扫描大文件...');
    
    try {
      // 使用 PowerShell 快速查找大文件
      const cmd = `powershell -NoProfile -Command "Get-ChildItem -Path '${drive}\\Users' -Recurse -File -Force -ErrorAction SilentlyContinue | Where-Object { $_.Length -gt 100MB -and $_.FullName -notmatch 'AppData|\\\\\.|NTUSER' } | Sort-Object Length -Descending | Select-Object -First 30 FullName, Length, LastWriteTime | ConvertTo-Json"`;
      
      const result = execSync(cmd, { encoding: 'utf8', timeout: 60000, maxBuffer: 20 * 1024 * 1024 });
      
      if (result.trim()) {
        let files = JSON.parse(result);
        if (!Array.isArray(files)) files = files ? [files] : [];
        
        for (const file of files) {
          if (!file || !file.FullName) continue;
          
          const fileName = path.basename(file.FullName);
          
          this.results.largeFiles.push({
            path: file.FullName,
            name: fileName,
            size: file.Length,
            sizeFormatted: this.formatBytes(file.Length),
            modifiedTime: file.LastWriteTime
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
          
          console.log(`[UltimateScanner] 大文件: ${fileName} (${this.formatBytes(file.Length)})`);
        }
      }
    } catch (error) {
      console.log('[UltimateScanner] 大文件扫描失败:', error.message);
    }
  }

  /**
   * 快速获取目录大小
   */
  async fastGetSize(dirPath) {
    try {
      if (!await fs.pathExists(dirPath)) return 0;
      
      const cmd = `powershell -NoProfile -Command "(Get-ChildItem -Path '${dirPath}' -Recurse -Force -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum"`;
      const result = execSync(cmd, { encoding: 'utf8', timeout: 60000, maxBuffer: 50 * 1024 * 1024 });
      return parseInt(result.trim()) || 0;
    } catch (e) {
      return await this.recursiveGetSize(dirPath, 0);
    }
  }

  /**
   * 递归获取目录大小（备用）
   */
  async recursiveGetSize(dirPath, depth) {
    if (depth > 4) return 0;
    
    try {
      if (!await fs.pathExists(dirPath)) return 0;
      
      let totalSize = 0;
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        try {
          const fullPath = path.join(dirPath, entry.name);
          
          if (entry.isDirectory()) {
            totalSize += await this.recursiveGetSize(fullPath, depth + 1);
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
   * 添加可清理项目
   */
  addCleanableItem(name, size, safe, desc, path) {
    this.results.categories[name] = {
      size,
      sizeFormatted: this.formatBytes(size),
      type: 'junk',
      safeToClean: safe
    };
    
    this.results.cleanableItems.push({
      id: `junk_${name.replace(/\s+/g, '_').toLowerCase()}`,
      name,
      description: desc,
      impact: safe ? '删除后不会影响系统运行' : '删除前请确认不需要这些文件',
      riskLevel: safe ? 'safe' : 'caution',
      size,
      sizeFormatted: this.formatBytes(size),
      paths: [path],
      safeToClean: safe
    });
    
    if (safe) {
      this.results.totalCanClean += size;
    }
    
    console.log(`[UltimateScanner] ${name}: ${this.formatBytes(size)}`);
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

module.exports = UltimateScanner;
