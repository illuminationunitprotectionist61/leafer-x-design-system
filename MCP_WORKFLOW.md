# MCP 服务 + AI 设计代理人 完整工作流程

## 📊 整体架构图

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Trae IDE (用户)                                 │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  用户输入: "帮我设计一个电商网站" 或 "做一个App首页"                    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           MCP Client (Trae内置)                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  1. 解析用户意图 → 选择代理人/工具                                    │   │
│  │  2. 构建 Tool 调用参数 (platform: App/Web/Desktop/Responsive)         │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼ (Stdio Transport)
┌─────────────────────────────────────────────────────────────────────────────┐
│                    MCP Server v3.1 (mcp-server-v3.js)                        │
│                                                                              │
│  ┌─────────────────┬─────────────────┬─────────────────┬─────────────────┐  │
│  │  🏛️ 灵境·双代理  │  🎨 像素手·图标   │  👥 灵境团队     │  🌟 创世者      │  │
│  │  Architect      │  Icon Designer  │  Multi-Agent    │  Full Lifecycle │  │
│  │  + Craftsman    │                 │                 │                 │  │
│  └─────────────────┴─────────────────┴─────────────────┴─────────────────┘  │
│                                                                              │
│  支持平台: 📱 Mobile App | 💻 Web | 🖥️ Desktop | 📱💻 Responsive            │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    │                 │                 │
                    ▼                 ▼                 ▼
┌───────────────────────┐ ┌───────────────────────┐ ┌───────────────────────┐
│   📱 移动端 (iOS/Android)│ │   💻 Web 网页设计      │ │   🖥️ 桌面应用          │
│  ┌───────────────────┐ │ │  ┌───────────────────┐ │ │  ┌───────────────────┐ │
│  │ • 375x667 (iPhone)│ │ │  │ • 1440x900 (标准) │ │ │  │ • 1920x1080 (FHD) │ │
│  │ • 390x844 (大屏)  │ │ │  │ • 响应式断点      │ │ │  │ • 侧边栏导航      │ │
│  │ • 底部标签栏      │ │ │  │ • 12列网格        │ │ │  │ • 数据密集型      │ │
│  │ • 圆角卡片        │ │ │  │ • Hero首屏        │ │ │  │ • 快捷键支持      │ │
│  └───────────────────┘ │ │  └───────────────────┘ │ │  └───────────────────┘ │
└───────────────────────┘ └───────────────────────┘ └───────────────────────┘
                    │                 │                 │
                    └─────────────────┼─────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              AI 模型层                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  国内模型                    │  国外模型                              │   │
│  │  • 通义千问 (Qwen)           │  • OpenRouter (Healer)                │   │
│  │  • 字节豆包 (Doubao)         │  • Claude 3.5 Sonnet                  │   │
│  │  • DeepSeek                  │  • GPT-4o                             │   │
│  │  • Kimi                      │  • Gemini                             │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              输出交付物                                       │
│                                                                              │
│  📄 JSON 规格书  →  🎨 HTML/CSS 预览  →  📸 PNG 图片  →  📋 设计规范文档    │
│                                                                              │
│  支持格式:                                                                    │
│  • HTML (单端/响应式)    • PNG (截图)    • JSON (规格书)    • MD (文档)      │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 🎯 四大代理人系统

### 1️⃣ 灵境·双代理 (快速原型)

```
用户输入 PRD
    │
    ├── 参数: platform (iOS/Android/Web/Desktop/Responsive)
    │         viewport (375x667 / 1440x900 / 1920x1080)
    │
    ▼
🏛️ 灵境·架构师 (lingjing_architect)
    │
    ├── 解析PRD → 提取功能需求
    ├── 选择平台规范 (iOS HIG / Material / Web Best Practice)
    ├── 生成JSON规格书 (8pt网格，组件化)
    └── 输出: UI Specification JSON
    │
    ▼
⚒️ 灵境·匠人 (lingjing_craftsman)
    │
    ├── 解析JSON → 转换为HTML元素
    ├── 应用平台样式 (移动端/Web/桌面)
    ├── 响应式适配 (如需要)
    └── 输出: HTML预览 + PNG截图
```

