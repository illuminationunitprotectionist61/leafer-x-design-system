/**
 * 本地电脑助手 - 主进程
 * 修复版：优化启动顺序和错误处理
 */

const { app, BrowserWindow, ipcMain, dialog, Menu, Tray, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs-extra');

// 服务类
const ServerManager = require('./server/ServerManager');
const FileOrganizer = require('./services/FileOrganizer');
const ConfigManager = require('./services/ConfigManager');
const DatabaseManager = require('./services/DatabaseManager');
const DiskOptimizer = require('./services/DiskOptimizer');

// 全局变量
let mainWindow = null;
let tray = null;
let serverManager = null;
let configManager = null;
let databaseManager = null;
let fileOrganizer = null;
let diskOptimizer = null;

const isDev = process.argv.includes('--dev');

/**
 * 创建主窗口
 */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '../../assets/icon.png'),
    title: '本地电脑助手',
    show: false // 先不显示，等加载完成后再显示
  });

  // 设置中文菜单
  setupMenu();

  // 加载页面
  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

  // 页面加载完成后显示窗口
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });

  // 处理窗口关闭
  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

/**
 * 设置应用菜单
 */
function setupMenu() {
  const template = [
    {
      label: '文件',
      submenu: [
        {
          label: '退出',
          accelerator: 'Ctrl+Q',
          click: () => quitApp()
        }
      ]
    },
    {
      label: '编辑',
      submenu: [
        { label: '撤销', role: 'undo' },
        { label: '重做', role: 'redo' },
        { type: 'separator' },
        { label: '剪切', role: 'cut' },
        { label: '复制', role: 'copy' },
        { label: '粘贴', role: 'paste' }
      ]
    },
    {
      label: '视图',
      submenu: [
        { label: '刷新', role: 'reload' },
        { label: '强制刷新', role: 'forceReload' },
        { type: 'separator' },
        { label: '开发者工具', role: 'toggleDevTools' },
        { type: 'separator' },
        { label: '实际大小', role: 'resetZoom' },
        { label: '放大', role: 'zoomIn' },
        { label: '缩小', role: 'zoomOut' },
        { type: 'separator' },
        { label: '全屏', role: 'togglefullscreen' }
      ]
    },
    {
      label: '窗口',
      submenu: [
        { label: '最小化', role: 'minimize' },
        { label: '关闭', role: 'close' }
      ]
    },
    {
      label: '帮助',
      submenu: [
        {
          label: '关于',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: '关于',
              message: '本地电脑助手',
              detail: '版本: 1.0.0\n一款用于文件整理和局域网传输的桌面应用'
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

/**
 * 创建系统托盘
 */
function createTray() {
  try {
    const iconPath = path.join(__dirname, '../../assets/icon.png');
    
    // 检查图标文件是否存在
    if (!fs.existsSync(iconPath)) {
      console.warn('托盘图标不存在:', iconPath);
      return;
    }

    const icon = nativeImage.createFromPath(iconPath);
    tray = new Tray(icon.resize({ width: 16, height: 16 }));

    const contextMenu = Menu.buildFromTemplate([
      { label: '显示主窗口', click: () => mainWindow?.show() },
      { label: '局域网传输', click: () => openTransferWindow() },
      { type: 'separator' },
      { label: '退出', click: () => quitApp() }
    ]);

    tray.setToolTip('本地电脑助手');
    tray.setContextMenu(contextMenu);

    tray.on('double-click', () => {
      mainWindow?.show();
    });
  } catch (error) {
    console.error('创建托盘失败:', error);
  }
}

/**
 * 打开传输窗口
 */
function openTransferWindow() {
  if (mainWindow) {
    mainWindow.show();
    mainWindow.webContents.send('navigate', 'transfer');
  }
}

/**
 * 退出应用
 */
async function quitApp() {
  app.isQuitting = true;
  
  try {
    // 停止服务
    if (serverManager) {
      await serverManager.stop().catch(err => console.error('停止服务失败:', err));
    }
    
    // 关闭数据库
    if (databaseManager) {
      databaseManager.close();
    }
    
    // 销毁托盘
    if (tray) {
      tray.destroy();
      tray = null;
    }
  } catch (error) {
    console.error('退出时出错:', error);
  }
  
  app.quit();
}

/**
 * 初始化服务
 */
async function initializeServices() {
  const userDataPath = app.getPath('userData');
  
  try {
    // 1. 初始化配置管理器
    configManager = new ConfigManager(userDataPath);
    await configManager.initialize();
    console.log('✓ 配置管理器已初始化');

    // 2. 初始化数据库
    databaseManager = new DatabaseManager(userDataPath);
    await databaseManager.initialize();
    console.log('✓ 数据库已初始化');

    // 3. 初始化文件整理器
    fileOrganizer = new FileOrganizer(databaseManager, configManager);
    console.log('✓ 文件整理器已初始化');

    // 4. 初始化服务器管理器
    serverManager = new ServerManager(configManager, databaseManager);
    await serverManager.initialize();
    console.log('✓ 服务器管理器已初始化');

    // 5. 初始化磁盘优化器
    diskOptimizer = new DiskOptimizer(databaseManager, configManager);
    
    // 设置深度分析进度回调
    diskOptimizer.onDeepAnalysisProgress = (progress) => {
      // 广播进度到所有渲染进程
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('deep-analysis-progress', progress);
      }
    };
    
    console.log('✓ 磁盘优化器已初始化');

    return true;
  } catch (error) {
    console.error('服务初始化失败:', error);
    throw error;
  }
}

/**
 * 设置 IPC 通信
 */
function setupIPC() {
  // 配置相关
  ipcMain.handle('get-config', () => {
    return configManager?.getConfig() || {};
  });

  ipcMain.handle('set-config', (event, config) => {
    return configManager?.setConfig(config);
  });

  // 文件选择
  ipcMain.handle('select-folder', async () => {
    if (!mainWindow) return null;
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory']
    });
    return result.filePaths[0] || null;
  });

  ipcMain.handle('select-files', async () => {
    if (!mainWindow) return [];
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile', 'multiSelections']
    });
    return result.filePaths;
  });

  // 文件整理
  ipcMain.handle('organize-files', async (event, options) => {
    if (!fileOrganizer) throw new Error('文件整理器未初始化');
    return await fileOrganizer.organize(options);
  });

  ipcMain.handle('scan-duplicates', async (event, folderPath) => {
    if (!fileOrganizer) throw new Error('文件整理器未初始化');
    return await fileOrganizer.scanDuplicates(folderPath);
  });

  ipcMain.handle('get-timeline', async (event, options) => {
    if (!fileOrganizer) throw new Error('文件整理器未初始化');
    return await fileOrganizer.getTimeline(options);
  });

  ipcMain.handle('browse-folder', async (event, folderPath) => {
    if (!fileOrganizer) throw new Error('文件整理器未初始化');
    return await fileOrganizer.browseFolder(folderPath);
  });

  // 服务器相关
  ipcMain.handle('get-server-status', () => {
    return serverManager?.getStatus() || { running: false };
  });

  ipcMain.handle('start-server', async () => {
    if (!serverManager) throw new Error('服务器管理器未初始化');
    return await serverManager.start();
  });

  ipcMain.handle('stop-server', async () => {
    if (!serverManager) throw new Error('服务器管理器未初始化');
    return await serverManager.stop();
  });

  ipcMain.handle('get-connected-devices', () => {
    return serverManager?.getConnectedDevices() || [];
  });

  ipcMain.handle('get-transfer-history', () => {
    return databaseManager?.getTransferHistory() || [];
  });

  ipcMain.handle('get-local-ip', () => {
    return serverManager?.getLocalIP() || '127.0.0.1';
  });

  ipcMain.handle('get-qrcode', () => {
    return serverManager?.getQRCode() || null;
  });

  ipcMain.handle('get-all-ips', () => {
    return serverManager?.getAllIPs() || ['127.0.0.1'];
  });

  // 磁盘优化
  ipcMain.handle('analyze-disk', async () => {
    if (!diskOptimizer) throw new Error('磁盘优化器未初始化');
    return await diskOptimizer.analyzeDisk();
  });

  ipcMain.handle('clean-disk-items', async (event, itemIds) => {
    if (!diskOptimizer) throw new Error('磁盘优化器未初始化');
    return await diskOptimizer.cleanItems(itemIds);
  });

  ipcMain.handle('get-optimization-suggestions', async () => {
    if (!diskOptimizer) throw new Error('磁盘优化器未初始化');
    return await diskOptimizer.getOptimizationSuggestions();
  });

  ipcMain.handle('get-deep-analysis', async () => {
    if (!diskOptimizer) throw new Error('磁盘优化器未初始化');
    return diskOptimizer.getDeepAnalysisResults();
  });

  ipcMain.handle('get-advanced-analysis', async () => {
    if (!diskOptimizer) throw new Error('磁盘优化器未初始化');
    return diskOptimizer.getAdvancedAnalysisResults();
  });

  ipcMain.handle('get-cleanup-history', async () => {
    if (!databaseManager) throw new Error('数据库未初始化');
    return databaseManager.getCleanupHistory(50);
  });

  ipcMain.handle('get-cleanup-stats', async () => {
    if (!databaseManager) throw new Error('数据库未初始化');
    return databaseManager.getCleanupStats();
  });

  ipcMain.handle('analyze-directory', async (event, directoryType) => {
    if (!diskOptimizer) throw new Error('磁盘优化器未初始化');
    return diskOptimizer.performDirectoryAnalysis(directoryType);
  });

  ipcMain.handle('scan-directory-large-files', async (event, directory, minSize) => {
    if (!diskOptimizer) throw new Error('磁盘优化器未初始化');
    return diskOptimizer.scanDirectoryLargeFiles(directory, minSize);
  });

  // 导航
  ipcMain.on('navigate', (event, page) => {
    mainWindow?.webContents.send('navigate', page);
  });
}

/**
 * 应用就绪
 */
app.whenReady().then(async () => {
  try {
    console.log('正在初始化本地电脑助手...');
    
    // 1. 先初始化服务
    await initializeServices();
    
    // 2. 创建窗口
    createWindow();
    
    // 3. 创建托盘
    createTray();
    
    // 4. 设置 IPC
    setupIPC();

    // 5. 自动启动服务器（如果配置）
    if (configManager.get('autoStartServer')) {
      try {
        await serverManager.start();
        console.log('✓ 服务器已自动启动');
      } catch (error) {
        console.error('自动启动服务器失败:', error);
      }
    }

    console.log('✓ 本地电脑助手启动完成');
  } catch (error) {
    console.error('应用启动失败:', error);
    dialog.showErrorBox('启动错误', `应用初始化失败: ${error.message}`);
    app.quit();
  }

  // macOS: 点击 dock 图标时重新创建窗口
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    } else {
      mainWindow?.show();
    }
  });
});

// 所有窗口关闭时退出（Windows/Linux）
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    quitApp();
  }
});

// 准备退出
app.on('before-quit', () => {
  app.isQuitting = true;
});

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
  console.error('未捕获的异常:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的 Promise 拒绝:', reason);
});
