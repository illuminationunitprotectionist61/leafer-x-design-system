/**
 * 全面快速扫描器
 * 使用多线程和批量处理快速扫描整个磁盘
 */

const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

class ComprehensiveScanner {
  constructor() {
    this.results = {
      categories: {},
      cleanableItems: [],
      largeFiles: [],
      totalCanClean: 0
    };
    this.minSizeToReport = 50 * 1024 * 1024; // 50MB
  }

  /**
   * 执行全面快速扫描（15-20秒）
   */
  async analyze(drive = 'C:') {
    console.log(`[ComprehensiveScanner] 开始全面扫描 ${drive}...`);
    const startTime = Date.now();

    try {
      // 1. 使用 PowerShell 批量获取所有目录大小（5-8秒）
      await this.scanAllDirectories(drive);
      
      // 2. 扫描所有垃圾文件位置（5-8秒）
      await this.scanAllJunkFiles(drive);
      
      // 3. 扫描所有用户的大文件（3-5秒）
      await this.scanAllUserFiles(drive);

      const duration = (Date.now() - startTime) / 1000;
      console.log(`[ComprehensiveScanner] 扫描完成，耗时: ${duration.toFixed(1)}秒`);
      console.log(`[ComprehensiveScanner] 发现可清理空间: ${this.formatBytes(this.results.totalCanClean)}`);
      console.log(`[ComprehensiveScanner] 发现 ${this.results.cleanableItems.length} 个可清理项目`);
      
      return this.results;
    } catch (error) {
      console.error('[ComprehensiveScanner] 扫描失败:', error);
      throw error;
    }
  }

  /**
   * 扫描所有主要目录（使用 PowerShell，一次性获取）
   */
  async scanAllDirectories(drive) {
    console.log('[ComprehensiveScanner] 扫描所有目录...');
    
    try {
      // 使用 PowerShell 一次性获取所有主要目录的大小
      const script = `
        $dirs = @(
          @{Name='系统文件'; Path='${drive}\\Windows'; Type='system'},
          @{Name='应用程序'; Path='${drive}\\Program Files'; Type='application'},
          @{Name='应用程序(x86)'; Path='${drive}\\Program Files (x86)'; Type='application'},
          @{Name='用户文件'; Path='${drive}\\Users'; Type='user'},
          @{Name='程序数据'; Path='${drive}\\ProgramData'; Type='system'}
        )
        
        $results = @()
        foreach ($dir in $dirs) {
          if (Test-Path $dir.Path) {
            $size = (Get-ChildItem -Path $dir.Path -Recurse -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
            $results += [PSCustomObject]@{
              Name = $dir.Name
              Size = $size
              Type = $dir.Type
            }
          }
        }
        $results | ConvertTo-Json
      `;
      
      const cmd = `powershell -Command "${script.replace(/"/g, '\"')}"`;
      const result = execSync(cmd, { encoding: 'utf8', timeout: 15000 });
      
      const dirs = JSON.parse(result);
      
      if (Array.isArray(dirs)) {
        for (const dir of dirs) {
          this.results.categories[dir.Name] = {
            size: dir.Size,
            sizeFormatted: this.formatBytes(dir.Size),
            type: dir.Type
          };
          console.log(`[ComprehensiveScanner] ${dir.Name}: ${this.formatBytes(dir.Size)}`);
        }
      }
    } catch (error) {
      console.log('[ComprehensiveScanner] PowerShell 扫描失败，使用备用方法:', error.message);
      await this.scanDirectoriesFallback(drive);
    }
  }

  /**
   * 备用目录扫描方法
   */
  async scanDirectoriesFallback(drive) {
    const dirs = [
      { name: '系统文件', path: `${drive}\\Windows`, type: 'system' },
      { name: '应用程序', path: `${drive}\\Program Files`, type: 'application' },
      { name: '应用程序(x86)', path: `${drive}\\Program Files (x86)`, type: 'application' },
      { name: '用户文件', path: `${drive}\\Users`, type: 'user' },
      { name: '程序数据', path: `${drive}\\ProgramData`, type: 'system' }
    ];

    for (const dir of dirs) {
      try {
        const size = await this.getDirectorySize(dir.path);
        this.results.categories[dir.name] = {
          size,
          sizeFormatted: this.formatBytes(size),
          type: dir.type
        };
      } catch (error) {
        this.results.categories[dir.name] = { size: 0, sizeFormatted: '0 B', type: dir.type };
      }
    }
  }

