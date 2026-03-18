/**
 * WizTree 扫描器
 * 使用 WizTree 实现极速磁盘扫描（2-3秒）
 */

const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');

class WizTreeScanner {
  constructor() {
    this.results = {
      categories: {},
      cleanableItems: [],
      largeFiles: [],
      totalCanClean: 0
    };
    this.wizTreePath = this.findWizTree();
    this.userName = os.userInfo().username;
  }

  /**
   * 查找 WizTree 可执行文件
   */
  findWizTree() {
    const possiblePaths = [
      path.join(__dirname, '..', '..', '..', 'tools', 'wiztree', 'WizTree.exe'),
      path.join(__dirname, '..', '..', 'tools', 'wiztree', 'WizTree.exe'),
      'C:\\Program Files\\WizTree\\WizTree.exe',
      'C:\\Program Files (x86)\\WizTree\\WizTree.exe',
      path.join(os.homedir(), 'AppData', 'Local', 'Programs', 'WizTree', 'WizTree.exe')
    ];

    for (const p of possiblePaths) {
      if (fs.pathExistsSync(p)) {
        console.log(`[WizTreeScanner] 找到 WizTree: ${p}`);
        return p;
      }
    }

    console.log('[WizTreeScanner] 未找到 WizTree，将使用备用扫描方法');
    return null;
  }

  /**
   * 执行扫描
   */
  async analyze(drive = 'C:') {
    console.log(`[WizTreeScanner] 开始扫描 ${drive}...`);
    const startTime = Date.now();

    try {
      if (this.wizTreePath) {
        // 使用 WizTree 快速扫描
        await this.scanWithWizTree(drive);
      } else {
        // 备用方案：使用 PowerShell
        await this.scanWithPowerShell(drive);
      }

      const duration = (Date.now() - startTime) / 1000;
      console.log(`[WizTreeScanner] 扫描完成，耗时: ${duration.toFixed(1)}秒`);
      console.log(`[WizTreeScanner] 发现可清理空间: ${this.formatBytes(this.results.totalCanClean)}`);
      console.log(`[WizTreeScanner] 发现 ${this.results.cleanableItems.length} 个可清理项目`);
      
      return this.results;
    } catch (error) {
      console.error('[WizTreeScanner] 扫描失败:', error);
      throw error;
    }
  }

  /**
   * 使用 WizTree 扫描
   */
  async scanWithWizTree(drive) {
    console.log('[WizTreeScanner] 使用 WizTree 扫描...');

    const csvPath = path.join(os.tmpdir(), `wiztree_${Date.now()}.csv`);

    try {
      // 使用 WizTree64.exe（64位系统）
      const exePath = this.wizTreePath.includes('WizTree.exe') && fs.pathExistsSync(this.wizTreePath.replace('WizTree.exe', 'WizTree64.exe'))
        ? this.wizTreePath.replace('WizTree.exe', 'WizTree64.exe')
        : this.wizTreePath;

      // WizTree 命令行参数（不需要管理员权限的模式）
      // /admin=0 表示不要求管理员权限
      const cmd = `"${exePath}" "${drive}\\" /export="${csvPath}" /exportfolders=1 /admin=0`;
      console.log(`[WizTreeScanner] 执行命令: ${cmd}`);
      
      execSync(cmd, { encoding: 'utf8', timeout: 60000 });

      // 解析 CSV 结果
      if (await fs.pathExists(csvPath)) {
        await this.parseWizTreeCSV(csvPath);
        await fs.remove(csvPath);
      }

      // 扫描垃圾文件
      await this.scanJunkFiles(drive);

      // 扫描大文件
      await this.scanLargeFilesWithWizTree(drive);

    } catch (error) {
      console.log('[WizTreeScanner] WizTree 扫描失败:', error.message);
      // 删除可能残留的CSV文件
      try { await fs.remove(csvPath); } catch (e) {}
      // 使用备用方法
      await this.scanWithPowerShell(drive);
    }
  }

