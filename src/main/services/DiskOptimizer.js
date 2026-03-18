/**
 * C盘优化服务
 * 提供磁盘空间分析、安全清理建议、系统优化等功能
 * 
 * @author 本地电脑助手团队
 * @version 1.0.0
 */

const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const DeepDiskAnalyzer = require('./DeepDiskAnalyzer');
const AdvancedDiskAnalyzer = require('./AdvancedDiskAnalyzer');
const DirectoryAnalyzer = require('./DirectoryAnalyzer');
const FastDiskAnalyzer = require('./FastDiskAnalyzer');
const QuickDeepAnalyzer = require('./QuickDeepAnalyzer');
const ComprehensiveScanner = require('./ComprehensiveScanner');
const SimpleFastScanner = require('./SimpleFastScanner');
const ParallelScanner = require('./ParallelScanner');
const HighPerformanceScanner = require('./HighPerformanceScanner');
const UltimateScanner = require('./UltimateScanner');
const WizTreeScanner = require('./WizTreeScanner');

const execAsync = util.promisify(exec);

/**
 * 风险等级枚举
 * @readonly
 * @enum {string}
 */
const RiskLevel = {
  SAFE: 'safe',      // 绿色 - 安全可删
  CAUTION: 'caution', // 黄色 - 谨慎删除
  DANGER: 'danger'   // 红色 - 不建议删除
};

/**
 * 可清理项目定义
 * @typedef {Object} CleanableItem
 * @property {string} id - 项目唯一标识
 * @property {string} name - 项目名称
 * @property {string[]} paths - 项目路径列表（支持环境变量）
 * @property {string} description - 项目描述
 * @property {string} impact - 删除影响说明
 * @property {RiskLevel} riskLevel - 风险等级
 */

/**
 * 安全删除项目列表（绿色）
 * @type {CleanableItem[]}
 */
const SAFE_ITEMS = [
  {
    id: 'temp_files',
    name: 'Windows 临时文件',
    paths: ['%TEMP%', '%WINDIR%\\Temp', '%WINDIR%\\Prefetch'],
    description: 'Windows 系统和应用程序生成的临时文件',
    impact: '删除后不会影响系统运行，部分正在运行的程序可能需要重启',
    riskLevel: RiskLevel.SAFE
  },
  {
    id: 'recycle_bin',
    name: '回收站',
    paths: ['$Recycle.Bin'],
    description: '已删除但尚未清空的文件',
    impact: '删除后文件将无法恢复',
    riskLevel: RiskLevel.SAFE
  },
  {
    id: 'browser_cache',
    name: '浏览器缓存',
    paths: [
      '%LOCALAPPDATA%\\Google\\Chrome\\User Data\\Default\\Cache',
      '%LOCALAPPDATA%\\Microsoft\\Edge\\User Data\\Default\\Cache',
      '%LOCALAPPDATA%\\Mozilla\\Firefox\\Profiles'
    ],
    description: '浏览器缓存的网页数据',
    impact: '删除后浏览器需要重新加载网页资源，登录状态可能丢失',
    riskLevel: RiskLevel.SAFE
  },
  {
    id: 'thumbnail_cache',
    name: '缩略图缓存',
    paths: ['%LOCALAPPDATA%\\Microsoft\\Windows\\Explorer'],
    description: 'Windows 资源管理器的缩略图缓存',
    impact: '删除后缩略图会重新生成，首次打开文件夹可能稍慢',
    riskLevel: RiskLevel.SAFE
  },
  {
    id: 'windows_old',
    name: '旧版 Windows 文件',
    paths: ['%SYSTEMDRIVE%\\Windows.old'],
    description: 'Windows 升级时备份的旧系统文件',
    impact: '删除后将无法回滚到旧版 Windows',
    riskLevel: RiskLevel.SAFE
  },
  {
    id: 'update_cache',
    name: 'Windows 更新缓存',
    paths: ['%WINDIR%\\SoftwareDistribution\\Download'],
    description: 'Windows 更新下载的临时文件',
    impact: '删除后不会影响已安装的更新',
    riskLevel: RiskLevel.SAFE
  },
  {
    id: 'delivery_optimization',
    name: '传递优化文件',
    paths: ['%WINDIR%\\ServiceProfiles\\NetworkService\\AppData\\Local\\Microsoft\\Windows\\DeliveryOptimization'],
    description: 'Windows 更新传递优化缓存',
    impact: '删除后更新可能需要重新下载',
    riskLevel: RiskLevel.SAFE
  }
];

/**
 * 谨慎删除项目列表（黄色）
 * @type {CleanableItem[]}
 */
const CAUTION_ITEMS = [
  {
    id: 'app_cache',
    name: '应用程序缓存',
    paths: ['%LOCALAPPDATA%\\Temp', '%APPDATA%\\Temp'],
    description: '应用程序生成的缓存文件',
    impact: '删除后部分应用可能需要重新配置或重新登录',
    riskLevel: RiskLevel.CAUTION
  },
  {
    id: 'log_files',
    name: '日志文件',
    paths: ['%WINDIR%\\Logs', '%PROGRAMDATA%\\Logs'],
    description: '系统和应用程序的日志文件',
    impact: '删除后无法查看历史日志，但不影响系统运行',
    riskLevel: RiskLevel.CAUTION
  },
  {
    id: 'crash_dumps',
    name: '崩溃转储文件',
    paths: ['%LOCALAPPDATA%\\CrashDumps', '%PROGRAMDATA%\\Microsoft\\Windows\\WER'],
    description: '程序崩溃时生成的调试信息',
    impact: '删除后无法分析程序崩溃原因',
    riskLevel: RiskLevel.CAUTION
  }
];