**适用场景**:
- ✅ 已有PRD，需要快速生成可预览原型
- ✅ 单页面或简单流程设计
- ✅ 时间紧急，需要快速验证

**平台支持**:
| 平台 | 视口尺寸 | 特点 |
|------|----------|------|
| iOS | 375x667 / 390x844 | 底部标签栏，圆角卡片，San Francisco字体 |
| Android | 360x640 / 412x869 | Material Design 3，FAB按钮，Roboto字体 |
| Web | 1440x900 | 顶部导航，Hero区域，12列网格 |
| Desktop | 1920x1080 | 侧边栏导航，数据密集，快捷键 |
| Responsive | 多断点 | 移动优先，375/768/1440px自适应 |

---

### 2️⃣ 像素手·图标集设计代理人

```
用户输入 PRD / 设计规范
    │
    ├── 参数: platform (App/Web/Both)
    │         style (线性/面性/3D/毛玻璃/渐变)
    │         colorScheme (单色/双色/渐变/多彩)
    │
    ▼
🎨 像素手 (pixelhand_icon_designer)
    │
    ├── 第1步: 需求解析
    │   └── 从PRD提取所有图标需求
    │       (底部导航/金刚区/功能按钮/空状态)
    │
    ├── 第2步: 图标列表规划
    │   └── 生成完整图标清单
    │
    ├── 第3步: 风格锁定
    │   └── 色彩/线条/圆角/光影/材质参数化
    │
    ├── 第4步: 命名规则确立
    │   └── ic_[name]_[state].svg
    │       (normal/selected/disabled)
    │
    ├── 第5步: 逐图标生成
    │   └── 详细设计描述 → AI生成
    │
    ├── 第6步: 一致性检查
    │   └── 描边/圆角/色彩/光影统一
    │
    └── 第7步: 交付
        ├── 图标文件 (SVG/PNG)
        ├── 命名规范文档
        └── 使用建议 (尺寸/间距/状态)
```

**输出物**:
- 📁 图标文件集 (按命名规则组织)
- 📄 图标规范摘要 (色彩/描边/圆角)
- 📋 使用指南 (尺寸建议/状态变化)

---

### 3️⃣ 灵境团队·多代理协作 (完整交付)

```
用户输入 完整PRD
    │
    ├── 参数: platform (Mobile App / Web App / Desktop / Responsive Website / Full Stack)
    │         pageCount (预计页面数)
    │         responsive (是否需要响应式)
    │
    ▼
👥 灵境团队启动
    │
    ├── 🏗️ 代理1: 架构代理 (骨架)
    │   │
    │   ├── 解析PRD
    │   ├── 信息架构设计
    │   ├── 页面流程图
    │   ├── 响应式断点规划 (Web项目)
    │   └── 输出:《页面结构与布局说明书》
    │
    ├── 🎨 代理2: 视觉代理 (皮肤)
    │   │
    │   ├── 接收架构文档
    │   ├── 决策视觉语言 (色彩/字体/风格)
    │   ├── 设计系统规范
    │   ├── 逐页生成高保真视觉描述
    │   └── 输出:《视觉设计规范》+ 页面视觉指令
    │
    └── 🔧 代理3: 组件代理 (零件)
        │
        ├── 接收所有页面视觉描述
        ├── 提取可复用组件
        ├── 跨页面一致性校验
        └── 输出:《组件复用报告》

    ▼
整合交付
    ├── 页面清单
    ├── 设计规范
    ├── 每页视觉指令
    └── 组件复用表
```

**适用场景**:
- ✅ 完整产品从0到1设计
- ✅ 多平台统一设计系统
- ✅ 复杂业务流程梳理
- ✅ 需要系统化设计交付

---

### 4️⃣ 创世者·超长周期代理人 (从0到1)

