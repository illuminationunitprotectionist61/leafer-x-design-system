/**
 * MCP 服务启动器
 * 支持自动端口选择和错误处理
 */

const { spawn } = require('child_process');
const net = require('net');

// 检查端口是否可用
function checkPort(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(false);
      } else {
        resolve(false);
      }
    });
    server.once('listening', () => {
      server.close();
      resolve(true);
    });
    server.listen(port);
  });
}

// 查找可用端口
async function findAvailablePort(startPort) {
  let port = startPort;
  while (port < startPort + 100) {
    if (await checkPort(port)) {
      return port;
    }
    port++;
  }
  throw new Error('无法找到可用端口');
}

// 启动 MCP 服务
async function startServer() {
  try {
    // 查找可用端口
    const port = await findAvailablePort(3456);
    console.log(`✅ 找到可用端口: ${port}`);

    // 设置环境变量
    const env = { ...process.env, MCP_PORT: port.toString() };

    // 启动服务
    const server = spawn('node', ['start-mcp-service-v2.js'], {
      cwd: __dirname,
      env: env,
      stdio: 'inherit',
      windowsHide: true
    });

    console.log(`🚀 MCP 服务启动中，端口: ${port}`);
    console.log(`📍 健康检查: http://localhost:${port}/health`);

    // 保存端口信息到文件
    const fs = require('fs');
    fs.writeFileSync(
      'mcp-server-info.json',
      JSON.stringify({ port, pid: server.pid, startedAt: new Date().toISOString() }, null, 2)
    );

    server.on('error', (err) => {
      console.error('❌ 服务启动失败:', err.message);
    });

    server.on('exit', (code) => {
      if (code !== 0) {
        console.error(`❌ 服务异常退出，退出码: ${code}`);
      }
    });

  } catch (error) {
    console.error('❌ 启动失败:', error.message);
    process.exit(1);
  }
}

// 启动
startServer();
