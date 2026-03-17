/**
 * AI 布局插件测试
 */

const http = require('http');

// 测试 Grid 布局
const gridLayoutTest = {
  width: 600,
  height: 400,
  backgroundColor: '#f8fafc',
  elements: [
    // 容器背景
    {
      type: 'box',
      x: 50, y: 50,
      width: 500, height: 300,
      fill: '#ffffff',
      cornerRadius: 12,
      shadow: { x: 0, y: 4, blur: 15, color: '#0000001a' },
      children: [
        // 使用 Grid 布局的子元素
        { type: 'rect', x: 70, y: 70, width: 80, height: 60, fill: '#FF4B4B', cornerRadius: 8 },
        { type: 'rect', x: 170, y: 70, width: 80, height: 60, fill: '#FEB027', cornerRadius: 8 },
        { type: 'rect', x: 270, y: 70, width: 80, height: 60, fill: '#79CB4D', cornerRadius: 8 },
        { type: 'rect', x: 70, y: 150, width: 80, height: 60, fill: '#4A90E2', cornerRadius: 8 },
        { type: 'rect', x: 170, y: 150, width: 80, height: 60, fill: '#9B59B6', cornerRadius: 8 },
        { type: 'rect', x: 270, y: 150, width: 80, height: 60, fill: '#1ABC9C', cornerRadius: 8 }
      ]
    },
    // 标题
    {
      type: 'text',
      x: 50, y: 20,
      text: 'Grid 布局测试',
      fill: '#1e293b',
      fontSize: 20,
      fontWeight: 'bold',
      fontFamily: 'Microsoft YaHei'
    }
  ]
};

// 测试 Flex 布局
const flexLayoutTest = {
  width: 600,
  height: 400,
  backgroundColor: '#f8fafc',
  elements: [
    {
      type: 'box',
      x: 50, y: 50,
      width: 500, height: 300,
      fill: '#ffffff',
      cornerRadius: 12,
      shadow: { x: 0, y: 4, blur: 15, color: '#0000001a' },
      children: [
        // Flex 布局子元素
        { type: 'rect', x: 70, y: 100, width: 100, height: 80, fill: '#FF4B4B', cornerRadius: 8 },
        { type: 'rect', x: 190, y: 100, width: 120, height: 60, fill: '#FEB027', cornerRadius: 8 },
        { type: 'rect', x: 330, y: 100, width: 80, height: 100, fill: '#79CB4D', cornerRadius: 8 },
        { type: 'rect', x: 430, y: 100, width: 90, height: 70, fill: '#4A90E2', cornerRadius: 8 }
      ]
    },
    {
      type: 'text',
      x: 50, y: 20,
      text: 'Flex 布局测试',
      fill: '#1e293b',
      fontSize: 20,
      fontWeight: 'bold',
      fontFamily: 'Microsoft YaHei'
    }
  ]
};

// 测试 Stack 布局
const stackLayoutTest = {
  width: 600,
  height: 500,
  backgroundColor: '#f8fafc',
  elements: [
    {
      type: 'box',
      x: 150, y: 50,
      width: 300, height: 400,
      fill: '#ffffff',
      cornerRadius: 12,
      shadow: { x: 0, y: 4, blur: 15, color: '#0000001a' },
      children: [
        // Stack 布局子元素
        { type: 'rect', x: 170, y: 70, width: 260, height: 60, fill: '#FF4B4B', cornerRadius: 8 },
        { type: 'rect', x: 170, y: 140, width: 260, height: 80, fill: '#FEB027', cornerRadius: 8 },
        { type: 'rect', x: 170, y: 230, width: 260, height: 50, fill: '#79CB4D', cornerRadius: 8 },
        { type: 'rect', x: 170, y: 290, width: 260, height: 70, fill: '#4A90E2', cornerRadius: 8 },
        { type: 'rect', x: 170, y: 370, width: 260, height: 60, fill: '#9B59B6', cornerRadius: 8 }
      ]
    },
    {
      type: 'text',
      x: 150, y: 20,
      text: 'Stack 布局测试',
      fill: '#1e293b',
      fontSize: 20,
      fontWeight: 'bold',
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

    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => responseData += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(responseData));
        } catch (e) {
          resolve({ raw: responseData });
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function runTests() {
  console.log('========================================');
  console.log('AI Layout Plugin Tests');
  console.log('========================================\n');

  const tests = [
    { name: 'Grid Layout', data: gridLayoutTest },
    { name: 'Flex Layout', data: flexLayoutTest },
    { name: 'Stack Layout', data: stackLayoutTest }
  ];

  for (const test of tests) {
    try {
      console.log(`Testing ${test.name}...`);
      const result = await makeRequest(test.data);
      
      if (result.success && result.data) {
        console.log(`✅ ${test.name} PASSED`);
        console.log(`   URL: ${result.data.url}`);
        console.log(`   Render Time: ${result.data.renderTime}ms\n`);
      } else {
        console.log(`❌ ${test.name} FAILED`);
        console.log(`   Error: ${result.error || 'Unknown error'}\n`);
      }
    } catch (error) {
      console.log(`❌ ${test.name} ERROR: ${error.message}\n`);
    }
  }

  console.log('========================================');
  console.log('All tests completed!');
  console.log('========================================');
}

runTests();
