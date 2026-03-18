const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getConfig: () => ipcRenderer.invoke('get-config'),
  setConfig: (config) => ipcRenderer.invoke('set-config', config),
  
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  selectFiles: () => ipcRenderer.invoke('select-files'),
  
  organizeFiles: (options) => ipcRenderer.invoke('organize-files', options),
  scanDuplicates: (folderPath) => ipcRenderer.invoke('scan-duplicates', folderPath),
  getTimeline: (options) => ipcRenderer.invoke('get-timeline', options),
  browseFolder: (folderPath) => ipcRenderer.invoke('browse-folder', folderPath),
  
  getServerStatus: () => ipcRenderer.invoke('get-server-status'),
  startServer: () => ipcRenderer.invoke('start-server'),
  stopServer: () => ipcRenderer.invoke('stop-server'),
  getConnectedDevices: () => ipcRenderer.invoke('get-connected-devices'),
  getTransferHistory: () => ipcRenderer.invoke('get-transfer-history'),
  getLocalIP: () => ipcRenderer.invoke('get-local-ip'),
  getQRCode: () => ipcRenderer.invoke('get-qrcode'),
  getAllIPs: () => ipcRenderer.invoke('get-all-ips'),
  
  // Disk Optimizer APIs
  analyzeDisk: () => ipcRenderer.invoke('analyze-disk'),
  cleanDiskItems: (itemIds) => ipcRenderer.invoke('clean-disk-items', itemIds),
  getOptimizationSuggestions: () => ipcRenderer.invoke('get-optimization-suggestions'),
  getCleanupHistory: () => ipcRenderer.invoke('get-cleanup-history'),
  getCleanupStats: () => ipcRenderer.invoke('get-cleanup-stats'),
  getDeepAnalysis: () => ipcRenderer.invoke('get-deep-analysis'),
  getAdvancedAnalysis: () => ipcRenderer.invoke('get-advanced-analysis'),
  analyzeDirectory: (directoryType) => ipcRenderer.invoke('analyze-directory', directoryType),
  scanDirectoryLargeFiles: (directory, minSize) => ipcRenderer.invoke('scan-directory-large-files', directory, minSize),
  
  // Codebuff 智能助手 APIs
  analyzeFile: (filePath) => ipcRenderer.invoke('codebuff:analyzeFile', filePath),
  analyzeCode: (code, language) => ipcRenderer.invoke('codebuff:analyzeCode', code, language),
  getAnalysisHistory: () => ipcRenderer.invoke('codebuff:getAnalysisHistory'),
  clearAnalysisHistory: () => ipcRenderer.invoke('codebuff:clearHistory'),
  
  onNavigate: (callback) => ipcRenderer.on('navigate', (event, page) => callback(page)),
  onServerEvent: (callback) => ipcRenderer.on('server-event', (event, data) => callback(data)),
  onTransferProgress: (callback) => ipcRenderer.on('transfer-progress', (event, data) => callback(data)),
  onDeepAnalysisProgress: (callback) => ipcRenderer.on('deep-analysis-progress', (event, data) => callback(data)),
  onCodebuffActivated: (callback) => ipcRenderer.on('codebuff:activated', (event) => callback()),
  onCodebuffAnalysisComplete: (callback) => ipcRenderer.on('codebuff:analysisComplete', (event, data) => callback(data))
});
