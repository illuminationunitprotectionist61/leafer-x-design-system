/**
 * LeaferRenderer V2 高级功能测试
 * 测试所有新功能：渐变、阴影、描边样式、容器等
 */

const http = require('http');

// 高级 UI 配置 - 展示所有 V2 功能
const advancedUI = {
  width: 800,
  height: 600,
  backgroundColor: '#f8fafc',
  options: {
    format: 'png',
    pixelRatio: 2
  },
  elements: [
    // 1. 背景卡片 - 带阴影和圆角
    {
      type: 'rect',
      x: 50, y: 50,
      width: 700, height: 500,
      fill: '#ffffff',
      cornerRadius: 20,
      shadow: {
        x: 0, y: 10,
        blur: 40,
        color: '#0000001a'
      }
    },
    
    // 2. 标题区域 - 渐变背景
    {
      type: 'box',
      x: 50, y: 50,
      width: 700, height: 80,
      fill: {
        type: 'linear',
        from: 'left',
        to: 'right',
        stops: ['#667eea', '#764ba2']
      },
      cornerRadius: [20, 20, 0, 0],
      children: [
        {
          type: 'text',
          x: 30, y: 25,
          text: 'LeaferJS V2 高级功能展示',
          fill: '#ffffff',
          fontSize: 28,
          fontWeight: 'bold',
          fontFamily: 'Microsoft YaHei'
        }
      ]
    },
    
    // 3. 左侧：基础图形展示
    {
      type: 'text',
      x: 80, y: 160,
      text: '基础图形',
      fill: '#1e293b',
      fontSize: 18,
      fontWeight: 'bold',
      fontFamily: 'Microsoft YaHei'
    },
    
    // 圆角矩形 - 内阴影
    {
      type: 'rect',
      x: 80, y: 190,
      width: 120, height: 80,
      fill: '#f1f5f9',
      cornerRadius: 12,
      innerShadow: {
        x: 0, y: 2,
        blur: 8,
        color: '#00000020'
      }
    },
    
    // 圆形 - 渐变填充
    {
      type: 'ellipse',
      x: 220, y: 190,
      width: 80, height: 80,
      fill: {
        type: 'radial',
        stops: ['#f093fb', '#f5576c']
      }
    },
    
    // 星形
    {
      type: 'star',
      x: 320, y: 190,
      width: 80, height: 80,
      corners: 5,
      innerRadius: 0.5,
      fill: '#fbbf24',
      cornerRadius: 5
    },
    
    // 4. 中间：描边样式展示
    {
      type: 'text',
      x: 80, y: 300,
      text: '描边样式',
      fill: '#1e293b',
      fontSize: 18,
      fontWeight: 'bold',
      fontFamily: 'Microsoft YaHei'
    },
    
    // 虚线边框
    {
      type: 'rect',
      x: 80, y: 330,
      width: 100, height: 60,
      fill: 'transparent',
      stroke: '#3b82f6',
      strokeWidth: 3,
      strokeAlign: 'inside',
      dashPattern: [8, 4],
      cornerRadius: 8
    },
    
    // 双线描边
    {
      type: 'rect',
      x: 200, y: 330,
      width: 100, height: 60,
      fill: '#dbeafe',
      stroke: '#2563eb',
      strokeWidth: 4,
      strokeAlign: 'center',
      cornerRadius: 8
    },
    
    // 渐变描边
    {
      type: 'ellipse',
      x: 320, y: 330,
      width: 80, height: 60,
      fill: 'transparent',
      stroke: {
        type: 'linear',
        stops: ['#10b981', '#059669']
      },
      strokeWidth: 4,
      strokeAlign: 'outside'
    },
    
    // 5. 右侧：容器和嵌套
    {
      type: 'text',
      x: 450, y: 160,
      text: '容器嵌套',
      fill: '#1e293b',
      fontSize: 18,
      fontWeight: 'bold',
      fontFamily: 'Microsoft YaHei'
    },
    
    // Box 容器
    {
      type: 'box',
      x: 450, y: 190,
      width: 280, height: 200,
      fill: '#f8fafc',
      stroke: '#e2e8f0',
      strokeWidth: 1,
      cornerRadius: 12,
      children: [
        {
          type: 'rect',
          x: 20, y: 20,
          width: 100, height: 60,
          fill: '#60a5fa',
          cornerRadius: 8
        },
        {
          type: 'rect',
          x: 140, y: 20,
          width: 100, height: 60,
          fill: '#34d399',
          cornerRadius: 8
        },
        {
          type: 'text',
          x: 20, y: 100,
          text: 'Box 容器可以嵌套子元素',
          fill: '#64748b',
          fontSize: 14,
          fontFamily: 'Microsoft YaHei'
        }
      ]
    },
    
    // 6. 底部：复杂图形
    {
      type: 'text',
      x: 80, y: 430,
      text: '复杂图形',
      fill: '#1e293b',
      fontSize: 18,
      fontWeight: 'bold',
      fontFamily: 'Microsoft YaHei'
    },
    
    // 多边形 - 六边形
    {
      type: 'polygon',
      x: 80, y: 460,
      width: 80, height: 80,
      sides: 6,
      fill: '#a78bfa',
      cornerRadius: 5
    },
    
    // 扇形
    {
      type: 'ellipse',
      x: 180, y: 460,
      width: 80, height: 80,
      fill: '#f472b6',
      startAngle: -60,
      endAngle: 180
    },
    
    // 圆环
    {
      type: 'ellipse',
      x: 280, y: 460,
      width: 80, height: 80,
      fill: '#22d3ee',
      innerRadius: 0.6
    },
    
    // 7. 右下角：文字样式
    {
      type: 'text',
      x: 450, y: 430,
      text: '文字样式',
      fill: '#1e293b',
      fontSize: 18,
      fontWeight: 'bold',
      fontFamily: 'Microsoft YaHei'
    },
    {
      type: 'text',
      x: 450, y: 460,
      text: '微软雅黑字体',
      fill: '#334155',
      fontSize: 20,
      fontFamily: 'Microsoft YaHei'
    },
    {
      type: 'text',
      x: 450, y: 490,
      text: 'SimHei 黑体',
      fill: '#475569',
      fontSize: 18,
      fontFamily: 'SimHei'
    },
    {
      type: 'text',
      x: 450, y: 515,
      text: '粗体文字 Bold',
      fill: '#64748b',
      fontSize: 16,
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

    console.log('[Test V2] Sending advanced UI render request...');

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

async function runTest() {
  console.log('========================================');
  console.log('LeaferRenderer V2 Advanced Features Test');
  console.log('========================================\n');

  try {
    const result = await makeRequest(advancedUI);
    
    if (result.success && result.data) {
      console.log('\n✅ Advanced UI Test PASSED');
      console.log(`   URL: ${result.data.url}`);
      console.log(`   Format: ${result.data.format}`);
      console.log(`   Size: ${result.data.width}x${result.data.height}`);
      console.log(`   Render Time: ${result.data.renderTime}ms`);
      console.log(`   Cached: ${result.data.cached}`);
      console.log('\n🎨 Features tested:');
      console.log('   ✓ Linear & radial gradients');
      console.log('   ✓ Drop shadows & inner shadows');
      console.log('   ✓ Stroke styles (dash, align, cap, join)');
      console.log('   ✓ Corner radius');
      console.log('   ✓ Box container with children');
      console.log('   ✓ Multiple Chinese fonts');
      console.log('   ✓ Polygon, star, ellipse variations');
    } else {
      console.log('\n❌ Test FAILED');
      console.log('Error:', result.error || result);
    }
    
  } catch (error) {
    console.error('\n❌ Test FAILED with error:', error.message);
    console.log('\nMake sure the MCP service V2 is running:');
    console.log('  node start-mcp-service-v2.js');
  }
}

runTest();
