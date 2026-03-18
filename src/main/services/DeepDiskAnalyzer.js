/**
 * 深度磁盘分析器
 * 深入分析 C 盘，找出真正可以清理的大文件和垃圾文件
 */

const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

/**
 * 深度磁盘分析器类
 */
class DeepDiskAnalyzer {
  constructor(progressCallback = null) {
    this.largeFiles = [];
    this.duplicateFiles = [];
    this.systemJunk = [];
    this.userJunk = [];
    this.analysisResults = {
      totalSize: 0,
      canCleanSize: 0,
      categories: {}
    };
    this.progressCallback = progressCallback; // 进度回调函数
    this.scannedItems = 0;
    this.totalItems = 0;
  }

  /**
   * 报告进度
   * @param {string} stage - 当前阶段
   * @param {number} progress - 进度百分比 (0-100)
   * @param {string} detail - 详细信息
   */
  reportProgress(stage, progress, detail = '') {
    if (this.progressCallback) {
      this.progressCallback({
        stage,
        progress,
        detail,
        scannedItems: this.scannedItems,
        totalItems: this.totalItems
      });
    }
  }

  /**
   * 执行深度分析
   */
  async analyze(drive = 'C:') {
    console.log(`[DeepDiskAnalyzer] 开始深度分析 ${drive}`);
    const startTime = Date.now();
    
    this.analysisResults = {
      drive,
      totalSize: 0,
      canCleanSize: 0,
      categories: {},
      details: []
    };

    try {
      // 1. 扫描系统垃圾文件 (10%)
      this.reportProgress('system', 0, '正在扫描系统垃圾文件...');
      await this.scanSystemJunk(drive);
      this.reportProgress('system', 10, '系统垃圾文件扫描完成');
      
      // 2. 扫描用户垃圾文件 (30%)
      this.reportProgress('user', 10, '正在扫描用户垃圾文件...');
      await this.scanUserJunk(drive);
      this.reportProgress('user', 30, '用户垃圾文件扫描完成');
      
      // 3. 扫描大文件 (50%)
      this.reportProgress('large', 30, '正在扫描大文件...');
      await this.scanLargeFiles(drive);
      this.reportProgress('large', 50, '大文件扫描完成');
      
      // 4. 扫描重复文件 (60%)
      this.reportProgress('duplicate', 50, '正在扫描重复文件...');
      await this.scanDuplicateFiles(drive);
      this.reportProgress('duplicate', 60, '重复文件扫描完成');
      
      // 5. 分析系统文件夹 (80%)
      this.reportProgress('folders', 60, '正在分析系统文件夹...');
      await this.analyzeSystemFolders(drive);
      this.reportProgress('folders', 80, '系统文件夹分析完成');
      
      // 6. 分析应用程序 (100%)
      this.reportProgress('apps', 80, '正在分析应用程序...');
      await this.analyzeApplications(drive);
      this.reportProgress('apps', 100, '应用程序分析完成');

      const duration = (Date.now() - startTime) / 1000;
      console.log(`[DeepDiskAnalyzer] 深度分析完成，耗时: ${duration.toFixed(1)}秒`);
      return this.analysisResults;
      
    } catch (error) {
      console.error('[DeepDiskAnalyzer] 分析失败:', error);
      throw error;
    }
  }

  /**
   * 扫描系统垃圾文件
   */
  async scanSystemJunk(drive) {
    console.log('[DeepDiskAnalyzer] 扫描系统垃圾文件...');
    
    const systemJunkPaths = [
      // Windows 更新缓存
      { path: `${drive}\\Windows\\SoftwareDistribution\\Download`, name: 'Windows 更新缓存', safeToClean: true },
      { path: `${drive}\\Windows\\Temp`, name: 'Windows 临时文件', safeToClean: true },
      { path: `${drive}\\Windows\\Prefetch`, name: '预读取文件', safeToClean: true },
      
      // 系统日志
      { path: `${drive}\\Windows\\Logs`, name: '系统日志', safeToClean: false },
      { path: `${drive}\\Windows\\System32\\LogFiles`, name: '系统日志文件', safeToClean: false },
      
      // 错误报告
      { path: `${drive}\\ProgramData\\Microsoft\\Windows\\WER`, name: 'Windows 错误报告', safeToClean: true },
      
      // 缩略图缓存
      { path: `${drive}\\Users\\*\\AppData\\Local\\Microsoft\\Windows\\Explorer\\thumbcache_*.db`, name: '缩略图缓存', safeToClean: true, isGlob: true },
      
      // 回收站
      { path: `${drive}\\$Recycle.Bin`, name: '回收站', safeToClean: true },
      
      // 休眠文件
      { path: `${drive}\\hiberfil.sys`, name: '休眠文件', safeToClean: false, isFile: true },
      
      // 页面文件
      { path: `${drive}\\pagefile.sys`, name: '页面文件', safeToClean: false, isFile: true },
      
      // 系统还原点
      { path: `${drive}\\System Volume Information`, name: '系统还原点', safeToClean: false },
    ];

    for (const item of systemJunkPaths) {
      try {
        const size = await this.getPathSize(item.path, item.isGlob, item.isFile);
        if (size > 0) {
          this.systemJunk.push({
            ...item,
            size,
            sizeFormatted: this.formatBytes(size)
          });
          
          this.analysisResults.categories[item.name] = {
            size,
            sizeFormatted: this.formatBytes(size),
            safeToClean: item.safeToClean,
            path: item.path
          };
          
          if (item.safeToClean) {
            this.analysisResults.canCleanSize += size;
          }
        }
      } catch (error) {
        console.log(`[DeepDiskAnalyzer] 无法访问 ${item.path}: ${error.message}`);
      }
    }
  }

