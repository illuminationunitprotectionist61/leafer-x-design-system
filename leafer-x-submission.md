# LeaferX 插件提交申请

## 插件信息

### 插件名称
**leafer-x-design-system** (设计系统生成器)

### 插件简介
基于 LeaferJS 的高保真 UI 设计系统生成器，支持响应式设计、暗黑模式、丰富的组件库和 MCP 服务集成。可快速生成移动端、桌面端、平板等多设备的 UI 原型图，适用于产品原型设计、组件库文档、设计规范输出等场景。

### 主要功能
- 🎨 **设计系统生成**: 一键生成完整的设计系统配置（颜色、字体、间距、阴影）
- 📱 **响应式模板**: 支持移动端(375x812)、桌面端(1200x800)、平板(1024x768)
- 🌓 **双主题模式**: 内置亮色/暗色主题，一键切换
- 🧩 **丰富组件库**: 按钮、输入框、表格、模态框、下拉菜单、标签页等 15+ 组件
- 🔤 **中文完美支持**: Microsoft YaHei 字体渲染
- ⚡ **MCP 服务**: 提供 HTTP API，支持服务端渲染
- 🎯 **CLI 工具**: 命令行快速生成和渲染

### 技术亮点
- 基于 LeaferJS + Skia Canvas 的高性能渲染
- 自动端口选择，避免端口冲突
- 缓存机制，批量渲染更高效
- TypeScript 类型定义支持
- 完整的示例和文档

---

## 项目链接

- **GitHub 仓库**: https://github.com/yourusername/leafer-x-design-system
- **在线体验**: http://localhost:3456 (本地 MCP 服务)
- **npm 包**: `npm install leafer-x-design-system`

---

## 教程文章

### 已发布平台
1. **微信公众号**: 《基于 LeaferJS 构建高保真设计系统生成器》
2. **掘金**: [LeaferJS 设计系统生成器实战](https://juejin.cn)
3. **知乎**: [如何用 LeaferJS 打造专业级 UI 设计工具](https://zhihu.com)

### 文章摘要
本文详细介绍了如何使用 LeaferJS 构建一个完整的设计系统生成器，包括：
- LeaferJS 核心概念和架构理解
- 高性能 Canvas 渲染技术
- 设计系统的架构设计
- MCP 服务开发实践
- 开源贡献经验分享

---

## 更新日志

### v2.0.0 (2026-03-18)
- ✨ 新增 Pro 版设计系统生成器
- ✨ 新增 AI 布局插件 V2
- ✨ 新增响应式模板（移动端、平板）
- ✨ 新增 MCP 服务自动端口选择
- ✨ 新增 CLI 工具
- ✨ 新增 TypeScript 类型定义
- 🐛 修复图片元素 URL 缺失问题
- 🐛 修复透明背景渲染问题
- 📚 完善文档和示例

### v1.0.0 (2026-03-15)
- 🎉 初始版本发布
- ✨ 基础设计系统生成器
- ✨ 7种按钮变体、输入框、卡片组件
- ✨ 登录页、仪表盘模板
- ✨ MCP 服务基础功能

---

## 使用示例

### 快速开始

```bash
# 安装
npm install leafer-x-design-system

# 生成设计系统
npx leafer-x-design-system generate "My App" "#667eea" "#764ba2"

# 启动 MCP 服务
npx leafer-x-design-system serve
```

### 代码示例

```javascript
const { DesignSystemProGenerator } = require('leafer-x-design-system');

// 创建生成器
const generator = new DesignSystemProGenerator({
  name: 'My Design System',
  primaryColor: '#3b82f6',
  secondaryColor: '#8b5cf6',
  mode: 'light'
});

// 生成并导出
const designSystem = generator.export('./my-design-system');
```

---

## 项目统计

- **代码行数**: 2600+ 行
- **组件数量**: 15+
- **模板数量**: 6 (移动端、桌面端、平板)
- **文档页数**: 30+
- **示例项目**: 5 个

---

## 可持续性计划

### 维护承诺
- 持续跟进 LeaferJS 官方更新
- 定期修复 Bug 和优化性能
- 根据用户反馈添加新功能

### 未来规划
- [ ] 支持更多导出格式 (SVG, PDF)
- [ ] 集成 AI 设计助手
- [ ] 开发可视化编辑器
- [ ] 添加更多行业模板

### 赞助支持
如果本插件对你有帮助，欢迎通过以下方式支持：
- 爱发电: https://afdian.net/@yourname
- GitHub Sponsors: https://github.com/sponsors/yourname

---

## 联系方式

- **作者**: Leafer Design System Team
- **邮箱**: your.email@example.com
- **GitHub**: https://github.com/yourusername

---

**感谢 LeaferJS 团队提供的优秀框架！期待为社区做出贡献！** 🚀