  /**
   * 获取目录大小
   */
  async getDirectorySize(dirPath) {
    try {
      if (!await fs.pathExists(dirPath)) return 0;
      
      // 使用 Windows dir 命令
      const cmd = `dir /s "${dirPath}" 2>nul | findstr "File(s)"`;
      const result = execSync(cmd, { encoding: 'utf8', timeout: 10000 });
      const match = result.match(/([\d,]+)\s+bytes/);
      if (match) {
        return parseInt(match[1].replace(/,/g, ''));
      }
      return 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * 扫描所有垃圾文件位置
   */
  async scanAllJunkFiles(drive) {
    console.log('[ComprehensiveScanner] 扫描所有垃圾文件...');
    
    const junkLocations = [
      // Windows 系统垃圾
      { name: 'Windows临时文件', path: `${drive}\\Windows\\Temp`, safe: true },
      { name: 'Windows预读取文件', path: `${drive}\\Windows\\Prefetch`, safe: true },
      { name: 'Windows更新缓存', path: `${drive}\\Windows\\SoftwareDistribution\\Download`, safe: true },
      { name: 'Windows错误报告', path: `${drive}\\ProgramData\\Microsoft\\Windows\\WER`, safe: true },
      { name: 'Windows日志', path: `${drive}\\Windows\\Logs`, safe: false },
      { name: '崩溃转储文件', path: `${drive}\\Windows\\Minidump`, safe: false },
      
      // 浏览器缓存
      { name: 'Chrome缓存', path: `${drive}\\Users\\*\\AppData\\Local\\Google\\Chrome\\User Data\\*\\Cache`, safe: true, isWildcard: true },
      { name: 'Edge缓存', path: `${drive}\\Users\\*\\AppData\\Local\\Microsoft\\Edge\\User Data\\*\\Cache`, safe: true, isWildcard: true },
      { name: 'Firefox缓存', path: `${drive}\\Users\\*\\AppData\\Local\\Mozilla\\Firefox\\Profiles\\*\\cache2`, safe: true, isWildcard: true },
      
      // 缩略图缓存
      { name: '缩略图缓存', path: `${drive}\\Users\\*\\AppData\\Local\\Microsoft\\Windows\\Explorer`, safe: true, isWildcard: true },
      
      // 回收站
      { name: '回收站', path: `${drive}\\$Recycle.Bin`, safe: true }
    ];

    for (const junk of junkLocations) {
      try {
        let size = 0;
        
        if (junk.isWildcard) {
          // 处理通配符路径
          size = await this.scanWildcardPath(junk.path);
        } else {
          size = await this.getDirectorySize(junk.path);
        }
        
        if (size > this.minSizeToReport) {
          this.addCleanableItem(junk.name, size, junk.safe, '系统垃圾文件');
        }
      } catch (error) {
        // 忽略
      }
    }

    // 扫描所有用户的临时文件
    await this.scanAllUserTempFiles(drive);
  }

  /**
   * 扫描通配符路径
   */
  async scanWildcardPath(pattern) {
    let totalSize = 0;
    
    try {
      // 将通配符转换为 PowerShell 命令
      const basePath = pattern.replace(/\\\*\\/g, '\\');
      const cmd = `powershell -Command "
        Get-ChildItem -Path '${basePath}' -Recurse -ErrorAction SilentlyContinue | 
        Measure-Object -Property Length -Sum | 
        Select-Object -ExpandProperty Sum
      "`;
      
      const result = execSync(cmd, { encoding: 'utf8', timeout: 5000 });
      totalSize = parseInt(result.trim()) || 0;
    } catch (error) {
      // 忽略
    }
    
    return totalSize;
  }

  /**
   * 扫描所有用户的临时文件
   */
  async scanAllUserTempFiles(drive) {
    try {
      const usersPath = `${drive}\\Users`;
      const entries = await fs.readdir(usersPath, { withFileTypes: true });
      
      for (const entry of entries) {
        if (!entry.isDirectory() || entry.name === 'Public') continue;
        
        // 扫描各种临时文件位置
        const tempPaths = [
          path.join(usersPath, entry.name, 'AppData', 'Local', 'Temp'),
          path.join(usersPath, entry.name, 'AppData', 'Local', 'Microsoft', 'Windows', 'INetCache'),
          path.join(usersPath, entry.name, 'AppData', 'Local', 'Microsoft', 'Windows', 'Temporary Internet Files'),
          path.join(usersPath, entry.name, 'Downloads'), // 下载文件夹
          path.join(usersPath, entry.name, 'Documents'), // 文档文件夹
        ];
        
        for (const tempPath of tempPaths) {
          try {
            const size = await this.getDirectorySize(tempPath);
            
            if (size > this.minSizeToReport) {
              const folderName = path.basename(tempPath);
              let itemName = '';
              let description = '';
              
              if (folderName === 'Temp') {
                itemName = `${entry.name}的临时文件`;
                description = `${entry.name}用户的临时文件`;
              } else if (folderName === 'Downloads') {
                itemName = `${entry.name}的下载文件`;
                description = `${entry.name}用户的下载文件`;
              } else if (folderName === 'Documents') {
                itemName = `${entry.name}的文档`;
                description = `${entry.name}用户的文档`;
              } else {
                itemName = `${entry.name}的${folderName}`;
                description = `${entry.name}用户的${folderName}`;
              }
              
              this.addCleanableItem(itemName, size, true, description);
            }
          } catch (error) {
            // 忽略
          }
        }
      }
    } catch (error) {
      console.log('[ComprehensiveScanner] 扫描用户临时文件失败:', error.message);
    }
  }

  /**
   * 扫描所有用户的大文件
   */
  async scanAllUserFiles(drive) {
    console.log('[ComprehensiveScanner] 扫描用户大文件...');
    
    try {
      // 使用 PowerShell 一次性查找所有大文件
      const script = `
        Get-ChildItem -Path '${drive}\\Users' -Recurse -File -ErrorAction SilentlyContinue | 
        Where-Object { $_.Length -gt 100MB } | 
        Sort-Object Length -Descending | 
        Select-Object -First 50 FullName, Length, LastWriteTime, Directory |
        ConvertTo-Json
      `;
      
      const cmd = `powershell -Command "${script.replace(/"/g, '\"')}"`;
      const result = execSync(cmd, { encoding: 'utf8', timeout: 15000 });
      
      const files = JSON.parse(result);
      
      if (Array.isArray(files)) {
        for (const file of files) {
          if (this.isSafeToDelete(file.FullName)) {
            this.results.largeFiles.push({
              path: file.FullName,
              name: path.basename(file.FullName),
              size: file.Length,
              sizeFormatted: this.formatBytes(file.Length),
              modifiedTime: file.LastWriteTime
            });
            
            // 添加到可清理项目
            this.results.cleanableItems.push({
              id: `large_${Buffer.from(file.FullName).toString('base64').substring(0, 20)}`,
              name: path.basename(file.FullName),
              description: `大文件: ${file.FullName}`,
              impact: '删除前请确认不需要此文件',
              riskLevel: 'caution',
              size: file.Length,
              sizeFormatted: this.formatBytes(file.Length),
              paths: [file.FullName],
              safeToClean: true
            });
            
            console.log(`[ComprehensiveScanner] 大文件: ${path.basename(file.FullName)} (${this.formatBytes(file.Length)})`);
          }
        }
      }
    } catch (error) {
      console.log('[ComprehensiveScanner] 扫描大文件失败:', error.message);
    }
  }

  /**
   * 添加可清理项目
   */
  addCleanableItem(name, size, safe, description) {
    this.results.categories[name] = {
      size,
      sizeFormatted: this.formatBytes(size),
      type: 'junk',
      safeToClean: safe
    };
    
    this.results.cleanableItems.push({
      id: `junk_${name.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}`,
      name: name,
      description: description,
      impact: safe ? '删除后不会影响系统运行' : '删除前请确认不需要这些文件',
      riskLevel: safe ? 'safe' : 'caution',
      size: size,
      sizeFormatted: this.formatBytes(size),
      safeToClean: safe
    });
    
    if (safe) {
      this.results.totalCanClean += size;
    }
    
    console.log(`[ComprehensiveScanner] ${name}: ${this.formatBytes(size)}`);
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
      'hiberfil.sys',
      'boot.ini',
      'ntldr'
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

module.exports = ComprehensiveScanner;
