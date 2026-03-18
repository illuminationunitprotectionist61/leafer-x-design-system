/**
 * 目录深入分析器
 * 分析系统目录的子目录，找出可安全清理的文件
 */

const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

class DirectoryAnalyzer {
  constructor(progressCallback = null) {
    this.progressCallback = progressCallback;
    this.results = [];
  }

  /**
   * 报告进度
   */
  reportProgress(message, percent) {
    if (this.progressCallback) {
      this.progressCallback({ message, percent });
    }
  }

  /**
   * 分析 Windows 目录
   */
  async analyzeWindowsDirectory(windowsPath = 'C:\\Windows') {
    console.log('[DirectoryAnalyzer] 分析 Windows 目录...');
    this.results = [];
    
    const subDirs = [
      { name: 'Temp', path: path.join(windowsPath, 'Temp'), description: 'Windows 临时文件' },
      { name: 'Prefetch', path: path.join(windowsPath, 'Prefetch'), description: '预读取文件' },
      { name: 'Logs', path: path.join(windowsPath, 'Logs'), description: 'Windows 日志文件' },
      { name: 'SoftwareDistribution\\Download', path: path.join(windowsPath, 'SoftwareDistribution', 'Download'), description: 'Windows 更新下载文件' },
      { name: 'Installer', path: path.join(windowsPath, 'Installer'), description: 'Windows 安装程序缓存' }
    ];

    for (let i = 0; i < subDirs.length; i++) {
      const dir = subDirs[i];
      this.reportProgress(`正在分析 ${dir.name}...`, Math.round((i / subDirs.length) * 100));
      
      try {
        if (await fs.pathExists(dir.path)) {
          const size = await this.getDirectorySizeFast(dir.path);
          
          if (size > 10 * 1024 * 1024) { // 大于 10MB
            this.results.push({
              name: dir.name,
              path: dir.path,
              description: dir.description,
              size,
              sizeFormatted: this.formatBytes(size),
              riskLevel: this.getRiskLevel(dir.name),
              safeToClean: this.isSafeToClean(dir.name),
              suggestion: this.getSuggestion(dir.name, size)
            });
          }
        }
      } catch (error) {
        console.log(`[DirectoryAnalyzer] 无法分析 ${dir.path}: ${error.message}`);
      }
    }
    
    this.reportProgress('Windows 目录分析完成', 100);
    return this.results;
  }

  /**
   * 分析 Users 目录
   */
  async analyzeUsersDirectory(usersPath = 'C:\\Users') {
    console.log('[DirectoryAnalyzer] 分析 Users 目录...');
    this.results = [];
    
    try {
      const entries = await fs.readdir(usersPath, { withFileTypes: true });
      const userFolders = entries.filter(e => e.isDirectory() && !e.name.startsWith('.'));
      
      for (let i = 0; i < userFolders.length; i++) {
        const userFolder = userFolders[i];
        const userPath = path.join(usersPath, userFolder.name);
        
        this.reportProgress(`正在分析用户 ${userFolder.name}...`, Math.round((i / userFolders.length) * 100));
        
        // 分析用户子目录
        const userSubDirs = [
          { name: 'Downloads', description: '下载文件' },
          { name: 'Documents', description: '文档' },
          { name: 'Desktop', description: '桌面文件' },
          { name: 'Pictures', description: '图片' },
          { name: 'Videos', description: '视频' },
          { name: 'Music', description: '音乐' },
          { name: 'AppData\\Local\\Temp', description: '应用临时文件' }
        ];
        
        for (const subDir of userSubDirs) {
          const subPath = path.join(userPath, subDir.name);
          
          try {
            if (await fs.pathExists(subPath)) {
              const size = await this.getDirectorySizeFast(subPath);
              
              if (size > 100 * 1024 * 1024) { // 大于 100MB
                this.results.push({
                  name: `${userFolder.name}\\${subDir.name}`,
                  path: subPath,
                  description: subDir.description,
                  size,
                  sizeFormatted: this.formatBytes(size),
                  riskLevel: 'caution',
                  safeToClean: true,
                  suggestion: `${userFolder.name} 用户的 ${subDir.description} 占用 ${this.formatBytes(size)}，建议检查并删除不需要的文件`
                });
              }
            }
          } catch (error) {
            // 忽略
          }
        }
      }
    } catch (error) {
      console.error('[DirectoryAnalyzer] 分析 Users 目录失败:', error);
    }
    
    this.reportProgress('Users 目录分析完成', 100);
    return this.results;
  }

