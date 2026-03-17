/**
 * 测试 MCP 渲染服务
 */

const http = require('http');

// 简单的测试配置
const testConfig = {
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

function testRender() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(testConfig);
    
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

    console.log('Sending request to MCP service...');
    console.log('Payload:', JSON.stringify(testConfig, null, 2));
    
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log('\nResponse status:', res.statusCode);
        console.log('Response data:', data);
        try {
          const result = JSON.parse(data);
          resolve(result);
        } catch (e) {
          reject(new Error('Invalid JSON response: ' + data));
        }
      });
    });

    req.on('error', (err) => {
      console.error('Request error:', err);
      reject(err);
    });
    
    req.write(postData);
    req.end();
  });
}

// 运行测试
testRender()
  .then(result => {
    console.log('\n✅ Test completed:', result.success ? 'SUCCESS' : 'FAILED');
    if (result.error) {
      console.error('Error:', result.error);
    }
    if (result.data) {
      console.log('Image URL:', result.data.url);
    }
  })
  .catch(err => {
    console.error('\n❌ Test failed:', err.message);
  });
