/**
 * 云同步管理器
 * 实现配置和数据的跨设备同步
 */

const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');

/**
 * 云同步管理器类
 */
class CloudSyncManager {
  constructor(configManager) {
    this.configManager = configManager;
    this.syncConfig = null;
    this.isSyncing = false;
    this.lastSyncTime = 0;
    this.syncInterval = 5 * 60 * 1000; // 5分钟同步一次
  }

  /**
   * 初始化云同步
   */
  async initialize() {
    this.syncConfig = this.configManager.get('cloudSync') || {
      enabled: false,
      provider: null, // 'onedrive', 'googledrive', 'dropbox', 'custom'
      syncPath: null,
      autoSync: true,
      lastSync: null
    };

    if (this.syncConfig.enabled && this.syncConfig.autoSync) {
      this.startAutoSync();
    }
  }

  /**
   * 设置云同步
   */
  async setupSync(provider, credentials) {
    this.syncConfig = {
      enabled: true,
      provider,
      credentials: this.encryptCredentials(credentials),
      syncPath: `codebuff-sync-${this.generateDeviceId()}`,
      autoSync: true,
      lastSync: null
    };

    await this.configManager.set('cloudSync', this.syncConfig);
    
    // 立即执行首次同步
    await this.syncToCloud();
    
    // 启动自动同步
    this.startAutoSync();

    return { success: true, message: '云同步设置成功' };
  }

  /**
   * 同步到云端
   */
  async syncToCloud() {
    if (this.isSyncing) return;
    this.isSyncing = true;

    try {
      const syncData = await this.prepareSyncData();
      const syncPath = path.join(this.getSyncFolder(), 'sync-data.json');
      
      await fs.writeJson(syncPath, syncData, { spaces: 2 });
      
      this.syncConfig.lastSync = new Date().toISOString();
      await this.configManager.set('cloudSync', this.syncConfig);

      console.log('云同步完成:', new Date().toLocaleString());
      return { success: true, timestamp: this.syncConfig.lastSync };
    } catch (error) {
      console.error('云同步失败:', error);
      return { success: false, error: error.message };
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * 从云端同步
   */
  async syncFromCloud() {
    if (this.isSyncing) return;
    this.isSyncing = true;

    try {
      const syncPath = path.join(this.getSyncFolder(), 'sync-data.json');
      
      if (!await fs.pathExists(syncPath)) {
        return { success: false, message: '云端没有同步数据' };
      }

      const syncData = await fs.readJson(syncPath);
      await this.applySyncData(syncData);

      console.log('从云端同步完成:', new Date().toLocaleString());
      return { success: true, data: syncData };
    } catch (error) {
      console.error('从云端同步失败:', error);
      return { success: false, error: error.message };
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * 准备同步数据
   */
  async prepareSyncData() {
    const config = this.configManager.getConfig();
    
    // 移除敏感信息
    const safeConfig = { ...config };
    delete safeConfig.cloudSync?.credentials;

    return {
      version: '1.0.0',
      deviceId: this.generateDeviceId(),
      deviceName: require('os').hostname(),
      timestamp: new Date().toISOString(),
      config: safeConfig,
      stats: {
        organizeCount: config.stats?.organizeCount || 0,
        transferCount: config.stats?.transferCount || 0,
        cleanCount: config.stats?.cleanCount || 0
      }
    };
  }

  /**
   * 应用同步数据
   */
  async applySyncData(syncData) {
    if (syncData.config) {
      // 合并配置（保留本地特定的配置）
      const localConfig = this.configManager.getConfig();
      const mergedConfig = {
        ...syncData.config,
        // 保留本地配置
        folders: localConfig.folders,
        server: localConfig.server,
        cloudSync: localConfig.cloudSync
      };
      
      await this.configManager.setConfig(mergedConfig);
    }
  }

  /**
   * 启动自动同步
   */
  startAutoSync() {
    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId);
    }

    this.syncIntervalId = setInterval(() => {
      this.syncToCloud();
    }, this.syncInterval);

    console.log('自动同步已启动，间隔:', this.syncInterval / 1000, '秒');
  }

  /**
   * 停止自动同步
   */
  stopAutoSync() {
    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId);
      this.syncIntervalId = null;
    }
    console.log('自动同步已停止');
  }

  /**
   * 获取同步文件夹
   */
  getSyncFolder() {
    // 支持多种云存储路径
    const possiblePaths = [
      // OneDrive
      path.join(require('os').homedir(), 'OneDrive', 'CodebuffSync'),
      // Google Drive
      path.join(require('os').homedir(), 'Google Drive', 'CodebuffSync'),
      // Dropbox
      path.join(require('os').homedir(), 'Dropbox', 'CodebuffSync'),
      // 本地同步文件夹
      path.join(require('os').homedir(), 'CodebuffSync')
    ];

    // 返回第一个存在的路径，或创建默认路径
    for (const syncPath of possiblePaths) {
      if (fs.pathExistsSync(syncPath)) {
        return syncPath;
      }
    }

    // 创建默认同步文件夹
    const defaultPath = possiblePaths[possiblePaths.length - 1];
    fs.ensureDirSync(defaultPath);
    return defaultPath;
  }

  /**
   * 生成设备ID
   */
  generateDeviceId() {
    const hostname = require('os').hostname();
    const username = require('os').userInfo().username;
    return crypto.createHash('md5').update(`${hostname}-${username}`).digest('hex').substring(0, 8);
  }

  /**
   * 加密凭证
   */
  encryptCredentials(credentials) {
    // 简单的加密，实际应该使用更安全的加密方式
    const key = this.generateDeviceId();
    const text = JSON.stringify(credentials);
    const cipher = crypto.createCipher('aes-256-cbc', key);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  /**
   * 解密凭证
   */
  decryptCredentials(encrypted) {
    const key = this.generateDeviceId();
    const decipher = crypto.createDecipher('aes-256-cbc', key);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted);
  }

  /**
   * 获取同步状态
   */
  getSyncStatus() {
    return {
      enabled: this.syncConfig?.enabled || false,
      provider: this.syncConfig?.provider || null,
      lastSync: this.syncConfig?.lastSync || null,
      isSyncing: this.isSyncing,
      syncPath: this.getSyncFolder()
    };
  }

  /**
   * 导出配置
   */
  async exportConfig(exportPath) {
    const config = this.configManager.getConfig();
    const exportData = {
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      config: config
    };

    await fs.writeJson(exportPath, exportData, { spaces: 2 });
    return { success: true, path: exportPath };
  }

  /**
   * 导入配置
   */
  async importConfig(importPath) {
    if (!await fs.pathExists(importPath)) {
      return { success: false, error: '配置文件不存在' };
    }

    try {
      const importData = await fs.readJson(importPath);
      
      if (importData.config) {
        await this.configManager.setConfig(importData.config);
        return { success: true, message: '配置导入成功' };
      } else {
        return { success: false, error: '无效的配置文件' };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = CloudSyncManager;