  /**
   * 解析 WizTree CSV 结果
   */
  async parseWizTreeCSV(csvPath) {
    console.log('[WizTreeScanner] 解析 WizTree CSV...');

    try {
      const content = await fs.readFile(csvPath, 'utf8');
      const lines = content.split('\n').slice(1); // 跳过标题行

      const folderSizes = {};

      for (const line of lines) {
        if (!line.trim()) continue;

        // CSV 格式: "Folder Name","Size (Bytes)","Size","Files","Folders","% of Parent"
        const match = line.match(/"([^"]+)","(\d+)","([^"]+)","(\d+)","(\d+)"/);
        if (match) {
          const folderName = match[1];
          const size = parseInt(match[2]);

          folderSizes[folderName] = size;
        }
      }

      // 映射到主要目录
      const dirMapping = {
        'Windows': '系统文件',
        'Program Files': '应用程序',
        'Program Files (x86)': '应用程序(x86)',
        'Users': '用户文件',
        'ProgramData': '程序数据'
      };

      for (const [folder, name] of Object.entries(dirMapping)) {
        if (folderSizes[folder]) {
          this.results.categories[name] = {
            size: folderSizes[folder],
            sizeFormatted: this.formatBytes(folderSizes[folder]),
            type: name.includes('系统') ? 'system' : name.includes('应用') ? 'application' : 'user'
          };
          console.log(`[WizTreeScanner] ${name}: ${this.formatBytes(folderSizes[folder])}`);
        }
      }

    } catch (error) {
      console.log('[WizTreeScanner] 解析 CSV 失败:', error.message);
    }
  }