```
用户输入 一句话想法
    │
    例: "做一个帮助独居老人提醒吃药的App"
        "做一个Z世代二手潮牌交易平台"
        "做一个SaaS企业后台管理系统"
        "做一个响应式个人博客网站"
    │
    ├── 参数: platform (Mobile App / Web App / Desktop / Responsive Website)
    │         targetUsers (目标用户，可选)
    │         competitors (已知竞品，可选)
    │
    ▼
🌟 创世者启动四阶段工作流

阶段一: 需求挖掘与定义 (2-4小时)
    │
    ├── 向用户提问确认关键信息
    ├── 自主调研行业竞品设计趋势
    └── 输出:《产品需求草案》
            (核心功能列表/用户流程图/页面结构清单)

阶段二: 设计策略制定 (1-2小时)
    │
    ├── 根据行业属性决策视觉策略
    │   (风格关键词/主色倾向/字体层级/组件性格)
    └── 输出:《设计语言说明书》
            (风格板/色彩规范/核心组件原型)

阶段三: 逐页高保真执行 (3-6小时)
    │
    ├── 按照页面清单逐页生成UI视觉描述
    ├── 每完成3-5页输出进度检查点
    └── 输出:《完整UI视觉指令集》

阶段四: 交付与迭代 (持续)
    │
    ├── 交付物包:
    │   ├── 页面清单
    │   ├── 设计规范
    │   ├── 每页视觉指令
    │   └── 组件复用表
    │
    └── 接受用户修改指令
        ("首页太拥挤" / "主色不够活泼")
        自主重新设计相关页面
        确保全局一致性不受破坏
```

**核心理念**:
> "人类60%的工作流程会使用AI，但真正能完全交由AI自主处理的仅占0%-20%。
> 产品定义、审美决策、品牌灵魂把控——这20%仍然是你不可替代的价值。
> 
> **你不再是设计师。你是AI设计团队的CEO。**"

---

## 🔄 平台选择指南

### 📱 移动端 App

```javascript
// iOS App 示例
lingjing_architect({
  prd: "...",
  platform: "iOS",
  viewport: "390x844",  // iPhone 14
  aiProvider: "openrouter"
})

// Android App 示例
lingjing_architect({
  prd: "...",
  platform: "Android",
  viewport: "412x869",  // Pixel 6
  aiProvider: "qwen"
})

// 双端统一设计
lingjing_team_fullapp({
  prd: "...",
  platform: "Mobile App",
  pageCount: 8,
  aiProvider: "openrouter"
})
```

### 💻 Web 网站

```javascript
// 企业官网
lingjing_team_fullapp({
  prd: "...",
  platform: "Responsive Website",
  responsive: true,
  aiProvider: "doubao"
})

// 快速Web原型
lingjing_pipeline({
  prd: "...",
  platform: "Web",
  aiProvider: "deepseek"
})

// 生成Web设计系统
web_design_system({
  name: "SaaS Dashboard Design System",
  style: "SaaS",
  primaryColor: "#3B82F6",
  darkMode: true,
  responsive: true
})
```

### 🖥️ 桌面应用

```javascript
// 管理后台
lingjing_team_fullapp({
  prd: "...",
  platform: "Desktop App",
  pageCount: 12,
  aiProvider: "openrouter"
})

// 数据密集型应用
creator_full_lifecycle({
  idea: "做一个数据分析工作台",
  platform: "Desktop App",
  aiProvider: "claude"
})
```

### 📱💻 响应式全平台

```javascript
// 全栈产品 (App + Web + 后台)
lingjing_team_fullapp({
  prd: "...",
  platform: "Full Stack",
  pageCount: 20,
  responsive: true,
  aiProvider: "openrouter"
})

// 响应式预览
responsive_preview({
  spec: { /* UI规格书 */ },
  devices: ["iPhone14", "iPad", "MacBook"]
})
```

---

## 📋 工具速查表

