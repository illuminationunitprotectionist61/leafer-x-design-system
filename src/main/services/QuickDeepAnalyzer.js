/**
 * 快速深入分析器
 * 使用 Windows 内置命令快速获取详细的磁盘空间信息
 */

const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

class QuickDeepAnalyzer {
  constructor() {
    this.results = {
      categories: {},
      cleanableItems: [],
      largeFiles: [],
      totalCanClean: 0
    };
  }

  /**
   * 执行快速深入分析（10-15秒）
   */
  async analyze(drive = 'C:') {
    console.log(`[QuickDeepAnalyzer] 开始快速深入分析 ${drive}...`);
    const startTime = Date.now();

    try {
      // 1. 使用 dir /s 快速获取主要目录大小（3-5秒）
      await this.scanMainDirectories(drive);
      
      // 2. 扫描可清理的垃圾文件（3-5秒）
      await this.scanJunkFiles(drive);
      
      // 3. 扫描用户目录中的大文件（3-5秒）
      await this.scanUserLargeFiles(drive);

      const duration = (Date.now() - startTime) / 1000;
      console.log(`[QuickDeepAnalyzer] 分析完成，耗时: ${duration.toFixed(1)}秒`);
      console.log(`[QuickDeepAnalyzer] 发现可清理空间: ${this.formatBytes(this.results.totalCanClean)}`);
      
      return this.results;
    } catch (error) {
      console.error('[QuickDeepAnalyzer] 分析失败:', error);
      throw error;
    }
  }

