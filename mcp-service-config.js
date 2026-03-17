/**
 * MCP 服务配置文件
 * 用于指定本地输出目录
 */

const path = require('path');
const fs = require('fs');

// 使用当前工作目录下的 output 文件夹
const outputDir = path.join(process.cwd(), 'output');

// 确保输出目录存在
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
  console.log('[Config] Created output directory:', outputDir);
}

module.exports = {
  outputDir,
  port: 3001,
  pixelRatio: 2,
  backgroundColor: '#ffffff',
  maxCacheSize: 100
};
