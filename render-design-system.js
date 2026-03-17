/**
 * 设计系统渲染器
 * 使用 MCP 服务渲染生成的设计系统模板
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

// 读取模板文件
function loadTemplate(templateName) {
  const templatePath = path.join(__dirname, 'my-design-system', 'templates', `${templateName}.json`);
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template not found: ${templatePath}`);
  }
  return JSON.parse(fs.readFileSync(templatePath, 'utf-8'));
}

// 发送渲染请求到 MCP 服务
function renderTemplate(templateData, outputPath) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(templateData);
    
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/v1/ui/render',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.success && result.imageUrl) {
            // 下载图片
            downloadImage(result.imageUrl, outputPath)
              .then(() => resolve(result))
              .catch(reject);
          } else {
            reject(new Error(result.error || 'Render failed'));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// 下载图片
function downloadImage(imageUrl, outputPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(outputPath);
    http.get(`http://localhost:3001${imageUrl}`, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', reject);
  });
}

// 主函数
async function main() {
  const templates = ['login', 'dashboard', 'showcase'];
  const outputDir = path.join(__dirname, 'output', 'design-system');
  
  // 创建输出目录
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log('🎨 设计系统渲染器启动...\n');

  for (const templateName of templates) {
    try {
      console.log(`📄 加载模板: ${templateName}`);
      const template = loadTemplate(templateName);
      
      const outputPath = path.join(outputDir, `${templateName}.png`);
      console.log(`🖼️  渲染中...`);
      
      await renderTemplate(template, outputPath);
      console.log(`✅ 完成: ${outputPath}\n`);
    } catch (error) {
      console.error(`❌ 渲染失败 ${templateName}:`, error.message);
    }
  }

  console.log('🎉 所有模板渲染完成！');
}

// 检查 MCP 服务是否运行
function checkService() {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:3001/health', (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(3000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

// 启动
(async () => {
  const isRunning = await checkService();
  if (!isRunning) {
    console.log('⚠️ MCP 服务未运行，请先启动服务:');
    console.log('   node start-mcp-service-v2.js\n');
    process.exit(1);
  }
  
  await main();
})();