  /**
   * 使用 PowerShell 扫描（备用方案）
   */
  async scanWithPowerShell(drive) {
    console.log('[WizTreeScanner] 使用 PowerShell 扫描...');

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
        console.log(`[WizTreeScanner] ${dir.name}: ${this.formatBytes(size)}`);
      } catch (e) {
        this.results.categories[dir.name] = { size: 0, sizeFormatted: '0 B', type: dir.type };
      }
    }

    await this.scanJunkFiles(drive);
    await this.scanLargeFilesPowerShell(drive);
  }

  /**
   * 扫描垃圾文件
   */
  async scanJunkFiles(drive) {
    console.log('[WizTreeScanner] 扫描垃圾文件...');

    const junkLocations = [
      // Windows 系统垃圾
      { name: 'Windows临时文件', path: `${drive}\\Windows\\Temp`, safe: true },
      { name: 'Windows更新缓存', path: `${drive}\\Windows\\SoftwareDistribution\\Download`, safe: true },
      { name: 'Windows预读取', path: `${drive}\\Windows\\Prefetch`, safe: true },
      { name: 'Windows错误报告', path: `${drive}\\ProgramData\\Microsoft\\Windows\\WER`, safe: true },
      { name: 'Windows日志', path: `${drive}\\Windows\\Logs`, safe: false },
      { name: '崩溃转储', path: `${drive}\\Windows\\Minidump`, safe: false },
      { name: 'Windows Installer缓存', path: `${drive}\\Windows\\Installer`, safe: false },
      
      // 回收站
      { name: '回收站', path: `${drive}\\$Recycle.Bin`, safe: true },
      
      // 用户缓存
      { name: '缩略图缓存', path: `${drive}\\Users\\${this.userName}\\AppData\\Local\\Microsoft\\Windows\\Explorer`, safe: true },
      { name: '用户临时文件', path: `${drive}\\Users\\${this.userName}\\AppData\\Local\\Temp`, safe: true },
      
      // 浏览器缓存
      { name: 'Chrome缓存', path: `${drive}\\Users\\${this.userName}\\AppData\\Local\\Google\\Chrome\\User Data\\Default\\Cache`, safe: true },
      { name: 'Chrome GP缓存', path: `${drive}\\Users\\${this.userName}\\AppData\\Local\\Google\\Chrome\\User Data\\Default\\GPUCache`, safe: true },
      { name: 'Edge缓存', path: `${drive}\\Users\\${this.userName}\\AppData\\Local\\Microsoft\\Edge\\User Data\\Default\\Cache`, safe: true },
      { name: 'Edge GP缓存', path: `${drive}\\Users\\${this.userName}\\AppData\\Local\\Microsoft\\Edge\\User Data\\Default\\GPUCache`, safe: true },
      { name: 'Firefox缓存', path: `${drive}\\Users\\${this.userName}\\AppData\\Local\\Mozilla\\Firefox\\Profiles`, safe: true },
      
      // 开发工具缓存
      { name: 'npm缓存', path: `${drive}\\Users\\${this.userName}\\AppData\\Local\\npm-cache`, safe: true },
      { name: 'yarn缓存', path: `${drive}\\Users\\${this.userName}\\AppData\\Local\\Yarn\\Cache`, safe: true },
      { name: 'pip缓存', path: `${drive}\\Users\\${this.userName}\\AppData\\Local\\pip\\Cache`, safe: true },
      { name: 'VSCode缓存', path: `${drive}\\Users\\${this.userName}\\AppData\\Roaming\\Code\\Cache`, safe: true },
      { name: 'VSCode日志', path: `${drive}\\Users\\${this.userName}\\AppData\\Roaming\\Code\\logs`, safe: true },
      
      // 系统缓存
      { name: 'Windows升级缓存', path: `${drive}\\Windows.old`, safe: true },
      { name: 'Windows备份', path: `${drive}\\Windows\\WinSxS\\Backup`, safe: false },
      
      // 其他应用缓存
      { name: '微信缓存', path: `${drive}\\Users\\${this.userName}\\Documents\\WeChat Files`, safe: true },
      { name: 'QQ缓存', path: `${drive}\\Users\\${this.userName}\\Documents\\Tencent Files`, safe: true },
      { name: '钉钉缓存', path: `${drive}\\Users\\${this.userName}\\AppData\\Local\\DingTalk`, safe: true },
      { name: '企业微信缓存', path: `${drive}\\Users\\${this.userName}\\Documents\\WXWork`, safe: true }
    ];

    for (const junk of junkLocations) {
      try {
        if (await fs.pathExists(junk.path)) {
          const size = await this.getDirectorySize(junk.path);

          if (size > 1 * 1024 * 1024) {
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

            console.log(`[WizTreeScanner] ${junk.name}: ${this.formatBytes(size)}`);
          }
        }
      } catch (e) {}
    }

    // 扫描用户目录
    await this.scanUserDirectories(drive);
  }

  /**
   * 扫描用户目录
   */
  async scanUserDirectories(drive) {
    console.log('[WizTreeScanner] 扫描用户目录...');

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
              const size = await this.getDirectorySize(dirPath);

              if (size > 100 * 1024 * 1024) { // 大于100MB
                const itemName = `${entry.name}的${userDir.desc}`;
                this.results.categories[itemName] = {
                  size,
                  sizeFormatted: this.formatBytes(size),
                  type: 'user',
                  safeToClean: true
                };

                this.results.cleanableItems.push({
                  id: `user_${entry.name}_${userDir.name}`.toLowerCase(),
                  name: itemName,
                  description: `${entry.name}用户的${userDir.desc}`,
                  impact: '删除前请确认不需要这些文件',
                  riskLevel: 'caution',
                  size,
                  sizeFormatted: this.formatBytes(size),
                  paths: [dirPath],
                  safeToClean: true
                });

                console.log(`[WizTreeScanner] ${itemName}: ${this.formatBytes(size)}`);
              }
            }
          } catch (e) {}
        }
      }
    } catch (e) {}
  }

  /**
   * 使用 WizTree 扫描大文件
   */
  async scanLargeFilesWithWizTree(drive) {
    console.log('[WizTreeScanner] 扫描大文件...');

    const csvPath = path.join(os.tmpdir(), `wiztree_files_${Date.now()}.csv`);

    try {
      const cmd = `"${this.wizTreePath}" "${drive}\\Users" /export="${csvPath}" /exportfiles=1 /minsize=52428800 /admin=1`;
      execSync(cmd, { encoding: 'utf8', timeout: 30000 });

      if (await fs.pathExists(csvPath)) {
        const content = await fs.readFile(csvPath, 'utf8');
        const lines = content.split('\n').slice(1);

        for (const line of lines.slice(0, 30)) {
          if (!line.trim()) continue;

          const match = line.match(/"([^"]+)","(\d+)"/);
          if (match) {
            const filePath = match[1];
            const size = parseInt(match[2]);

            // 排除 AppData
            if (filePath.includes('AppData')) continue;

            const fileName = path.basename(filePath);

            this.results.largeFiles.push({
              path: filePath,
              name: fileName,
              size,
              sizeFormatted: this.formatBytes(size)
            });

            this.results.cleanableItems.push({
              id: `large_${Buffer.from(filePath).toString('base64').substring(0, 20)}`,
              name: fileName,
              description: `大文件: ${filePath}`,
              impact: '删除前请确认不需要此文件',
              riskLevel: 'caution',
              size,
              sizeFormatted: this.formatBytes(size),
              paths: [filePath],
              safeToClean: true
            });

            console.log(`[WizTreeScanner] 大文件: ${fileName} (${this.formatBytes(size)})`);
          }
        }

        await fs.remove(csvPath);
      }
    } catch (e) {
      console.log('[WizTreeScanner] 大文件扫描失败:', e.message);
      await this.scanLargeFilesPowerShell(drive);
    }
  }

  /**
   * 使用 PowerShell 扫描大文件
   */
  async scanLargeFilesPowerShell(drive) {
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
        }
      }
    } catch (e) {}
  }

  /**
   * 获取目录大小
   */
  async getDirectorySize(dirPath) {
    try {
      if (!await fs.pathExists(dirPath)) return 0;

      const cmd = `powershell -NoProfile -Command "(Get-ChildItem -Path '${dirPath}' -Recurse -Force -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum"`;
      const result = execSync(cmd, { encoding: 'utf8', timeout: 60000 });
      return parseInt(result.trim()) || 0;
    } catch (e) {
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

module.exports = WizTreeScanner;
