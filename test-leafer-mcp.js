/**
 * 测试 LeaferJS MCP 服务
 * 用于调试服务崩溃问题
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

// 测试数据 - 简化版
const testData = {
  width: 400,
  height: 300,
  backgroundColor: '#0f172a',
  pixelRatio: 2,
  elements: [
    {
      type: 'rect',
      x: 0,
      y: 0,
      width: 400,
      height: 300,
      fill: '#0f172a'
    },
    {
      type: 'rect',
      x: 50,
      y: 50,
      width: 300,
      height: 200,
      fill: '#1e293b',
      cornerRadius: 12
    },
    {
      type: 'text',
      x: 100,
      y: 150,
      text: '测试中文',
      fill: '#ffffff',
      fontSize: 24,
      fontFamily: 'Microsoft YaHei'
    }
  ]
};

function makeRequest(data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    
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

    console.log('[Test] Sending request to MCP service...');
    console.log('[Test] Request data:', JSON.stringify(data, null, 2));

    const req = http.request(options, (res) => {
      let responseData = '';
      
      console.log(`[Test] Response status: ${res.statusCode}`);
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        console.log('[Test] Response received');
        try {
          const parsed = JSON.parse(responseData);
          resolve(parsed);
        } catch (e) {
          resolve({ raw: responseData });
        }
      });
    });

    req.on('error', (error) => {
      console.error('[Test] Request error:', error.message);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

async function runTest() {
  console.log('========================================');
  console.log('LeaferJS MCP Service Test');
  console.log('========================================\n');

  try {
    // 首先检查服务是否运行
    console.log('[Test] Checking if service is running...');
    
    const result = await makeRequest(testData);
    console.log('\n[Test] Result:');
    console.log(JSON.stringify(result, null, 2));
    
    if (result.success && result.data && result.data.url) {
      console.log('\n✅ Test PASSED - Image generated successfully');
      console.log(`   URL: ${result.data.url}`);
    } else {
      console.log('\n❌ Test FAILED - No image URL in response');
    }
    
  } catch (error) {
    console.error('\n❌ Test FAILED with error:', error.message);
    console.log('\nMake sure the MCP service is running on port 3001');
    console.log('Start it with: node src/server.js (in mcp-service directory)');
  }
}

runTest();
