/**
 * 测试 MCP 服务 API
 */

const http = require('http');

// 测试渲染 API
function testRender() {
  const testData = {
    width: 400,
    height: 300,
    elements: [
      {
        type: 'box',
        x: 50,
        y: 50,
        width: 300,
        height: 200,
        fill: '#667eea',
        cornerRadius: 16,
        children: [
          {
            type: 'text',
            x: 150,
            y: 90,
            text: 'Hello Leafer!',
            fill: '#ffffff',
            fontSize: 24,
            fontWeight: 'bold',
            textAlign: 'center'
          }
        ]
      }
    ],
    options: {
      format: 'png',
      quality: 0.95,
      pixelRatio: 2,
      backgroundColor: '#f3f4f6'
    }
  };

  const postData = JSON.stringify(testData);

  const options = {
    hostname: 'localhost',
    port: 3456,
    path: '/api/v1/ui/render',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  console.log('Testing POST /api/v1/ui/render...\n');

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      console.log('Response status:', res.statusCode);
      try {
        const result = JSON.parse(data);
        console.log('Result:', JSON.stringify(result, null, 2));
      } catch (e) {
        console.log('Raw response:', data);
      }
    });
  });

  req.on('error', (err) => {
    console.error('Error:', err.message);
  });

  req.write(postData);
  req.end();
}

// 运行测试
testRender();