/**
 * 系统关键路径（红色 - 禁止删除）
 * @type {string[]}
 */
const DANGER_PATHS = [
  '%WINDIR%',
  '%WINDIR%\\System32',
  '%WINDIR%\\SysWOW64',
  '%PROGRAMFILES%',
  '%PROGRAMFILES(X86)%',
  '%SYSTEMDRIVE%\\ProgramData',
  '%USERPROFILE%\\AppData\\Roaming\\Microsoft',
  '%USERPROFILE%\\AppData\\Local\\Microsoft'
];

/**
 * C盘优化服务类
 */
class DiskOptimizer {
  /**
   * 创建DiskOptimizer实例
   * @param {DatabaseManager} databaseManager - 数据库管理器
   * @param {ConfigManager} configManager - 配置管理器
   */
  constructor(databaseManager, configManager) {
    this.db = databaseManager;
    this.config = configManager;
    
    // 缓存配置
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5分钟缓存
    
    // 初始化可清理项目列表
    this.cleanableItems = [];
    this.deepAnalysisResults = null;
  }

  /**
   * 分析磁盘空间（快速扫描版本）
   * @returns {Promise<Object>} 分析结果
   */
  async analyzeDisk() {
    try {
      console.log('[DiskOptimizer] 开始快速深入扫描磁盘...');
      const startTime = Date.now();
      
      const systemDrive = process.env.SYSTEMDRIVE || 'C:';
      
      // 1. 使用 WizTree 扫描（最快，2-3秒）
      const analyzer = new WizTreeScanner();
      const results = await analyzer.analyze(systemDrive);
      
      // 2. 保存可清理项目到实例变量（供清理时使用）
      this.cleanableItems = results.cleanableItems || [];
      console.log(`[DiskOptimizer] 保存了 ${this.cleanableItems.length} 个可清理项目`);
      
      // 3. 获取磁盘基本信息
      const diskInfo = await this.getDiskInfo(systemDrive);
      
      const duration = (Date.now() - startTime) / 1000;
      console.log(`[DiskOptimizer] 快速深入扫描完成，耗时: ${duration.toFixed(1)}秒`);
      console.log(`[DiskOptimizer] 发现可清理空间: ${this.formatBytes(results.totalCanClean)}`);
      
      return {
        success: true,
        diskInfo,
        categories: results.categories,
        largeFiles: results.largeFiles,
        cleanableItems: results.cleanableItems,
        canCleanSize: results.totalCanClean,
        canCleanSizeFormatted: this.formatBytes(results.totalCanClean),
        analyzedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('磁盘分析失败:', error);
      return {
        success: false,
        error: error.message,
        errorCode: 'ANALYSIS_FAILED'
      };
    }
  }

  /**
   * 将快速扫描结果转换为可清理项目
   * @param {Object} fastResults - 快速扫描结果
   * @returns {Array} 可清理项目列表
   */
  convertFastResultsToCleanableItems(fastResults) {
    const items = [];
    
    // 转换垃圾文件为可清理项目
    for (const [name, info] of Object.entries(fastResults.categories)) {
      if (info.type === 'junk' && info.size > 0) {
        items.push({
          id: `fast_${name.replace(/\s+/g, '_').toLowerCase()}`,
          name: name,
          description: info.safeToClean ? '可安全清理的垃圾文件' : '谨慎清理',
          impact: info.safeToClean ? '删除后不会影响系统运行' : '删除前请确认不需要这些文件',
          riskLevel: info.safeToClean ? RiskLevel.SAFE : RiskLevel.CAUTION,
          size: info.size,
          sizeFormatted: info.sizeFormatted,
          safeToClean: info.safeToClean,
          isFastScanResult: true
        });
      }
    }
    
    // 转换大文件
    for (const file of fastResults.largeFiles.slice(0, 20)) {
      if (file.safeToDelete) {
        items.push({
          id: `large_file_${Buffer.from(file.path).toString('base64').substring(0, 20)}`,
          name: path.basename(file.path),
          description: `大文件: ${file.path}`,
          impact: '删除前请确认不需要此文件',
          riskLevel: RiskLevel.CAUTION,
          size: file.size,
          sizeFormatted: file.sizeFormatted,
          paths: [file.path],
          safeToClean: true,
          isFastScanResult: true
        });
      }
    }
    
    // 按大小排序
    items.sort((a, b) => b.size - a.size);
    
    return items;
  }

  /**
   * 执行深度磁盘分析
   * @param {string} drive - 驱动器盘符
   */
  async performDeepAnalysis(drive) {
    console.log('开始深度磁盘分析...');
    
    try {
      // 创建深度分析器，传入进度回调
      const deepAnalyzer = new DeepDiskAnalyzer((progress) => {
        // 发送进度到前端
        if (this.onDeepAnalysisProgress) {
          this.onDeepAnalysisProgress(progress);
        }
      });
      
      const deepResults = await deepAnalyzer.analyze(drive);
      
      // 保存深度分析结果
      this.deepAnalysisResults = deepResults;
      
      console.log('深度分析完成，发现可清理空间:', 
        (deepResults.canCleanSize / 1024 / 1024 / 1024).toFixed(2), 'GB');
      
      // 将深度分析结果转换为 cleanableItems 格式
      this.convertDeepResultsToCleanableItems(deepResults);
      
      // 触发事件通知前端
      if (this.onDeepAnalysisComplete) {
        this.onDeepAnalysisComplete(deepResults);
      }
      
      return deepResults;
    } catch (error) {
      console.error('深度分析失败:', error);
      throw error;
    }
  }

  /**
   * 将深度分析结果转换为可清理项目
   * @param {Object} deepResults - 深度分析结果
   */
  convertDeepResultsToCleanableItems(deepResults) {
    if (!deepResults) return;
    
    console.log('转换深度分析结果为可清理项目...');
    
    // 转换系统垃圾文件
    if (deepResults.systemJunk) {
      for (const item of deepResults.systemJunk) {
        if (item.safeToClean && item.size > 0) {
          this.cleanableItems.push({
            id: `deep_system_${item.name.replace(/\s+/g, '_').toLowerCase()}`,
            name: item.name,
            description: `深度分析发现的系统垃圾文件`,
            impact: '删除后不会影响系统运行',
            riskLevel: RiskLevel.SAFE,
            size: item.size,
            sizeFormatted: item.sizeFormatted,
            paths: [item.path],
            isDeepAnalysisResult: true
          });
        }
      }
    }
    
    // 转换用户垃圾文件
    if (deepResults.userJunk) {
      for (const item of deepResults.userJunk) {
        if (item.safeToClean && item.size > 0) {
          this.cleanableItems.push({
            id: `deep_user_${item.name.replace(/\s+/g, '_').toLowerCase()}`,
            name: item.name,
            description: `深度分析发现的用户垃圾文件`,
            impact: '删除后不会影响系统运行，但可能需要重新登录某些应用',
            riskLevel: RiskLevel.SAFE,
            size: item.size,
            sizeFormatted: item.sizeFormatted,
            paths: [item.path],
            isDeepAnalysisResult: true
          });
        }
      }
    }
    
    // 转换大文件
    if (deepResults.largeFiles) {
      const safeLargeFiles = deepResults.largeFiles.filter(f => f.isSafeToDelete);
      if (safeLargeFiles.length > 0) {
        const totalSize = safeLargeFiles.reduce((sum, f) => sum + f.size, 0);
        
        this.cleanableItems.push({
          id: 'deep_large_files',
          name: '可删除的大文件',
          description: `深度分析发现的 ${safeLargeFiles.length} 个可安全删除的大文件`,
          impact: '删除前请确认这些文件不再需要',
          riskLevel: RiskLevel.CAUTION,
          size: totalSize,
          sizeFormatted: this.formatBytes(totalSize),
          paths: safeLargeFiles.map(f => f.path),
          isDeepAnalysisResult: true,
          details: safeLargeFiles
        });
      }
    }
    
    // 转换重复文件
    if (deepResults.duplicateFiles && deepResults.duplicateFiles.length > 0) {
      const totalSize = deepResults.duplicateFiles.reduce((sum, d) => sum + d.size, 0);
      
      this.cleanableItems.push({
        id: 'deep_duplicate_files',
        name: '重复文件',
        description: `发现 ${deepResults.duplicateFiles.length} 组重复文件`,
        impact: '删除重复文件可以释放空间，但请保留原始文件',
        riskLevel: RiskLevel.CAUTION,
        size: totalSize,
        sizeFormatted: this.formatBytes(totalSize),
        paths: deepResults.duplicateFiles.map(d => d.duplicate),
        isDeepAnalysisResult: true,
        details: deepResults.duplicateFiles
      });
    }
    
    // 重新排序
    this.cleanableItems.sort((a, b) => b.size - a.size);
    
    console.log(`转换完成，新增 ${this.cleanableItems.length} 个可清理项目`);
  }

  /**
   * 获取深度分析结果
   * @returns {Object|null} 深度分析结果
   */
  getDeepAnalysisResults() {
    return this.deepAnalysisResults || null;
  }

  /**
   * 执行高级磁盘分析
   * @param {string} drive - 驱动器盘符
   */
  async performAdvancedAnalysis(drive) {
    console.log('开始高级磁盘分析...');
    
    try {
      const advancedAnalyzer = new AdvancedDiskAnalyzer();
      const advancedResults = await advancedAnalyzer.analyze(drive);
      
      // 保存高级分析结果
      this.advancedAnalysisResults = advancedResults;
      
      console.log('高级分析完成，发现建议:', advancedResults.recommendations.length);
      
      // 将高级分析结果转换为 cleanableItems 格式
      this.convertAdvancedResultsToCleanableItems(advancedResults);
      
      // 触发事件通知前端
      if (this.onAdvancedAnalysisComplete) {
        this.onAdvancedAnalysisComplete(advancedResults);
      }
      
      return advancedResults;
    } catch (error) {
      console.error('高级分析失败:', error);
      throw error;
    }
  }

  /**
   * 将高级分析结果转换为可清理项目
   * @param {Object} advancedResults - 高级分析结果
   */
  convertAdvancedResultsToCleanableItems(advancedResults) {
    if (!advancedResults || !advancedResults.recommendations) return;
    
    console.log('转换高级分析结果为可清理项目...');
    
    for (const rec of advancedResults.recommendations) {
      if (rec.size > 0) {
        let riskLevel = RiskLevel.CAUTION;
        let impact = rec.suggestion;
        
        // 根据类型设置风险等级
        if (rec.type === 'large_files' || rec.type === 'user_folder') {
          riskLevel = RiskLevel.CAUTION;
        } else if (rec.type === 'large_program') {
          riskLevel = RiskLevel.UNSAFE;
          impact = '卸载程序可能影响系统功能，请谨慎操作';
        }
        
        this.cleanableItems.push({
          id: `advanced_${rec.type}_${rec.name.replace(/\s+/g, '_').toLowerCase()}`,
          name: rec.name,
          description: rec.suggestion,
          impact: impact,
          riskLevel: riskLevel,
          size: rec.size,
          sizeFormatted: rec.sizeFormatted,
          paths: rec.path ? [rec.path] : (rec.files ? rec.files.map(f => f.path) : []),
          isAdvancedAnalysisResult: true,
          details: rec.files || rec
        });
      }
    }
    
    // 重新排序
    this.cleanableItems.sort((a, b) => b.size - a.size);
    
    console.log(`高级分析转换完成，当前共 ${this.cleanableItems.length} 个可清理项目`);
  }

  /**
   * 获取高级分析结果
   * @returns {Object|null} 高级分析结果
   */
  getAdvancedAnalysisResults() {
    return this.advancedAnalysisResults || null;
  }

  /**
   * 执行目录深入分析
   * @param {string} directoryType - 目录类型 ('windows' | 'users')
   * @returns {Promise<Object>} 分析结果
   */
  async performDirectoryAnalysis(directoryType) {
    console.log(`[DiskOptimizer] 开始${directoryType}目录深入分析...`);
    
    try {
      const analyzer = new DirectoryAnalyzer((progress) => {
        if (this.onDirectoryAnalysisProgress) {
          this.onDirectoryAnalysisProgress(progress);
        }
      });
      
      let results = [];
      
      if (directoryType === 'windows') {
        results = await analyzer.analyzeWindowsDirectory();
      } else if (directoryType === 'users') {
        results = await analyzer.analyzeUsersDirectory();
      }
      
      // 保存分析结果
      if (!this.directoryAnalysisResults) {
        this.directoryAnalysisResults = {};
      }
      this.directoryAnalysisResults[directoryType] = results;
      
      // 将结果转换为可清理项目
      this.convertDirectoryAnalysisToCleanableItems(results);
      
      console.log(`[DiskOptimizer] ${directoryType}目录分析完成，发现 ${results.length} 个项目`);
      
      return {
        success: true,
        directoryType,
        results,
        totalSize: results.reduce((sum, r) => sum + r.size, 0)
      };
    } catch (error) {
      console.error(`[DiskOptimizer] ${directoryType}目录分析失败:`, error);
      throw error;
    }
  }

  /**
   * 将目录分析结果转换为可清理项目
   * @param {Array} results - 目录分析结果
   */
  convertDirectoryAnalysisToCleanableItems(results) {
    if (!results || results.length === 0) return;
    
    console.log('[DiskOptimizer] 转换目录分析结果为可清理项目...');
    
    for (const item of results) {
      if (item.size > 0) {
        const existingItem = this.cleanableItems.find(i => i.path === item.path);
        if (!existingItem) {
          this.cleanableItems.push({
            id: `dir_analysis_${item.name.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}`,
            name: item.name,
            description: item.description,
            impact: item.suggestion,
            riskLevel: item.riskLevel,
            size: item.size,
            sizeFormatted: item.sizeFormatted,
            paths: [item.path],
            isDirectoryAnalysisResult: true,
            safeToClean: item.safeToClean
          });
        }
      }
    }
    
    // 重新排序
    this.cleanableItems.sort((a, b) => b.size - a.size);
    
    console.log(`[DiskOptimizer] 目录分析转换完成，当前共 ${this.cleanableItems.length} 个可清理项目`);
  }

  /**
   * 扫描指定目录的大文件
   * @param {string} directory - 目录路径
   * @param {number} minSize - 最小文件大小（字节）
   * @returns {Promise<Array>} 大文件列表
   */
  async scanDirectoryLargeFiles(directory, minSize = 100 * 1024 * 1024) {
    console.log(`[DiskOptimizer] 扫描 ${directory} 中的大文件...`);
    
    try {
      const analyzer = new DirectoryAnalyzer();
      const files = await analyzer.scanLargeFiles(directory, minSize);
      
      return {
        success: true,
        directory,
        files,
        totalSize: files.reduce((sum, f) => sum + f.size, 0)
      };
    } catch (error) {
      console.error('[DiskOptimizer] 扫描大文件失败:', error);
      throw error;
    }
  }

  /**
   * 获取目录分析结果
   * @param {string} directoryType - 目录类型
   * @returns {Object|null} 分析结果
   */
  getDirectoryAnalysisResults(directoryType) {
    return this.directoryAnalysisResults?.[directoryType] || null;
  }

  /**
   * 获取磁盘信息
   * @param {string} drive - 驱动器盘符
   * @returns {Promise<Object|null>} 磁盘信息
   */
  async getDiskInfo(drive) {
    try {
      const { stdout } = await execAsync(
        `wmic logicaldisk where "DeviceID='${drive}'" get Size,FreeSpace /value`,
        { timeout: 10000 }
      );
      
      const lines = stdout.split('\n');
      let totalSize = 0;
      let freeSpace = 0;
      
      for (const line of lines) {
        if (line.includes('Size=')) {
          totalSize = parseInt(line.split('=')[1]) || 0;
        } else if (line.includes('FreeSpace=')) {
          freeSpace = parseInt(line.split('=')[1]) || 0;
        }
      }
      
      const usedSpace = totalSize - freeSpace;
      const usagePercent = totalSize > 0 ? Math.round((usedSpace / totalSize) * 100) : 0;
      
      return {
        drive,
        totalSize,
        freeSpace,
        usedSpace,
        usagePercent,
        totalSizeFormatted: this.formatBytes(totalSize),
        freeSpaceFormatted: this.formatBytes(freeSpace),
        usedSpaceFormatted: this.formatBytes(usedSpace),
        status: this.getDiskStatus(usagePercent)
      };
    } catch (error) {
      console.error('获取磁盘信息失败:', error);
      return null;
    }
  }

  /**
   * 根据使用率获取磁盘状态
   * @param {number} usagePercent - 使用率百分比
   * @returns {string} 状态描述
   */
  getDiskStatus(usagePercent) {
    if (usagePercent >= 90) return 'critical';
    if (usagePercent >= 70) return 'warning';
    return 'normal';
  }

  /**
   * 分析各类文件占用
   * @returns {Promise<Object[]>} 分类统计结果
   */
  async analyzeCategories() {
    const categories = [
      { name: '系统文件', paths: ['%WINDIR%'], color: '#ef4444', type: 'system' },
      { name: '应用程序', paths: ['%PROGRAMFILES%', '%PROGRAMFILES(X86)%'], color: '#f97316', type: 'apps' },
      { name: '用户文件', paths: ['%USERPROFILE%\\Documents', '%USERPROFILE%\\Downloads', '%USERPROFILE%\\Desktop'], color: '#22c55e', type: 'user' },
      { name: '临时文件', paths: ['%TEMP%', '%WINDIR%\\Temp'], color: '#eab308', type: 'temp' },
      { name: '其他', paths: [], color: '#6b7280', type: 'other' }
    ];
    
    const results = [];
    
    for (const category of categories) {
      let size = 0;
      let accessiblePaths = 0;
      
      for (const pathTemplate of category.paths) {
        const expandedPath = this.expandEnvironmentVariables(pathTemplate);
        try {
          if (await fs.pathExists(expandedPath)) {
            size += await this.calculateDirectorySize(expandedPath);
            accessiblePaths++;
          }
        } catch (error) {
          // 忽略无法访问的目录
        }
      }
      
      results.push({
        name: category.name,
        type: category.type,
        size,
        sizeFormatted: this.formatBytes(size),
        color: category.color,
        accessiblePaths
      });
    }
    
    return results;
  }

  /**
   * 查找大文件
   * @param {string} drive - 驱动器盘符
   * @param {number} limit - 返回文件数量限制
   * @returns {Promise<Object[]>} 大文件列表
   */
  async findLargeFiles(drive, limit = 100) {
    const cacheKey = `largeFiles_${drive}_${limit}`;
    const cached = this.getCache(cacheKey);
    if (cached) return cached;
    
    const largeFiles = [];
    
    try {
      // 使用 PowerShell 查找大文件
      const psCommand = `
        Get-ChildItem -Path "${drive}\\" -Recurse -File -ErrorAction SilentlyContinue |
        Where-Object { $_.Length -gt 100MB } |
        Sort-Object Length -Descending |
        Select-Object -First ${limit} |
        Select-Object FullName, Length, LastWriteTime |
        ConvertTo-Json
      `;
      
      const { stdout } = await execAsync(`powershell -Command "${psCommand}"`, {
        timeout: 60000,
        maxBuffer: 1024 * 1024 * 10
      });
      
      if (stdout) {
        const files = JSON.parse(stdout);
        const fileArray = Array.isArray(files) ? files : [files];
        
        for (const file of fileArray) {
          if (file && file.FullName) {
            largeFiles.push({
              path: file.FullName,
              size: file.Length,
              sizeFormatted: this.formatBytes(file.Length),
              lastModified: file.LastWriteTime,
              // 添加风险检查
              isSafeToDelete: this.isSafePath(file.FullName)
            });
          }
        }
      }
      
      this.setCache(cacheKey, largeFiles);
      return largeFiles;
    } catch (error) {
      console.error('查找大文件失败:', error);
      return [];
    }
  }

  /**
   * 分析可清理项目
   * @returns {Promise<Object[]>} 可清理项目列表
   */
  async analyzeCleanableItems() {
    const cacheKey = 'cleanableItems';
    const cached = this.getCache(cacheKey);
    if (cached) {
      this.cleanableItems = cached;
      return cached;
    }
    
    const items = [];
    const allItems = [...SAFE_ITEMS, ...CAUTION_ITEMS];
    
    // 并行分析所有项目
    const analysisPromises = allItems.map(item => this.analyzeItem(item));
    const analyzedItems = await Promise.all(analysisPromises);
    
    for (const analyzedItem of analyzedItems) {
      if (analyzedItem.size > 0) {
        items.push(analyzedItem);
      }
    }
    
    // 按大小排序
    items.sort((a, b) => b.size - a.size);
    
    // 保存到实例变量，供深度分析使用
    this.cleanableItems = items;
    
    this.setCache(cacheKey, items);
    return items;
  }

  /**
   * 分析单个清理项目
   * @param {CleanableItem} item - 清理项目配置
   * @returns {Promise<Object>} 分析结果
   */
  async analyzeItem(item) {
    const results = await Promise.all(
      item.paths.map(pathTemplate => this.analyzePath(pathTemplate))
    );

    const successfulResults = results.filter(r => r.success);
    const failedCount = results.length - successfulResults.length;

    const totalSize = successfulResults.reduce((sum, r) => sum + r.size, 0);
    const fileList = successfulResults.map(r => r.fileInfo);

    return {
      ...item,
      size: totalSize,
      sizeFormatted: this.formatBytes(totalSize),
      fileList,
      accessiblePaths: successfulResults.length,
      failedPaths: failedCount
    };
  }

  /**
   * 分析单个路径
   * @param {string} pathTemplate - 路径模板
   * @returns {Promise<Object>} 分析结果
   */
  async analyzePath(pathTemplate) {
    const expandedPath = this.expandEnvironmentVariables(pathTemplate);

    try {
      if (!await fs.pathExists(expandedPath)) {
        return { success: false, reason: 'path_not_exists' };
      }

      const stats = await fs.stat(expandedPath);
      const isDirectory = stats.isDirectory();
      const size = isDirectory 
        ? await this.calculateDirectorySize(expandedPath)
        : stats.size;

      return {
        success: true,
        size,
        fileInfo: {
          path: expandedPath,
          size,
          isDirectory
        }
      };
    } catch (error) {
      this.logError(`分析路径失败: ${expandedPath}`, error);
      return { success: false, reason: 'access_error', error: error.message };
    }
  }

  /**
   * 记录错误日志
   * @param {string} message - 错误消息
   * @param {Error} error - 错误对象
   */
  logError(message, error) {
    if (this.outputChannel) {
      this.outputChannel.appendLine(`[错误] ${message}: ${error.message}`);
    }
    console.error(message, error);
  }

  /**
   * 计算目录大小
   * @param {string} dirPath - 目录路径
   * @param {number} [maxDepth=10] - 最大递归深度
   * @param {Set<string>} [visitedPaths] - 已访问路径集合（防止循环引用）
   * @returns {Promise<number>} 目录大小（字节）
   */
  async calculateDirectorySize(dirPath, maxDepth = 10, visitedPaths = new Set()) {
    // 防止无限递归和循环引用
    if (maxDepth <= 0) {
      return 0;
    }

    // 解析真实路径，处理符号链接
    let realPath;
    try {
      realPath = await fs.realpath(dirPath);
    } catch (error) {
      this.logError(`无法解析路径: ${dirPath}`, error);
      return 0;
    }

    // 检查是否已访问（防止循环引用）
    if (visitedPaths.has(realPath)) {
      return 0;
    }
    visitedPaths.add(realPath);

    let totalSize = 0;

    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);

        try {
          if (entry.isDirectory()) {
            totalSize += await this.calculateDirectorySize(fullPath, maxDepth - 1, visitedPaths);
          } else if (entry.isFile()) {
            const stats = await fs.stat(fullPath);
            totalSize += stats.size;
          }
          // 忽略符号链接，防止循环
        } catch (error) {
          this.logError(`无法访问文件: ${fullPath}`, error);
          // 继续处理其他文件
        }
      }
    } catch (error) {
      this.logError(`无法读取目录: ${dirPath}`, error);
      // 返回已计算的大小
    }

    return totalSize;
  }

  /**
   * 执行清理
   * @param {string[]} itemIds - 要清理的项目ID列表
   * @returns {Promise<Object>} 清理结果
   */
  async cleanItems(itemIds) {
    if (!Array.isArray(itemIds) || itemIds.length === 0) {
      return {
        success: false,
        error: '未提供有效的清理项目',
        errorCode: 'INVALID_ITEMS'
      };
    }
    
    // 1. 创建系统还原点（清理前）
    let restorePointId = null;
    try {
      restorePointId = await this.createSystemRestorePoint();
      console.log('[DiskOptimizer] 系统还原点已创建:', restorePointId);
    } catch (error) {
      console.warn('[DiskOptimizer] 创建系统还原点失败:', error.message);
      // 继续清理，但不记录还原点
    }
    
    const results = [];
    let totalCleaned = 0;
    const allCleanedFiles = [];
    const cleanedItems = [];
    
    // 获取所有可清理项目（包括深度分析和高级分析的结果）
    const allItems = this.cleanableItems.length > 0 
      ? this.cleanableItems 
      : [...SAFE_ITEMS, ...CAUTION_ITEMS];
    
    for (const itemId of itemIds) {
      const item = allItems.find(i => i.id === itemId);
      
      if (!item) {
        results.push({
          id: itemId,
          success: false,
          error: '未找到清理项目',
          errorCode: 'ITEM_NOT_FOUND'
        });
        continue;
      }
      
      // 检查是否为安全项目
      if (item.riskLevel === RiskLevel.DANGER) {
        results.push({
          id: itemId,
          name: item.name,
          success: false,
          error: '危险项目不允许自动清理',
          errorCode: 'DANGER_ITEM_BLOCKED'
        });
        continue;
      }
      
      // 执行清理
      const result = await this.cleanItem(item);
      results.push(result);
      
      if (result.success) {
        totalCleaned += result.cleanedSize || 0;
        allCleanedFiles.push(...(result.cleanedFiles || []));
        cleanedItems.push({
          id: item.id,
          name: item.name,
          size: result.cleanedSize,
          sizeFormatted: result.cleanedSizeFormatted
        });
      }
    }
    
    // 2. 记录详细的清理历史
    try {
      const historyData = {
        itemsCount: cleanedItems.length,
        totalSize: totalCleaned,
        freedSpace: totalCleaned,
        items: cleanedItems,
        files: allCleanedFiles.slice(0, 100), // 最多记录100个文件
        restorePointId: restorePointId,
        restorePointDescription: restorePointId ? '清理前自动创建的还原点' : null,
        status: 'completed',
        isRestorable: allCleanedFiles.length > 0
      };
      
      const historyId = this.db.addCleanupHistory(historyData);
      console.log('[DiskOptimizer] 清理历史已记录, ID:', historyId);
    } catch (error) {
      console.error('[DiskOptimizer] 记录清理历史失败:', error);
    }
    
    // 3. 记录旧的清理日志（向后兼容）
    await this.logCleanup(results, totalCleaned);
    
    // 清除缓存
    this.clearCache('cleanableItems');
    
    return {
      success: true,
      results,
      totalCleaned,
      totalCleanedFormatted: this.formatBytes(totalCleaned),
      cleanedAt: new Date().toISOString(),
      restorePointId,
      historyRecorded: true
    };
  }

  /**
   * 创建系统还原点
   * @returns {Promise<string>} 还原点ID
   */
  async createSystemRestorePoint() {
    console.log('[DiskOptimizer] 正在创建系统还原点...');
    
    try {
      // 使用 PowerShell 创建系统还原点
      const description = `本地电脑助手清理前还原点 - ${new Date().toLocaleString('zh-CN')}`;
      const cmd = `powershell -Command "Checkpoint-Computer -Description '${description}' -RestorePointType 'MODIFY_SETTINGS'"`;
      
      await execAsync(cmd, { timeout: 60000 });
      
      // 获取最新的还原点ID
      const getIdCmd = `powershell -Command "(Get-ComputerRestorePoint | Select-Object -First 1).SequenceNumber"`;
      const { stdout } = await execAsync(getIdCmd, { timeout: 10000 });
      const restorePointId = stdout.trim();
      
      console.log('[DiskOptimizer] 系统还原点创建成功, ID:', restorePointId);
      return restorePointId;
    } catch (error) {
      console.error('[DiskOptimizer] 创建系统还原点失败:', error.message);
      throw error;
    }
  }

  /**
   * 清理单个项目
   * @param {CleanableItem} item - 清理项目
   * @returns {Promise<Object>} 清理结果
   */
  async cleanItem(item) {
    let cleanedSize = 0;
    const cleanedFiles = [];
    const errors = [];
    let skippedCount = 0;
    
    for (const pathTemplate of item.paths) {
      const expandedPath = this.expandEnvironmentVariables(pathTemplate);
      
      try {
        // 安全检查
        if (!this.isSafePath(expandedPath)) {
          errors.push({ 
            path: expandedPath, 
            error: '路径不在安全列表中，跳过清理',
            skipped: true
          });
          skippedCount++;
          continue;
        }
        
        if (await fs.pathExists(expandedPath)) {
          const stats = await fs.stat(expandedPath);
          
          if (stats.isDirectory()) {
            // 计算目录大小
            const size = await this.calculateDirectorySize(expandedPath);
            cleanedSize += size;
            
            // 使用 PowerShell 以管理员权限删除
            const result = await this.cleanDirectoryWithAdmin(expandedPath);
            cleanedFiles.push(...result.cleanedFiles);
            if (result.errors.length > 0) {
              errors.push(...result.errors);
            }
          } else {
            // 使用 PowerShell 以管理员权限删除文件
            try {
              await this.removeFileWithAdmin(expandedPath);
              cleanedSize += stats.size;
              cleanedFiles.push(expandedPath);
            } catch (error) {
              errors.push({ path: expandedPath, error: error.message });
            }
          }
        }
      } catch (error) {
        errors.push({ path: expandedPath, error: error.message });
      }
    }
    
    return {
      id: item.id,
      name: item.name,
      success: errors.length === 0 || cleanedFiles.length > 0,
      cleanedSize,
      cleanedSizeFormatted: this.formatBytes(cleanedSize),
      cleanedFiles,
      errors: errors.length > 0 ? errors : undefined,
      skippedCount
    };
  }

  /**
   * 使用管理员权限删除目录内容
   * @param {string} dirPath - 目录路径
   * @returns {Promise<Object>} 删除结果
   */
  async cleanDirectoryWithAdmin(dirPath) {
    const cleanedFiles = [];
    const errors = [];
    
    try {
      const entries = await fs.readdir(dirPath);
      
      for (const entry of entries) {
        const entryPath = path.join(dirPath, entry);
        
        try {
          await this.removeFileWithAdmin(entryPath);
          cleanedFiles.push(entryPath);
        } catch (error) {
          // 尝试普通删除
          try {
            await fs.remove(entryPath);
            cleanedFiles.push(entryPath);
          } catch (e) {
            errors.push({ path: entryPath, error: error.message });
          }
        }
      }
    } catch (error) {
      errors.push({ path: dirPath, error: error.message });
    }
    
    return { cleanedFiles, errors };
  }

  /**
   * 使用管理员权限删除文件
   * @param {string} filePath - 文件路径
   */
  async removeFileWithAdmin(filePath) {
    const { execSync } = require('child_process');
    
    // 使用 PowerShell 删除文件（支持管理员权限）
    const cmd = `powershell -NoProfile -Command "Remove-Item -Path '${filePath}' -Recurse -Force -ErrorAction SilentlyContinue"`;
    
    try {
      execSync(cmd, { encoding: 'utf8', timeout: 30000 });
    } catch (error) {
      // 如果 PowerShell 失败，尝试普通删除
      await fs.remove(filePath);
    }
  }

  /**
   * 获取系统优化建议
   * @returns {Promise<Object[]>} 优化建议列表
   */
  async getOptimizationSuggestions() {
    const suggestions = [];
    
    // 检查休眠功能
    try {
      const hibernationSuggestion = await this.checkHibernation();
      if (hibernationSuggestion) {
        suggestions.push(hibernationSuggestion);
      }
    } catch (error) {
      console.error('检查休眠功能失败:', error);
    }
    
    // 检查虚拟内存
    try {
      const pagefileSuggestion = await this.checkPagefile();
      if (pagefileSuggestion) {
        suggestions.push(pagefileSuggestion);
      }
    } catch (error) {
      console.error('检查虚拟内存失败:', error);
    }
    
    return suggestions;
  }

  /**
   * 检查休眠功能
   * @returns {Promise<Object|null>} 休眠优化建议
   */
  async checkHibernation() {
    const { stdout } = await execAsync('powercfg /a', { timeout: 5000 });
    const hibernationEnabled = stdout.includes('休眠');
    
    if (hibernationEnabled) {
      const hiberfilPath = path.join(process.env.SYSTEMDRIVE || 'C:', 'hiberfil.sys');
      let hiberfilSize = 0;
      
      try {
        const stats = await fs.stat(hiberfilPath);
        hiberfilSize = stats.size;
      } catch (error) {
        // 文件可能不存在或无法访问
      }
      
      return {
        id: 'disable_hibernation',
        title: '关闭休眠功能',
        description: '休眠功能会占用与内存大小相当的磁盘空间',
        currentStatus: '已开启',
        potentialSaving: hiberfilSize,
        potentialSavingFormatted: this.formatBytes(hiberfilSize),
        impact: '关闭后将无法使用休眠功能，但睡眠功能不受影响',
        action: '关闭休眠',
        command: 'powercfg /hibernate off',
        category: 'system'
      };
    }
    
    return null;
  }

  /**
   * 检查虚拟内存
   * @returns {Promise<Object|null>} 虚拟内存优化建议
   */
  async checkPagefile() {
    try {
      // 获取虚拟内存文件位置
      const { stdout: locationOutput } = await execAsync('wmic pagefile list /format:list', { timeout: 5000 });
      
      // 检查虚拟内存是否在C盘
      const nameMatch = locationOutput.match(/Name=([A-Z]:)\\pagefile\.sys/i);
      if (!nameMatch || nameMatch[1].toUpperCase() !== 'C:') {
        console.log('[DiskOptimizer] 虚拟内存不在C盘，跳过优化建议');
        return null;
      }
      
      const sizeMatch = locationOutput.match(/AllocatedBaseSize=(\d+)/);
      
      if (sizeMatch) {
        const pagefileSize = parseInt(sizeMatch[1]) * 1024 * 1024; // MB to bytes
        
        // 只建议优化大于 4GB 的虚拟内存
        if (pagefileSize > 4 * 1024 * 1024 * 1024) {
          return {
            id: 'optimize_pagefile',
            title: '优化虚拟内存设置',
            description: '当前C盘虚拟内存占用较大空间',
            currentStatus: `已分配 ${this.formatBytes(pagefileSize)}`,
            potentialSaving: pagefileSize * 0.5, // 估计可节省50%
            potentialSavingFormatted: this.formatBytes(pagefileSize * 0.5),
            impact: '减小虚拟内存可能影响大型应用程序的性能',
            action: '优化设置',
            command: 'sysdm.cpl', // 打开系统属性
            category: 'system'
          };
        }
      }
    } catch (error) {
      console.error('[DiskOptimizer] 检查虚拟内存失败:', error.message);
    }
    
    return null;
  }

  /**
   * 记录清理日志
   * @param {Object[]} results - 清理结果
   * @param {number} totalCleaned - 总共清理的字节数
   * @returns {Promise<void>}
   */
  async logCleanup(results, totalCleaned) {
    try {
      const logEntry = {
        timestamp: new Date().toISOString(),
        totalCleaned,
        totalCleanedFormatted: this.formatBytes(totalCleaned),
        items: results.filter(r => r.success).map(r => ({
          id: r.id,
          name: r.name,
          cleanedSize: r.cleanedSize,
          cleanedSizeFormatted: r.cleanedSizeFormatted
        })),
        successCount: results.filter(r => r.success).length,
        failCount: results.filter(r => !r.success).length
      };
      
      if (this.db) {
        await this.db.addCleanupLog(logEntry);
      }
    } catch (error) {
      console.error('记录清理日志失败:', error);
    }
  }

  /**
   * 获取清理历史
   * @param {number} limit - 返回记录数量限制
   * @returns {Promise<Object[]>} 清理历史记录
   */
  async getCleanupHistory(limit = 50) {
    try {
      if (this.db) {
        return await this.db.getCleanupLogs(limit);
      }
      return [];
    } catch (error) {
      console.error('获取清理历史失败:', error);
      return [];
    }
  }

  /**
   * 展开环境变量
   * @param {string} pathTemplate - 包含环境变量的路径
   * @returns {string} 展开后的路径
   */
  expandEnvironmentVariables(pathTemplate) {
    return pathTemplate.replace(/%([^%]+)%/g, (match, varName) => {
      return process.env[varName] || match;
    });
  }

  /**
   * 格式化字节大小
   * @param {number} bytes - 字节数
   * @param {number} [decimals=2] - 小数位数
   * @returns {string} 格式化后的字符串
   */
  formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 B';
    if (bytes < 0) return '0 B';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const index = Math.min(i, sizes.length - 1);
    
    return parseFloat((bytes / Math.pow(k, index)).toFixed(dm)) + ' ' + sizes[index];
  }

  /**
   * 检查路径是否安全（不是系统关键路径）
   * @param {string} targetPath - 目标路径
   * @returns {boolean} 是否安全
   */
  isSafePath(targetPath) {
    const normalizedPath = path.normalize(targetPath).toLowerCase();
    
    for (const dangerPath of DANGER_PATHS) {
      const expandedDangerPath = this.expandEnvironmentVariables(dangerPath).toLowerCase();
      
      if (normalizedPath === expandedDangerPath ||
          normalizedPath.startsWith(expandedDangerPath + '\\')) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * 获取缓存
   * @param {string} key - 缓存键
   * @returns {any|null} 缓存值
   */
  getCache(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.value;
    }
    this.cache.delete(key);
    return null;
  }

  /**
   * 设置缓存
   * @param {string} key - 缓存键
   * @param {any} value - 缓存值
   */
  setCache(key, value) {
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }

  /**
   * 清除缓存
   * @param {string} [key] - 缓存键，不提供则清除所有
   */
  clearCache(key) {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }
}

module.exports = DiskOptimizer;
