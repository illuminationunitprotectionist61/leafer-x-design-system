const fs = require('fs-extra');
const path = require('path');

class ConfigManager {
  constructor(userDataPath) {
    this.configPath = path.join(userDataPath, 'config.json');
    this.config = null;
  }

  async initialize() {
    const defaultConfig = {
      language: 'zh-CN',
      autoStartServer: true,
      serverPort: 3888,
      transferPort: 3889,
      maxConnections: 5,
      theme: 'light',
      managedFolders: [],
      organizeRules: {
        imageFolder: '',
        documentFolder: '',
        sortByDate: true,
        detectDuplicates: true
      },
      security: {
        requireAuth: true,
        sessionTimeout: 3600000
      }
    };

    try {
      if (await fs.pathExists(this.configPath)) {
        this.config = await fs.readJson(this.configPath);
        this.config = { ...defaultConfig, ...this.config };
      } else {
        this.config = defaultConfig;
        await this.save();
      }
    } catch (error) {
      console.error('配置加载失败:', error);
      this.config = defaultConfig;
    }
  }

  getConfig() {
    return { ...this.config };
  }

  get(key) {
    return this.config[key];
  }

  set(key, value) {
    this.config[key] = value;
    return this.save();
  }

  async setConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    await this.save();
    return this.config;
  }

  async save() {
    await fs.ensureDir(path.dirname(this.configPath));
    await fs.writeJson(this.configPath, this.config, { spaces: 2 });
  }
}

module.exports = ConfigManager;
