# Leafer-x-design-system 安装问题排查指南

## 常见问题

### 1. skia-canvas 安装失败

**错误信息**:
```
npm error request to https://github.com/samizdatco/skia-canvas/releases/download/... failed
npm error could not find `Cargo.toml` in ...
```

**原因**: 
- 网络问题导致无法下载预编译二进制文件
- 缺少 Rust/Cargo 编译环境

**解决方案**:

#### 方案 A: 使用本地安装（推荐）

不要全局安装，改为在项目中本地安装：

```bash
# 创建项目目录
mkdir my-project
cd my-project

# 初始化 npm
npm init -y

# 本地安装（在项目目录内）
npm install leafer-x-design-system

# 启动服务
npx leafer-design serve
```

#### 方案 B: 配置 npm 使用镜像

```bash
# 配置 npm 使用淘宝镜像
npm config set registry https://registry.npmmirror.com

# 或者使用官方镜像
npm config set registry https://registry.npmjs.org

# 重新安装
npm install -g leafer-x-design-system
```

#### 方案 C: 手动安装 skia-canvas

```bash
# 先单独安装 skia-canvas
npm install -g skia-canvas

# 然后再安装主包
npm install -g leafer-x-design-system
```

#### 方案 D: 使用 Docker（最稳定）

创建 `Dockerfile`:

```dockerfile
FROM node:18-alpine

# 安装依赖
RUN apk add --no-cache python3 make g++ cairo-dev pango-dev

# 安装包
RUN npm install -g leafer-x-design-system

# 暴露端口
EXPOSE 3456

# 启动服务
CMD ["leafer-design", "serve"]
```

构建和运行:
```bash
docker build -t leafer-design .
docker run -p 3456:3456 leafer-design
```

### 2. 证书验证错误

**错误信息**:
```
unable to verify the first certificate
```

**解决方案**:

```bash
# 临时禁用 SSL 验证（不推荐长期使用）
npm config set strict-ssl false

# 或者使用系统 CA
node --use-system-ca $(which npm) install -g leafer-x-design-system
```

### 3. 权限错误

**错误信息**:
```
EPERM: operation not permitted
```

**解决方案**:

```bash
# Windows: 以管理员身份运行 PowerShell
# 右键点击 PowerShell -> 以管理员身份运行

# 或者使用 npx（不需要全局安装）
npx leafer-x-design-system
```

## 推荐安装方式

### 方式 1: 本地项目安装（最简单）

```bash
# 1. 创建项目目录
mkdir my-design-project
cd my-design-project

# 2. 初始化
npm init -y

# 3. 安装
npm install leafer-x-design-system

# 4. 启动服务
./node_modules/.bin/leafer-design serve
# 或者
npx leafer-design serve
```

### 方式 2: 使用 npx（无需安装）

```bash
# 直接使用，无需安装
npx leafer-x-design-system serve
```

### 方式 3: 克隆源码运行

```bash
# 克隆仓库
git clone https://github.com/q86830-hue/leafer-x-design-system.git
cd leafer-x-design-system

# 安装依赖
npm install

# 启动服务
npm start
```

## 系统要求

- **Node.js**: >= 16.0.0
- **操作系统**: 
  - Windows 10/11 (需要 Visual Studio Build Tools)
  - macOS 10.15+
  - Linux (需要 build-essential)

## 依赖说明

本包依赖以下原生模块：
- `@leafer-ui/node`: LeaferJS 渲染引擎
- `skia-canvas`: 基于 Skia 的 Canvas 实现

这些模块需要编译环境，如果在安装时遇到问题，请参考上述解决方案。

## 获取帮助

如果以上方案都无法解决问题，请：

1. 查看详细日志: `npm install --verbose`
2. 提交 Issue: https://github.com/q86830-hue/leafer-x-design-system/issues
3. 联系作者: spring60@vip.qq.com