  /**
   * 扫描用户垃圾文件
   */
  async scanUserJunk(drive) {
    console.log('[DeepDiskAnalyzer] 扫描用户垃圾文件...');
    
    const userJunkPaths = [
      // 浏览器缓存 - Chrome
      { path: `${drive}\\Users\\*\\AppData\\Local\\Google\\Chrome\\User Data\\*\\Cache`, name: 'Chrome 缓存', safeToClean: true, isGlob: true },
      { path: `${drive}\\Users\\*\\AppData\\Local\\Google\\Chrome\\User Data\\*\\Code Cache`, name: 'Chrome 代码缓存', safeToClean: true, isGlob: true },
      { path: `${drive}\\Users\\*\\AppData\\Local\\Google\\Chrome\\User Data\\*\\GPUCache`, name: 'Chrome GPU缓存', safeToClean: true, isGlob: true },
      { path: `${drive}\\Users\\*\\AppData\\Local\\Google\\Chrome\\User Data\\*\\Service Worker`, name: 'Chrome Service Worker', safeToClean: true, isGlob: true },
      
      // 浏览器缓存 - Edge
      { path: `${drive}\\Users\\*\\AppData\\Local\\Microsoft\\Edge\\User Data\\*\\Cache`, name: 'Edge 缓存', safeToClean: true, isGlob: true },
      { path: `${drive}\\Users\\*\\AppData\\Local\\Microsoft\\Edge\\User Data\\*\\Code Cache`, name: 'Edge 代码缓存', safeToClean: true, isGlob: true },
      
      // 浏览器缓存 - Firefox
      { path: `${drive}\\Users\\*\\AppData\\Local\\Mozilla\\Firefox\\Profiles\\*\\cache2`, name: 'Firefox 缓存', safeToClean: true, isGlob: true },
      { path: `${drive}\\Users\\*\\AppData\\Local\\Mozilla\\Firefox\\Profiles\\*\\startupCache`, name: 'Firefox 启动缓存', safeToClean: true, isGlob: true },
      
      // 临时文件
      { path: `${drive}\\Users\\*\\AppData\\Local\\Temp`, name: '用户临时文件', safeToClean: true, isGlob: true },
      { path: `${drive}\\Users\\*\\AppData\\Local\\Microsoft\\Windows\\INetCache`, name: 'IE/Edge 临时文件', safeToClean: true, isGlob: true },
      
      // 下载文件夹
      { path: `${drive}\\Users\\*\\Downloads`, name: '下载文件夹', safeToClean: false, isGlob: true },
      
      // 桌面
      { path: `${drive}\\Users\\*\\Desktop`, name: '桌面文件', safeToClean: false, isGlob: true },
      
      // 文档
      { path: `${drive}\\Users\\*\\Documents`, name: '文档文件夹', safeToClean: false, isGlob: true },
      
      // 最近使用的文件
      { path: `${drive}\\Users\\*\\AppData\\Roaming\\Microsoft\\Windows\\Recent`, name: '最近使用文件', safeToClean: true, isGlob: true },
      
      // 缩略图缓存
      { path: `${drive}\\Users\\*\\AppData\\Local\\Microsoft\\Windows\\Explorer`, name: '缩略图缓存', safeToClean: true, isGlob: true },
      
      // 邮件缓存
      { path: `${drive}\\Users\\*\\AppData\\Local\\Microsoft\\Outlook`, name: 'Outlook 缓存', safeToClean: false, isGlob: true },
      
      // 微信/QQ 缓存
      { path: `${drive}\\Users\\*\\Documents\\WeChat Files`, name: '微信文件', safeToClean: false, isGlob: true },
      { path: `${drive}\\Users\\*\\Documents\\Tencent Files`, name: 'QQ 文件', safeToClean: false, isGlob: true },
      
      // 其他应用缓存
      { path: `${drive}\\Users\\*\\AppData\\Roaming\\Code\\Cache`, name: 'VS Code 缓存', safeToClean: true, isGlob: true },
      { path: `${drive}\\Users\\*\\AppData\\Local\\npm-cache`, name: 'npm 缓存', safeToClean: true, isGlob: true },
      { path: `${drive}\\Users\\*\\AppData\\Local\\pip\\cache`, name: 'pip 缓存', safeToClean: true, isGlob: true },
      { path: `${drive}\\Users\\*\\AppData\\Local\\Yarn\\Cache`, name: 'Yarn 缓存', safeToClean: true, isGlob: true },
      
      // 游戏缓存
      { path: `${drive}\\Users\\*\\AppData\\Local\\Steam\\htmlcache`, name: 'Steam 缓存', safeToClean: true, isGlob: true },
    ];

    for (const item of userJunkPaths) {
      try {
        const size = await this.getPathSize(item.path, item.isGlob);
        if (size > 0) {
          this.userJunk.push({
            ...item,
            size,
            sizeFormatted: this.formatBytes(size)
          });
          
          this.analysisResults.categories[item.name] = {
            size,
            sizeFormatted: this.formatBytes(size),
            safeToClean: item.safeToClean,
            path: item.path
          };
          
          if (item.safeToClean) {
            this.analysisResults.canCleanSize += size;
          }
        }
      } catch (error) {
        console.log(`[DeepDiskAnalyzer] 无法访问 ${item.path}: ${error.message}`);
      }
    }
  }