  /**
   * 扫描主要目录（使用 dir 命令，快速且准确）
   */
  async scanMainDirectories(drive) {
    console.log('[QuickDeepAnalyzer] 扫描主要目录...');
    
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
        
        console.log(`[QuickDeepAnalyzer] ${dir.name}: ${this.formatBytes(size)}`);
      } catch (error) {
        console.log(`[QuickDeepAnalyzer] 无法扫描 ${dir.name}: ${error.message}`);
        this.results.categories[dir.name] = {
          size: 0,
          sizeFormatted: '0 B',
          type: dir.type
        };
      }
    }
  }

  /**
   * 获取目录大小（使用 Windows dir 命令）
   */
  async getDirectorySize(dirPath) {
    try {
      if (!await fs.pathExists(dirPath)) {
        return 0;
      }

      // 使用 Windows dir 命令获取总大小
      const cmd = `dir /s "${dirPath}" 2>nul | findstr "File(s)"`;
      const result = execSync(cmd, { encoding: 'utf8', timeout: 10000 });
      
      // 解析结果，例如: "123 File(s) 45,678,901,234 bytes"
      const match = result.match(/([\d,]+)\s+bytes/);
      if (match) {
        const size = parseInt(match[1].replace(/,/g, ''));
        return size;
      }
      
      return 0;
    } catch (error) {
      // 如果 dir 命令失败，使用递归估算
      return await this.estimateDirectorySize(dirPath);
    }
  }

  /**
   * 估算目录大小（递归扫描）
   */
  async estimateDirectorySize(dirPath, depth = 0) {
    if (depth > 3) return 0;
    
    try {
      let totalSize = 0;
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        try {
          const fullPath = path.join(dirPath, entry.name);
          
          if (entry.isDirectory()) {
            totalSize += await this.estimateDirectorySize(fullPath, depth + 1);
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
   * 扫描可清理的垃圾文件
   */
  async scanJunkFiles(drive) {
    console.log('[QuickDeepAnalyzer] 扫描垃圾文件...');
    
    const junkLocations = [
      { 
        name: 'Windows临时文件', 
        path: `${drive}\\Windows\\Temp`, 
        safe: true,
        description: 'Windows系统和应用程序的临时文件'
      },
      { 
        name: 'Windows更新缓存', 
        path: `${drive}\\Windows\\SoftwareDistribution\\Download`, 
        safe: true,
        description: 'Windows更新下载文件，安装完成后可删除'
      },
      { 
        name: 'Windows错误报告', 
        path: `${drive}\\ProgramData\\Microsoft\\Windows\\WER`, 
        safe: true,
        description: '程序崩溃错误报告'
      },
      { 
        name: '系统日志文件', 
        path: `${drive}\\Windows\\Logs`, 
        safe: false,
        description: '系统日志文件'
      },
      { 
        name: '缩略图缓存', 
        path: `${drive}\\Users\\Administrator\\AppData\\Local\\Microsoft\\Windows\\Explorer`, 
        safe: true,
        description: 'Windows资源管理器的缩略图缓存'
      }
    ];

    for (const junk of junkLocations) {
      try {
        const size = await this.getDirectorySize(junk.path);
        
        if (size > 1024 * 1024) { // 大于 1MB 才显示
          this.results.categories[junk.name] = {
            size,
            sizeFormatted: this.formatBytes(size),
            type: 'junk',
            safeToClean: junk.safe
          };
          
          // 添加到可清理项目
          this.results.cleanableItems.push({
            id: `junk_${junk.name.replace(/\s+/g, '_').toLowerCase()}`,
            name: junk.name,
            description: junk.description,
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
          
          console.log(`[QuickDeepAnalyzer] ${junk.name}: ${this.formatBytes(size)}`);
        }
      } catch (error) {
        // 忽略
      }
    }

    // 扫描用户临时文件
    await this.scanUserTempFiles(drive);
  }

  /**
   * 扫描用户临时文件
   */
  async scanUserTempFiles(drive) {
    try {
      const usersPath = `${drive}\\Users`;
      const entries = await fs.readdir(usersPath, { withFileTypes: true });
      
      for (const entry of entries) {
        if (!entry.isDirectory() || entry.name === 'Public') continue;
        
        const tempPath = path.join(usersPath, entry.name, 'AppData', 'Local', 'Temp');
        
        try {
          const size = await this.getDirectorySize(tempPath);
          
          if (size > 10 * 1024 * 1024) { // 大于 10MB
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
            
            console.log(`[QuickDeepAnalyzer] ${itemName}: ${this.formatBytes(size)}`);
          }
        } catch (error) {
          // 忽略
        }
      }
    } catch (error) {
      console.log('[QuickDeepAnalyzer] 扫描用户临时文件失败:', error.message);
    }
  }

  /**
   * 扫描用户目录中的大文件
   */
  async scanUserLargeFiles(drive) {
    console.log('[QuickDeepAnalyzer] 扫描用户大文件...');
    
    try {
      const usersPath = `${drive}\\Users`;
      const entries = await fs.readdir(usersPath, { withFileTypes: true });
      
      for (const entry of entries) {
        if (!entry.isDirectory() || entry.name === 'Public') continue;
        
        // 扫描 Downloads 目录
        const downloadsPath = path.join(usersPath, entry.name, 'Downloads');
        await this.scanDirectoryForLargeFiles(downloadsPath, 100 * 1024 * 1024, entry.name);
        
        // 扫描 Documents 目录
        const documentsPath = path.join(usersPath, entry.name, 'Documents');
        await this.scanDirectoryForLargeFiles(documentsPath, 100 * 1024 * 1024, entry.name);
      }
    } catch (error) {
      console.log('[QuickDeepAnalyzer] 扫描用户大文件失败:', error.message);
    }
  }

  /**
   * 扫描目录中的大文件
   */
  async scanDirectoryForLargeFiles(dirPath, minSize, userName) {
    try {
      if (!await fs.pathExists(dirPath)) return;
      
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        if (this.results.largeFiles.length >= 50) return;
        
        const fullPath = path.join(dirPath, entry.name);
        
        try {
          if (entry.isFile()) {
            const stats = await fs.stat(fullPath);
            if (stats.size >= minSize) {
              this.results.largeFiles.push({
                path: fullPath,
                name: entry.name,
                size: stats.size,
                sizeFormatted: this.formatBytes(stats.size),
                user: userName,
                safeToDelete: true
              });
              
              // 也添加到可清理项目
              this.results.cleanableItems.push({
                id: `large_${Buffer.from(fullPath).toString('base64').substring(0, 20)}`,
                name: entry.name,
                description: `${userName}用户的大文件: ${fullPath}`,
                impact: '删除前请确认不需要此文件',
                riskLevel: 'caution',
                size: stats.size,
                sizeFormatted: this.formatBytes(stats.size),
                paths: [fullPath],
                safeToClean: true
              });
              
              console.log(`[QuickDeepAnalyzer] 大文件: ${entry.name} (${this.formatBytes(stats.size)})`);
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

module.exports = QuickDeepAnalyzer;
