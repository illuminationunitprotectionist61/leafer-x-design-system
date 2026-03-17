# Trae 中使用 Leafer Design System MCP 服务

## 🚀 快速配置

### 1. 配置 MCP 服务

在 Trae 的设置中添加 MCP 配置：

**Windows 路径**: `C:\Users\你的用户名\.trae\mcp-config.json`

```json
{
  "mcpServers": {
    "leafer-design-system": {
      "command": "node",
      "args": [
        "g:\\dnzs\\start-mcp-service-v2.js"
      ],
      "env": {
        "NODE_ENV": "production"
      },
      "description": "Leafer Design System - 高保真UI设计系统生成和渲染服务",
      "enabled": true
    }
  }
}
```

### 2. 启动 MCP 服务

在 Trae 终端中运行：

```bash
cd g:\dnzs
node start-mcp-service-v2.js
```

服务将在 `http://localhost:3456` 启动（使用不常用端口避免冲突）。

## 💬 在 Trae 中使用

### 方式一：直接对话

你可以在 Trae 的 AI 对话中直接描述需求：

```
用户：帮我生成一个移动端登录页面的UI原型图

AI：我来为你生成一个移动端登录页面...
[AI 会调用 MCP 服务生成图片并展示]
```

### 方式二：使用特定指令

```
用户：/design mobile-login

AI：正在生成移动端登录页面...
```

### 方式三：详细描述

```
用户：
请帮我设计一个电商App的首页，要求：
- 顶部有搜索栏
- 中间是轮播Banner
- 下面是商品分类图标
- 底部是商品列表
- 主色调使用橙色 (#FF6B35)

AI：我来为你设计这个电商首页...
```

## 🛠️ 可用的 MCP 工具

### 1. 生成设计系统

```javascript
// MCP 工具调用
{
  "tool": "generate_design_system",
  "params": {
    "name": "My App",
    "primaryColor": "#667eea",
    "secondaryColor": "#764ba2",
    "mode": "light"
  }
}
```

### 2. 渲染模板

```javascript
// MCP 工具调用
{
  "tool": "render_template",
  "params": {
    "template": "mobile-login",
    "format": "png",
    "outputDir": "./output"
  }
}
```

### 3. 自定义渲染

```javascript
// MCP 工具调用
{
  "tool": "render_custom",
  "params": {
    "width": 375,
    "height": 812,
    "elements": [
      {
        "type": "box",
        "x": 0,
        "y": 0,
        "width": 375,
        "height": 812,
        "fill": "#ffffff"
      }
    ]
  }
}
```

## 📱 支持的模板类型

### 移动端 (Mobile)
- `mobile-login` - 登录页面
- `mobile-home` - 首页
- `mobile-profile` - 个人中心
- `mobile-settings` - 设置页面

### 桌面端 (Desktop)
- `desktop-dashboard` - 仪表盘
- `desktop-login` - 登录页面
- `desktop-showcase` - 组件展示

### 平板 (Tablet)
- `tablet-dashboard` - 仪表盘

## 🎨 组件库

### 基础组件
- Button (7种变体)
- Input (多种状态)
- Card
- Badge
- Avatar
- Progress

### 高级组件
- Table (表格)
- Modal (模态框)
- Dropdown (下拉菜单)
- Tabs (标签页)
- Switch (开关)
- Checkbox (复选框)
- Radio (单选按钮)

## 💡 使用示例

### 示例 1：生成登录页

```
用户：生成一个紫色主题的移动端登录页面

AI：
我来为你生成一个紫色主题的移动端登录页面...

[调用 MCP 服务生成图片]

✅ 已生成移动端登录页面！
- 尺寸：375x812 (iPhone 尺寸)
- 主题：紫色渐变
- 包含：Logo、输入框、登录按钮、社交登录
```

### 示例 2：生成数据表格

```
用户：帮我生成一个产品列表表格，包含名称、价格、库存、状态

AI：
我来为你生成产品列表表格...

[调用 MCP 服务生成图片]

✅ 已生成产品列表表格！
- 表头：产品名称、价格、库存、状态
- 数据：3行示例数据
- 样式：斑马纹、圆角边框
```

### 示例 3：生成仪表盘

```
用户：生成一个电商后台仪表盘，包含统计卡片和图表

AI：
我来为你生成电商后台仪表盘...

[调用 MCP 服务生成图片]

✅ 已生成电商后台仪表盘！
- 4个统计卡片（订单数、销售额、用户数、转化率）
- 销售趋势图表
- 最近订单列表
```

## 🔧 高级用法

### 自定义主题

```
用户：
生成一个设计系统，要求：
- 名称：Health App
- 主色：绿色 #10B981
- 次色：青色 #06B6D4
- 模式：暗黑模式

AI：
我来为你生成 Health App 的设计系统...

[生成设计系统配置和示例页面]
```

### 批量生成

```
用户：批量生成所有移动端页面

AI：
我来为你批量生成移动端页面...

[依次生成 mobile-login, mobile-home, mobile-profile]

✅ 已生成 3 个移动端页面！
```

### 修改现有设计

```
用户：
刚才生成的登录页很好，但是：
1. 把登录按钮改成圆角更大的
2. 添加"忘记密码"链接
3. 背景使用渐变

AI：
我来修改登录页面...

[调用 MCP 服务重新生成]

✅ 已更新登录页面！
```

## 📂 输出文件位置

生成的图片保存在：
- `g:\dnzs\output\` - 所有渲染的图片
- `g:\dnzs\my-design-system\` - 设计系统配置
- `g:\dnzs\my-design-system-pro\` - Pro 版设计系统

## 🎯 最佳实践

1. **先描述整体风格**："我要一个现代简约风格的App"
2. **指定设备类型**："移动端"、"桌面端"、"平板"
3. **说明功能需求**："包含登录表单和社交登录"
4. **提供品牌色**："主色使用 #3B82F6"
5. **迭代优化**：基于生成的结果提出修改意见

## ❓ 常见问题

### Q: 如何查看已生成的图片？
A: 图片保存在 `g:\dnzs\output\` 目录，可以直接在 Trae 中打开查看。

### Q: 可以修改生成的设计吗？
A: 可以！直接告诉 AI 你的修改需求，它会重新生成。

### Q: 支持哪些图片格式？
A: 支持 PNG、JPG，默认使用 PNG。

### Q: 如何导出设计规范？
A: 设计系统配置保存在 JSON 文件中，包含颜色、字体、间距等规范。

## 🔗 相关文件

- 核心代码：`g:\dnzs\leafer-design-system-pro.js`
- 渲染器：`g:\dnzs\leafer-renderer-v2.js`
- MCP 服务：`g:\dnzs\start-mcp-service-v2.js`
- 使用示例：`g:\dnzs\examples\`

---

**提示**：确保 MCP 服务已启动（端口 3456），否则 Trae 无法调用设计系统功能。