| 需求 | 推荐工具 | 平台参数 |
|------|----------|----------|
| 已有PRD，快速App原型 | `lingjing_pipeline` | platform: "iOS/Android" |
| 已有PRD，快速Web原型 | `lingjing_pipeline` | platform: "Web" |
| 完整App设计交付 | `lingjing_team_fullapp` | platform: "Mobile App" |
| 完整网站设计交付 | `lingjing_team_fullapp` | platform: "Responsive Website" |
| 只有想法，从0到1 App | `creator_full_lifecycle` | platform: "Mobile App" |
| 只有想法，从0到1 Web | `creator_full_lifecycle` | platform: "Responsive Website" |
| 图标集设计 | `pixelhand_icon_designer` | platform: "App/Web/Both" |
| Web设计系统 | `web_design_system` | style: "SaaS/Dashboard/..." |
| 多设备预览 | `responsive_preview` | devices: ["iPhone14", "MacBook"] |
| 平台规范查询 | `get_platform_guidelines` | platform: "iOS/Android/Web" |

---

## 🔧 配置示例

### MCP 配置 (Trae)

```json
{
  "mcpServers": {
    "lingjing-design-system": {
      "command": "node",
      "args": ["${workspaceFolder}/mcp-server-v3.js"],
      "env": {
        "OPENROUTER_API_KEY": "${env:OPENROUTER_API_KEY}",
        "QWEN_API_KEY": "${env:QWEN_API_KEY}",
        "DEEPSEEK_API_KEY": "${env:DEEPSEEK_API_KEY}"
      }
    }
  }
}
```

### 环境变量

```bash
# 国内模型
QWEN_API_KEY=sk-your-qwen-key
DOUBAO_API_KEY=your-doubao-key
DEEPSEEK_API_KEY=sk-your-deepseek-key

# 国外模型
OPENROUTER_API_KEY=sk-or-your-openrouter-key
ANTHROPIC_API_KEY=sk-ant-your-claude-key

# 默认配置
DEFAULT_AI_PROVIDER=openrouter
DEFAULT_MODEL=openrouter/healer-alpha
```

---

## 🎨 设计规范集成

### iOS Human Interface Guidelines
- 清晰性 (Clarity)
- 尊重内容 (Deference)
- 深度感 (Depth)

### Android Material Design 3
- 个性化 (Personal)
- 适应性 (Adaptive)

### Web Best Practices
- 响应式断点: 375/768/1440px
- 12列网格系统
- 8pt间距系统
- WCAG可访问性标准

---

## 📚 完整工作流程示例

### 示例1: 电商App设计 (从PRD到原型)

```
用户: "帮我设计一个电商App首页，参考淘宝风格"
    │
    ▼
MCP: lingjing_architect({
  prd: "电商App首页...",
  platform: "iOS/Android",
  viewport: "375x667"
})
    │
    ▼
AI生成JSON规格书
    │
    ▼
MCP: lingjing_craftsman({
  spec: jsonSpec,
  outputFormat: "both"
})
    │
    ▼
输出: HTML预览 + PNG截图
    │
    ▼
用户查看并反馈
```

### 示例2: SaaS网站设计 (从想法到交付)

```
用户: "做一个SaaS数据分析平台网站"
    │
    ▼
MCP: creator_full_lifecycle({
  idea: "SaaS数据分析平台",
  platform: "Responsive Website"
})
    │
    ▼
阶段1: 需求挖掘
  └─ AI提问确认需求
  └─ 输出《产品需求草案》
    │
    ▼
阶段2: 设计策略
  └─ 决策视觉语言
  └─ 输出《设计语言说明书》
    │
    ▼
阶段3: 逐页执行
  └─ 生成首页/仪表盘/报表页/设置页
  └─ 输出《完整UI视觉指令集》
    │
    ▼
阶段4: 交付
  └─ 页面清单 + 设计规范 + 组件复用表
    │
    ▼
用户确认或提出修改
```

---

## ✅ 总结

**灵境设计系统 v3.1** 提供了一套完整的 AI 驱动 UI 设计解决方案：

1. **全平台支持**: App / Web / Desktop / Responsive
2. **多模式选择**: 快速原型 / 完整交付 / 从0到1孵化
3. **专业规范**: iOS HIG / Material Design / Web Best Practices
4. **灵活配置**: 支持16+种国内外AI模型
5. **标准输出**: JSON规格书 + HTML预览 + PNG截图 + 设计文档

**你不再是设计师。你是AI设计团队的CEO。**