  /**
   * 扫描大文件
   */
  async scanLargeFiles(directory, minSize = 100 * 1024 * 1024) {
    console.log(`[DirectoryAnalyzer] 扫描 ${directory} 中的大文件...`);
    const largeFiles = [];
    
    try {
      // 使用 PowerShell 快速查找大文件
      const cmd = `powershell -Command "Get-ChildItem -Path '${directory}' -Recurse -File -ErrorAction SilentlyContinue | Where-Object { $_.Length -gt ${minSize} } | Sort-Object Length -Descending | Select-Object -First 20 FullName, Length, LastWriteTime | ConvertTo-Json"`;
      
      const result = execSync(cmd, { encoding: 'utf8', timeout: 30000 });
      const files = JSON.parse(result);
      
      if (Array.isArray(files)) {
        for (const file of files) {
          largeFiles.push({
            path: file.FullName,
            size: file.Length,
            sizeFormatted: this.formatBytes(file.Length),
            modifiedTime: file.LastWriteTime,
            safeToDelete: this.isFileSafeToDelete(file.FullName)
          });
        }
      }
    } catch (error) {
      console.log('[DirectoryAnalyzer] PowerShell 扫描失败，使用备用方法:', error.message);
      // 使用备用方法
      await this.scanLargeFilesFallback(directory, minSize, largeFiles);
    }
    
    return largeFiles;
  }

  /**
   * 备用大文件扫描
   */
  async scanLargeFilesFallback(directory, minSize, largeFiles, depth = 0) {
    if (depth > 3 || largeFiles.length >= 20) return;
    
    try {
      const entries = await fs.readdir(directory, { withFileTypes: true });
      
      for (const entry of entries) {
        if (largeFiles.length >= 20) break;
        
        const fullPath = path.join(directory, entry.name);
        
        try {
          if (entry.isDirectory()) {
            await this.scanLargeFilesFallback(fullPath, minSize, largeFiles, depth + 1);
          } else if (entry.isFile()) {
            const stats = await fs.stat(fullPath);
            if (stats.size >= minSize) {
              largeFiles.push({
                path: fullPath,
                size: stats.size,
                sizeFormatted: this.formatBytes(stats.size),
                modifiedTime: stats.mtime,
                safeToDelete: this.isFileSafeToDelete(fullPath)
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
   * 快速获取目录大小
   */
  async getDirectorySizeFast(dirPath) {
    try {
      const cmd = `powershell -Command "(Get-ChildItem -Path '${dirPath}' -Recurse -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum"`;
      const result = execSync(cmd, { encoding: 'utf8', timeout: 10000 });
      return parseInt(result.trim()) || 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * 获取风险等级
   */
  getRiskLevel(dirName) {
    const safeDirs = ['Temp', 'Prefetch', 'Logs', 'Download'];
    const cautionDirs = ['Installer'];
    
    if (safeDirs.some(d => dirName.toLowerCase().includes(d.toLowerCase()))) {
      return 'safe';
    } else if (cautionDirs.some(d => dirName.toLowerCase().includes(d.toLowerCase()))) {
      return 'caution';
    }
    return 'danger';
  }

  /**
   * 判断是否可安全清理
   */
  isSafeToClean(dirName) {
    const safeDirs = ['Temp', 'Prefetch', 'Logs', 'Download'];
    return safeDirs.some(d => dirName.toLowerCase().includes(d.toLowerCase()));
  }

  /**
   * 获取建议
   */
  getSuggestion(dirName, size) {
    const suggestions = {
      'Temp': 'Windows 临时文件，通常可以安全删除',
      'Prefetch': '预读取文件，删除后可能影响启动速度，但可释放空间',
      'Logs': '日志文件，通常可以安全删除',
      'Download': 'Windows 更新下载文件，安装完成后可以删除',
      'Installer': 'Windows 安装程序缓存，删除后可能无法卸载某些程序'
    };
    
    for (const [key, value] of Object.entries(suggestions)) {
      if (dirName.toLowerCase().includes(key.toLowerCase())) {
        return value;
      }
    }
    
    return `占用 ${this.formatBytes(size)}，建议检查内容后决定是否删除`;
  }

  /**
   * 判断文件是否可安全删除
   */
  isFileSafeToDelete(filePath) {
    const unsafePatterns = [
      'Windows\\System32',
      'Windows\\SysWOW64',
      'Program Files',
      '.exe',
      '.dll',
      '.sys'
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

module.exports = DirectoryAnalyzer;
