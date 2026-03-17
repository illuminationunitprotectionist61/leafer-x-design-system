/**
 * 本地 MCP 服务启动脚本 - 使用修复后的渲染器
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// 使用本地输出目录
const outputDir = path.join(__dirname, 'output');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
  console.log('[Local MCP] Created output directory:', outputDir);
}

// 导入修复后的 LeaferRenderer
const LeaferRenderer = require('./leafer-renderer-fixed');

class LocalMCPServer {
  constructor() {
    this.port = process.env.MCP_PORT || 3001;
    this.leaferRenderer = new LeaferRenderer({
      pixelRatio: 2,
      backgroundColor: '#ffffff',
      maxCacheSize: 100,
      outputDir: outputDir
    });
  }

  async handleRequest(req, res) {
    // 设置 CORS 头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Content-Type', 'application/json');

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    const url = req.url;
    const method = req.method;

    try {
      // 健康检查
      if (url === '/health' && method === 'GET') {
        res.writeHead(200);
        res.end(JSON.stringify({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          version: '1.0.0',
          outputDir: outputDir
        }));
        return;
      }

      // UI 渲染端点
      if (url === '/api/v1/ui/render' && method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
          try {
            const { width, height, elements, options = {} } = JSON.parse(body);
            
            if (!width || !height || !elements) {
              res.writeHead(400);
              res.end(JSON.stringify({ error: 'Width, height, and elements are required' }));
              return;
            }

            console.log('[Local MCP] Rendering request:', { width, height, elementCount: elements.length });

            const result = await this.leaferRenderer.render({
              width,
              height,
              elements,
              options: {
                format: options.format || 'png',
                quality: options.quality || 0.92,
                pixelRatio: options.pixelRatio || 2,
                backgroundColor: options.backgroundColor || '#ffffff'
              }
            });

            res.writeHead(200);
            res.end(JSON.stringify({
              success: true,
              requestId: uuidv4(),
              data: {
                url: result.url,
                base64: result.base64,
                format: result.format,
                width: result.width,
                height: result.height,
                pixelRatio: result.pixelRatio,
                cached: result.cached || false
              },
              meta: {
                generatedAt: new Date().toISOString(),
                dimensions: { width, height }
              }
            }));
          } catch (error) {
            console.error('[Local MCP] UI render error:', error);
            res.writeHead(500);
            res.end(JSON.stringify({ error: error.message }));
          }
        });
        return;
      }

      // 获取生成的图片
      if (url.startsWith('/output/') && method === 'GET') {
        const filename = path.basename(url);
        const filePath = path.join(outputDir, filename);
        if (fs.existsSync(filePath)) {
          const ext = path.extname(filePath).toLowerCase();
          const contentType = ext === '.png' ? 'image/png' : 
                             ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' :
                             ext === '.webp' ? 'image/webp' : 'application/octet-stream';
          res.setHeader('Content-Type', contentType);
          res.writeHead(200);
          fs.createReadStream(filePath).pipe(res);
        } else {
          res.writeHead(404);
          res.end(JSON.stringify({ error: 'File not found' }));
        }
        return;
      }

      // 404
      res.writeHead(404);
      res.end(JSON.stringify({ error: 'Not found' }));
    } catch (error) {
      console.error('[Local MCP] Server error:', error);
      res.writeHead(500);
      res.end(JSON.stringify({ error: 'Internal server error', message: error.message }));
    }
  }

  start() {
    const server = http.createServer((req, res) => this.handleRequest(req, res));
    server.listen(this.port, () => {
      console.log(`🚀 Local MCP Server running on port ${this.port}`);
      console.log(`📁 Output directory: ${outputDir}`);
      console.log(`🎯 Health check: http://localhost:${this.port}/health`);
      console.log(`✨ LeaferJS UI rendering enabled (FIXED VERSION)`);
    });
  }
}

// 启动服务器
const server = new LocalMCPServer();
server.start();
