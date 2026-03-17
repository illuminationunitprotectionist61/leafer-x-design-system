/**
 * Express 服务器集成示例
 * 
 * 演示如何在 Web 服务器中使用 leafer-design-system
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const { createGenerator, createRenderer } = require('../index');

const app = express();
app.use(express.json());

// 静态文件服务
app.use('/output', express.static(path.join(__dirname, '../output')));

// 创建生成器和渲染器
const generator = createGenerator({
  name: 'Web App Design System',
  primaryColor: '#3b82f6',
  secondaryColor: '#8b5cf6'
});

const renderer = createRenderer({
  outputDir: path.join(__dirname, '../output/server')
});

// API: 生成设计系统
app.post('/api/design-system/generate', (req, res) => {
  try {
    const { name, primaryColor, secondaryColor, mode } = req.body;
    
    const customGenerator = createGenerator({
      name: name || 'Custom Design System',
      primaryColor: primaryColor || '#3b82f6',
      secondaryColor: secondaryColor || '#8b5cf6',
      mode: mode || 'light'
    });

    const designSystem = customGenerator.generate();
    
    res.json({
      success: true,
      data: designSystem
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// API: 获取模板列表
app.get('/api/templates', (req, res) => {
  try {
    const designSystem = generator.generate();
    const templates = [];
    
    // 收集所有模板
    Object.entries(designSystem.templates).forEach(([deviceType, deviceTemplates]) => {
      Object.entries(deviceTemplates).forEach(([templateName, template]) => {
        templates.push({
          id: `${deviceType}-${templateName}`,
          name: templateName,
          deviceType,
          width: template.width,
          height: template.height
        });
      });
    });
    
    res.json({
      success: true,
      data: templates
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// API: 渲染指定模板
app.post('/api/templates/:id/render', async (req, res) => {
  try {
    const { id } = req.params;
    const { format = 'png', quality = 0.95 } = req.body;
    
    // 解析模板 ID
    const [deviceType, templateName] = id.split('-');
    
    // 获取设计系统
    const designSystem = generator.generate();
    
    // 查找模板
    const template = designSystem.templates[deviceType]?.[templateName];
    if (!template) {
      return res.status(404).json({
        success: false,
        error: `Template not found: ${id}`
      });
    }
    
    // 渲染模板
    const result = await renderer.render({
      width: template.width,
      height: template.height,
      elements: template.elements,
      options: {
        format,
        quality,
        backgroundColor: template.backgroundColor || '#ffffff'
      }
    });
    
    res.json({
      success: true,
      data: {
        url: result.url,
        base64: result.base64,
        width: result.width,
        height: result.height,
        renderTime: result.renderTime
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// API: 自定义渲染
app.post('/api/render', async (req, res) => {
  try {
    const { width, height, elements, options = {} } = req.body;
    
    if (!width || !height || !elements) {
      return res.status(400).json({
        success: false,
        error: 'width, height, and elements are required'
      });
    }
    
    const result = await renderer.render({
      width,
      height,
      elements,
      options: {
        format: options.format || 'png',
        quality: options.quality || 0.95,
        pixelRatio: options.pixelRatio || 2,
        backgroundColor: options.backgroundColor || '#ffffff'
      }
    });
    
    res.json({
      success: true,
      data: {
        url: result.url,
        base64: result.base64,
        width: result.width,
        height: result.height,
        renderTime: result.renderTime
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 首页
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Leafer Design System - Demo</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 1200px; margin: 0 auto; padding: 40px; }
        h1 { color: #333; }
        .endpoint { background: #f5f5f5; padding: 15px; margin: 10px 0; border-radius: 8px; }
        .method { display: inline-block; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 12px; margin-right: 10px; }
        .get { background: #61affe; color: white; }
        .post { background: #49cc90; color: white; }
        code { background: #e8e8e8; padding: 2px 6px; border-radius: 3px; font-family: monospace; }
      </style>
    </head>
    <body>
      <h1>🎨 Leafer Design System API</h1>
      <p>欢迎使用 Leafer Design System 演示服务器</p>
      
      <h2>API 端点</h2>
      
      <div class="endpoint">
        <span class="method post">POST</span>
        <code>/api/design-system/generate</code>
        <p>生成设计系统配置</p>
      </div>
      
      <div class="endpoint">
        <span class="method get">GET</span>
        <code>/api/templates</code>
        <p>获取所有可用模板</p>
      </div>
      
      <div class="endpoint">
        <span class="method post">POST</span>
        <code>/api/templates/:id/render</code>
        <p>渲染指定模板</p>
      </div>
      
      <div class="endpoint">
        <span class="method post">POST</span>
        <code>/api/render</code>
        <p>自定义渲染</p>
      </div>
      
      <h2>快速测试</h2>
      <button onclick="testRender()">测试渲染</button>
      <div id="result"></div>
      
      <script>
        async function testRender() {
          const result = document.getElementById('result');
          result.innerHTML = '<p>渲染中...</p>';
          
          try {
            const response = await fetch('/api/templates/mobile-login/render', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ format: 'png' })
            });
            
            const data = await response.json();
            
            if (data.success) {
              result.innerHTML = \`
                <p>✅ 渲染成功!</p>
                <p>渲染时间: \${data.data.renderTime}ms</p>
                <img src="\${data.data.url}" style="max-width: 100%; border: 1px solid #ddd; border-radius: 8px;" />
              \`;
            } else {
              result.innerHTML = '<p>❌ 错误: ' + data.error + '</p>';
            }
          } catch (error) {
            result.innerHTML = '<p>❌ 错误: ' + error.message + '</p>';
          }
        }
      </script>
    </body>
    </html>
  `);
});

const PORT = process.env.PORT || 3002;

app.listen(PORT, () => {
  console.log(`
🚀 Express 服务器已启动

📍 访问地址:
   首页: http://localhost:${PORT}/
   API: http://localhost:${PORT}/api/templates

📚 API 文档:
   GET  /api/templates              - 获取模板列表
   POST /api/templates/:id/render   - 渲染模板
   POST /api/render                 - 自定义渲染
   POST /api/design-system/generate - 生成设计系统
  `);
});
