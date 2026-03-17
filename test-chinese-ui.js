/**
 * 测试中文 UI 渲染
 * 使用 simple-chinese.json 作为测试数据
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

// 读取 simple-chinese.json
const testData = JSON.parse(fs.readFileSync(path.join(__dirname, 'ui-design', 'simple-chinese.json'), 'utf8'));

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

    console.log('[Test] Sending Chinese UI render request...');
    console.log('[Test] Canvas size:', data.width, 'x', data.height);
    console.log('[Test] Elements count:', data.elements.length);

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
  console.log('Chinese UI Render Test');
  console.log('========================================\n');

  try {
    const result = await makeRequest(testData);
    console.log('\n[Test] Result:');
    console.log(JSON.stringify(result, null, 2));
    
    if (result.success && result.data && result.data.url) {
      console.log('\n✅ Chinese UI Test PASSED');
      console.log(`   URL: ${result.data.url}`);
      console.log(`   Format: ${result.data.format}`);
      console.log(`   Size: ${result.data.width}x${result.data.height}`);
      
      // 保存 base64 图片到文件以便查看
      if (result.data.base64) {
        const base64Data = result.data.base64.replace(/^data:image\/png;base64,/, '');
        const outputPath = path.join(__dirname, 'output', 'chinese-ui-test.png');
        fs.writeFileSync(outputPath, base64Data, 'base64');
        console.log(`   Saved to: ${outputPath}`);
      }
    } else {
      console.log('\n❌ Chinese UI Test FAILED');
      console.log('Response:', result);
    }
    
  } catch (error) {
    console.error('\n❌ Test FAILED with error:', error.message);
  }
}

runTest();
