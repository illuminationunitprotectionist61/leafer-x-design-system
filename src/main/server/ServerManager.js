const express = require('express');
const http = require('http');
const { Server: SocketIOServer } = require('socket.io');
const path = require('path');
const fs = require('fs-extra');
const crypto = require('crypto');
const QRCode = require('qrcode');
const os = require('os');
const cors = require('cors');
const multer = require('multer');

class ServerManager {
  constructor(configManager, databaseManager) {
    this.config = configManager;
    this.db = databaseManager;
    this.app = null;
    this.httpServer = null;
    this.io = null;
    this.isRunning = false;
    this.port = null;
    this.authCode = null;
    this.connectedDevices = new Map();
    this.transferSessions = new Map();
  }

  async initialize() {
    this.app = express();
    this.port = this.config.get('serverPort') || 3888;
    
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.static(path.join(__dirname, '../../renderer/mobile')));

    this.setupRoutes();
    this.setupSocket();
  }

  setupRoutes() {
    this.app.get('/api/status', (req, res) => {
      res.json({
        status: 'online',
        version: '1.0.0',
        deviceName: os.hostname()
      });
    });

    this.app.post('/api/auth', (req, res) => {
      const { code, deviceName, userAgent } = req.body;
      
      if (code === this.authCode) {
        const sessionId = crypto.randomBytes(16).toString('hex');
        const clientIp = req.ip || req.connection.remoteAddress;
        
        this.connectedDevices.set(sessionId, {
          name: deviceName || 'Unknown Device',
          ip: clientIp,
          userAgent,
          connectedAt: new Date(),
          sessionId
        });

        this.db.addDevice({
          name: deviceName || 'Unknown Device',
          ip: clientIp,
          user_agent: userAgent
        });

        res.json({
          success: true,
          sessionId,
          message: '认证成功'
        });
      } else {
        res.status(401).json({
          success: false,
          message: '验证码错误'
        });
      }
    });

    this.app.get('/api/browse', this.authMiddleware.bind(this), async (req, res) => {
      try {
        const folderPath = req.query.path || this.config.get('managedFolders')[0] || os.homedir();
        const items = await fs.readdir(folderPath, { withFileTypes: true });
        
        const result = items.map(item => ({
          name: item.name,
          path: path.join(folderPath, item.name),
          isDirectory: item.isDirectory(),
          isFile: item.isFile()
        }));

        res.json({
          currentPath: folderPath,
          items: result
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.get('/api/download', this.authMiddleware.bind(this), async (req, res) => {
      try {
        const filePath = req.query.file;
        
        if (!filePath || !await fs.pathExists(filePath)) {
          return res.status(404).json({ error: '文件不存在' });
        }

        const stat = await fs.stat(filePath);
        const fileName = path.basename(filePath);

        this.db.addTransfer({
          file_path: filePath,
          file_name: fileName,
          file_size: stat.size,
          direction: 'download',
          device_name: this.connectedDevices.get(req.sessionId)?.name,
          device_ip: req.ip,
          status: 'started'
        });

        res.download(filePath, fileName, (err) => {
          if (err) {
            console.error('下载失败:', err);
          }
          
          this.db.addTransfer({
            file_path: filePath,
            file_name: fileName,
            file_size: stat.size,
            direction: 'download',
            device_name: this.connectedDevices.get(req.sessionId)?.name,
            device_ip: req.ip,
            status: 'completed',
            completed_at: new Date().toISOString()
          });
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    const upload = multer({
      dest: path.join(os.tmpdir(), 'assistant-uploads'),
      limits: { fileSize: 1024 * 1024 * 1024 }
    });

    this.app.post('/api/upload', this.authMiddleware.bind(this), upload.single('file'), async (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ error: '没有上传文件' });
        }

        const targetPath = req.body.targetPath || this.config.get('managedFolders')[0] || os.homedir();
        const finalPath = path.join(targetPath, req.file.originalname);
        
        await fs.move(req.file.path, finalPath, { overwrite: true });

        this.db.addTransfer({
          file_path: finalPath,
          file_name: req.file.originalname,
          file_size: req.file.size,
          direction: 'upload',
          device_name: this.connectedDevices.get(req.sessionId)?.name,
          device_ip: req.ip,
          status: 'completed',
          completed_at: new Date().toISOString()
        });

        res.json({
          success: true,
          path: finalPath,
          size: req.file.size
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.get('/api/files', this.authMiddleware.bind(this), async (req, res) => {
      try {
        const keyword = req.query.keyword;
        const files = this.db.searchFiles(keyword);
        res.json(files);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.get('/api/history', this.authMiddleware.bind(this), async (req, res) => {
      try {
        const history = this.db.getTransferHistory(50);
        res.json(history);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
  }

  authMiddleware(req, res, next) {
    const sessionId = req.headers['x-session-id'] || req.query.sessionId;
    
    if (!sessionId || !this.connectedDevices.has(sessionId)) {
      return res.status(401).json({ error: '未授权访问' });
    }
    
    req.sessionId = sessionId;
    next();
  }

  setupSocket() {
    this.io = new SocketIOServer(this.httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      }
    });

    this.io.use((socket, next) => {
      const sessionId = socket.handshake.auth.sessionId;
      
      if (!sessionId || !this.connectedDevices.has(sessionId)) {
        return next(new Error('未授权'));
      }
      
      socket.sessionId = sessionId;
      next();
    });

    this.io.on('connection', (socket) => {
      console.log('设备已连接:', socket.sessionId);

      socket.on('disconnect', () => {
        console.log('设备已断开:', socket.sessionId);
      });

      socket.on('file-transfer-start', (data) => {
        this.handleTransferStart(socket, data);
      });

      socket.on('file-chunk', (data) => {
        this.handleFileChunk(socket, data);
      });

      socket.on('file-transfer-complete', (data) => {
        this.handleTransferComplete(socket, data);
      });
    });
  }

  handleTransferStart(socket, data) {
    const { fileName, fileSize, targetPath } = data;
    const transferId = crypto.randomBytes(8).toString('hex');
    
    const tempPath = path.join(os.tmpdir(), `transfer-${transferId}`);
    
    this.transferSessions.set(transferId, {
      fileName,
      fileSize,
      targetPath,
      tempPath,
      receivedSize: 0,
      startTime: Date.now()
    });

    socket.emit('transfer-ready', { transferId });
  }

  async handleFileChunk(socket, data) {
    const { transferId, chunk, offset } = data;
    const session = this.transferSessions.get(transferId);
    
    if (!session) return;

    try {
      await fs.appendFile(session.tempPath, Buffer.from(chunk, 'base64'));
      session.receivedSize += chunk.length;

      const progress = (session.receivedSize / session.fileSize) * 100;
      socket.emit('transfer-progress', {
        transferId,
        progress,
        receivedSize: session.receivedSize
      });
    } catch (error) {
      socket.emit('transfer-error', {
        transferId,
        error: error.message
      });
    }
  }

  async handleTransferComplete(socket, data) {
    const { transferId } = data;
    const session = this.transferSessions.get(transferId);
    
    if (!session) return;

    try {
      const finalPath = path.join(session.targetPath, session.fileName);
      await fs.move(session.tempPath, finalPath, { overwrite: true });

      this.db.addTransfer({
        file_path: finalPath,
        file_name: session.fileName,
        file_size: session.fileSize,
        direction: 'upload',
        device_name: this.connectedDevices.get(socket.sessionId)?.name,
        device_ip: this.connectedDevices.get(socket.sessionId)?.ip,
        status: 'completed',
        completed_at: new Date().toISOString()
      });

      socket.emit('transfer-complete', {
        transferId,
        path: finalPath
      });

      this.transferSessions.delete(transferId);
    } catch (error) {
      socket.emit('transfer-error', {
        transferId,
        error: error.message
      });
    }
  }

  async start() {
    if (this.isRunning) {
      return { success: true, port: this.port };
    }

    this.authCode = this.generateAuthCode();
    this.httpServer = http.createServer(this.app);
    
    this.io.attach(this.httpServer);

    return new Promise((resolve, reject) => {
      // 明确绑定到 0.0.0.0 以允许所有网络接口访问
      this.httpServer.listen(this.port, '0.0.0.0', (err) => {
        if (err) {
          console.error('服务器启动失败:', err);
          reject(err);
        } else {
          this.isRunning = true;
          console.log(`服务器已启动，监听端口: ${this.port}`);
          console.log(`本地访问: http://localhost:${this.port}`);
          console.log(`局域网访问: http://${this.getLocalIP()}:${this.port}`);
          resolve({
            success: true,
            port: this.port,
            authCode: this.authCode
          });
        }
      });
    });
  }

  async stop() {
    if (!this.isRunning) return;

    return new Promise((resolve) => {
      this.httpServer.close(() => {
        this.isRunning = false;
        this.connectedDevices.clear();
        this.transferSessions.clear();
        resolve();
      });
    });
  }

  generateAuthCode() {
    return String(Math.floor(100000 + Math.random() * 900000));
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      port: this.port,
      authCode: this.authCode,
      connectedDevices: this.connectedDevices.size
    };
  }

  getConnectedDevices() {
    return Array.from(this.connectedDevices.values());
  }

  getLocalIP() {
    const interfaces = os.networkInterfaces();
    const addresses = [];
    
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        if (iface.family === 'IPv4' && !iface.internal) {
          addresses.push({
            interface: name,
            address: iface.address
          });
        }
      }
    }
    
    // 优先使用以太网或WiFi接口，排除虚拟网卡
    const priorityNames = ['以太网', 'Ethernet', 'WiFi', 'WLAN', '无线', '本地连接'];
    for (const priorityName of priorityNames) {
      const match = addresses.find(a => a.interface.includes(priorityName));
      if (match) return match.address;
    }
    
    // 排除虚拟网卡（Hyper-V、VMware、VirtualBox等）
    const virtualNames = ['Hyper-V', 'VMware', 'VirtualBox', 'vEthernet', 'Virtual', 'Docker'];
    const physicalAddresses = addresses.filter(a => 
      !virtualNames.some(v => a.interface.includes(v))
    );
    
    if (physicalAddresses.length > 0) {
      return physicalAddresses[0].address;
    }
    
    // 返回第一个非内网IP
    return addresses.length > 0 ? addresses[0].address : '127.0.0.1';
  }

  getAllIPs() {
    const interfaces = os.networkInterfaces();
    const addresses = [];
    
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        if (iface.family === 'IPv4' && !iface.internal) {
          addresses.push({
            interface: name,
            address: iface.address
          });
        }
      }
    }
    
    return addresses;
  }

  async getQRCode() {
    const ip = this.getLocalIP();
    const url = `http://${ip}:${this.port}`;
    
    try {
      const qrDataUrl = await QRCode.toDataURL(url, {
        width: 300,
        margin: 2
      });
      
      return {
        url,
        qrCode: qrDataUrl,
        authCode: this.authCode
      };
    } catch (error) {
      console.error('生成二维码失败:', error);
      return {
        url,
        qrCode: null,
        authCode: this.authCode
      };
    }
  }
}

module.exports = ServerManager;
