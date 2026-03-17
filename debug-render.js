/**
 * 调试渲染脚本
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

// 读取登录模板
const templatePath = path.join(__dirname, 'my-design-system', 'templates', 'login.json');
const templateData = JSON.parse(fs.readFileSync(templatePath, 'utf-8'));

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

console.log('Sending render request...');
console.log('Payload size:', postData.length, 'bytes');

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('\nResponse status:', res.statusCode);
    try {
      const result = JSON.parse(data);
      console.log('Response:');
      console.log(JSON.stringify(result, null, 2));
    } catch (e) {
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (err) => {
  console.error('Request error:', err);
});

req.write(postData);
req.end();