  /**
   * 扫描大文件
   */
  async scanLargeFiles(drive, minSize = 100 * 1024 * 1024) { // 默认 100MB
    console.log('[DeepDiskAnalyzer] 扫描大文件...');
    
    const searchPaths = [
      `${drive}\\`,
      `${drive}\\Users`,
      `${drive}\\Program Files`,
      `${drive}\\Program Files (x86)`,
      `${drive}\\ProgramData`,
      `${drive}\\Windows`
    ];

    for (const searchPath of searchPaths) {
      try {
        if (!await fs.pathExists(searchPath)) continue;
        
        await this.findLargeFiles(searchPath, minSize);
      } catch (error) {
        console.log(`[DeepDiskAnalyzer] 无法扫描 ${searchPath}: ${error.message}`);
      }
    }

    // 按大小排序
    this.largeFiles.sort((a, b) => b.size - a.size);
    
    // 只保留前 50 个最大的文件
    this.largeFiles = this.largeFiles.slice(0, 50);
    
    console.log(`[DeepDiskAnalyzer] 找到 ${this.largeFiles.length} 个大文件`);
  }

  /**
   * 递归查找大文件
   */
  async findLargeFiles(dirPath, minSize, depth = 0) {
    if (depth > 3) return; // 限制递归深度
    
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        
        try {
          if (entry.isDirectory()) {
            // 跳过系统目录
            if (['Windows', 'System32', 'SysWOW64'].includes(entry.name)) {
              continue;
            }
            
            await this.findLargeFiles(fullPath, minSize, depth + 1);
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
          // 忽略无法访问的文件
        }
      }
    } catch (error) {
      // 忽略无法访问的目录
    }
  }

  /**
   * 扫描重复文件
   */
  async scanDuplicateFiles(drive) {
    console.log('[DeepDiskAnalyzer] 扫描重复文件...');
    
    // 扫描用户文档和下载文件夹
    const searchPaths = [
      `${drive}\\Users\\*\\Documents`,
      `${drive}\\Users\\*\\Downloads`,
      `${drive}\\Users\\*\\Pictures`,
      `${drive}\\Users\\*\\Desktop`
    ];

    const fileHashes = new Map();
    
    for (const searchPath of searchPaths) {
      try {
        // 使用 glob 查找文件
        const files = await this.globFiles(searchPath, ['*.jpg', '*.jpeg', '*.png', '*.mp4', '*.doc', '*.docx', '*.pdf']);
        
        for (const file of files) {
          try {
            const hash = await this.getFileHash(file);
            
            if (fileHashes.has(hash)) {
              const existingFile = fileHashes.get(hash);
              const stats = await fs.stat(file);
              
              this.duplicateFiles.push({
                original: existingFile,
                duplicate: file,
                size: stats.size,
                sizeFormatted: this.formatBytes(stats.size)
              });
            } else {
              fileHashes.set(hash, file);
            }
          } catch (error) {
            // 忽略无法读取的文件
          }
        }
      } catch (error) {
        console.log(`[DeepDiskAnalyzer] 无法扫描重复文件 ${searchPath}: ${error.message}`);
      }
    }
    
    console.log(`[DeepDiskAnalyzer] 找到 ${this.duplicateFiles.length} 个重复文件`);
  }

  /**
   * 分析系统文件夹
   */
  async analyzeSystemFolders(drive) {
    console.log('[DeepDiskAnalyzer] 分析系统文件夹...');
    
    const systemFolders = [
      { path: `${drive}\\Windows`, name: 'Windows 文件夹' },
      { path: `${drive}\\Program Files`, name: '程序文件' },
      { path: `${drive}\\Program Files (x86)`, name: '程序文件 (x86)' },
      { path: `${drive}\\ProgramData`, name: '程序数据' },
      { path: `${drive}\\Users`, name: '用户文件夹' }
    ];

    for (const folder of systemFolders) {
      try {
        const size = await this.getDirectorySize(folder.path);
        
        this.analysisResults.categories[folder.name] = {
          size,
          sizeFormatted: this.formatBytes(size),
          path: folder.path,
          isSystem: true
        };
      } catch (error) {
        console.log(`[DeepDiskAnalyzer] 无法分析 ${folder.path}: ${error.message}`);
      }
    }
  }

  /**
   * 分析应用程序
   */
  async analyzeApplications(drive) {
    console.log('[DeepDiskAnalyzer] 分析应用程序...');
    
    try {
      // 获取已安装程序列表（通过注册表）
      const programs = this.getInstalledPrograms();
      
      for (const program of programs) {
        try {
          if (program.installLocation && await fs.pathExists(program.installLocation)) {
            const size = await this.getDirectorySize(program.installLocation);
            
            this.analysisResults.categories[`应用: ${program.name}`] = {
              size,
              sizeFormatted: this.formatBytes(size),
              path: program.installLocation,
              isApplication: true,
              version: program.version
            };
          }
        } catch (error) {
          // 忽略无法分析的程序
        }
      }
    } catch (error) {
      console.log('[DeepDiskAnalyzer] 无法分析应用程序:', error.message);
    }
  }

  /**
   * 获取路径大小
   */
  async getPathSize(pathPattern, isGlob = false, isFile = false) {
    if (isFile) {
      try {
        const stats = await fs.stat(pathPattern);
        return stats.size;
      } catch (error) {
        return 0;
      }
    }
    
    if (isGlob) {
      // 处理通配符路径
      const files = await this.globFiles(pathPattern);
      let totalSize = 0;
      
      for (const file of files) {
        try {
          const stats = await fs.stat(file);
          totalSize += stats.size;
        } catch (error) {
          // 忽略
        }
      }
      
      return totalSize;
    }
    
    return await this.getDirectorySize(pathPattern);
  }

  /**
   * 获取目录大小
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
   * 获取文件哈希
   */
  async getFileHash(filePath) {
    const crypto = require('crypto');
    const hash = crypto.createHash('md5');
    
    const stream = fs.createReadStream(filePath);
    
    return new Promise((resolve, reject) => {
      stream.on('data', data => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  }

  /**
   * 通配符查找文件
   */
  async globFiles(pattern, extensions = []) {
    // 简化版的 glob 实现
    const files = [];
    const basePath = pattern.replace(/\/\*$/, '');
    
    try {
      if (await fs.pathExists(basePath)) {
        const entries = await fs.readdir(basePath, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(basePath, entry.name);
          
          if (entry.isFile()) {
            if (extensions.length === 0 || extensions.some(ext => entry.name.endsWith(ext))) {
              files.push(fullPath);
            }
          } else if (entry.isDirectory()) {
            const subFiles = await this.globFiles(fullPath, extensions);
            files.push(...subFiles);
          }
        }
      }
    } catch (error) {
      // 忽略
    }
    
    return files;
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
      'hiberfil.sys'
    ];
    
    return !unsafePatterns.some(pattern => filePath.includes(pattern));
  }

  /**
   * 获取已安装程序列表
   */
  getInstalledPrograms() {
    try {
      // 通过 PowerShell 获取已安装程序
      const cmd = `powershell "Get-ItemProperty HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\* | Select-Object DisplayName, InstallLocation, DisplayVersion | ConvertTo-Json"`;
      const result = execSync(cmd, { encoding: 'utf8' });
      
      const programs = JSON.parse(result);
      return Array.isArray(programs) ? programs : [programs].filter(Boolean);
    } catch (error) {
      console.log('[DeepDiskAnalyzer] 无法获取程序列表:', error.message);
      return [];
    }
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
    return {
      ...this.analysisResults,
      systemJunk: this.systemJunk,
      userJunk: this.userJunk,
      largeFiles: this.largeFiles,
      duplicateFiles: this.duplicateFiles
    };
  }
}

module.exports = DeepDiskAnalyzer;
