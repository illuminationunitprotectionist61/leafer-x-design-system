/**
 * 设计系统渲染器 V2
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
    // 适配模板格式到 MCP 服务格式
    const renderPayload = {
      width: templateData.width,
      height: templateData.height,
      elements: templateData.elements,
      options: {
        format: 'png',
        quality: 0.95,
        pixelRatio: 2,
        backgroundColor: templateData.backgroundColor || '#ffffff'
      }
    };
    
    const postData = JSON.stringify(renderPayload);
    
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
          if (result.success && result.data && result.data.filePath) {
            // 复制图片到目标路径
            const sourcePath = result.data.filePath;
            fs.copyFileSync(sourcePath, outputPath);
            console.log(`   📁 图片已保存: ${outputPath}`);
            resolve(result);
          } else {
            reject(new Error(result.error || 'Render failed'));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', (err) => {
      reject(new Error(`Request failed: ${err.message}`));
    });
    
    req.write(postData);
    req.end();
  });
}

// 主函数
async function main() {
  const templates = [
    { name: 'login', label: '登录页面' },
    { name: 'dashboard', label: '仪表盘页面' },
    { name: 'showcase', label: '组件展示页面' }
  ];
  
  const outputDir = path.join(__dirname, 'output', 'design-system');
  
  // 创建输出目录
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║           🎨 设计系统渲染器 V2 启动                    ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  let successCount = 0;
  let failCount = 0;

  for (const template of templates) {
    try {
      console.log(`📄 加载模板: ${template.label} (${template.name}.json)`);
      const templateData = loadTemplate(template.name);
      
      console.log(`   📐 尺寸: ${templateData.width}x${templateData.height}`);
      console.log(`   🔢 元素数量: ${templateData.elements.length}`);
      
      const outputPath = path.join(outputDir, `${template.name}.png`);
      console.log(`   🖼️  渲染中...`);
      
      await renderTemplate(templateData, outputPath);
      console.log(`   ✅ 渲染成功!\n`);
      successCount++;
    } catch (error) {
      console.error(`   ❌ 渲染失败: ${error.message}\n`);
      failCount++;
    }
  }

  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║                    📊 渲染统计                         ║');
  console.log('╠════════════════════════════════════════════════════════╣');
  console.log(`║  ✅ 成功: ${successCount} 个模板                              ║`);
  console.log(`║  ❌ 失败: ${failCount} 个模板                              ║`);
  console.log(`║  📁 输出目录: output/design-system/                    ║`);
  console.log('╚════════════════════════════════════════════════════════╝');
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
  
  console.log('✅ MCP 服务连接正常\n');
  await main();
})();
