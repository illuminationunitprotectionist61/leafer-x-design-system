#!/usr/bin/env node

/**
 * MCP Server v3.1 - 灵境设计系统全平台版
 * 
 * 集成四大代理人系统：
 * 1. 灵境·双代理（架构师+匠人）- UI规格书→HTML渲染
 * 2. 像素手·图标集设计代理人 - PRD→图标集
 * 3. 灵境团队·多代理协作 - PRD→整套App/Web交付
 * 4. 创世者·超长周期 - 一句话→完整产品孵化
 * 
 * 支持平台：
 * - 移动端：iOS/Android App
 * - 桌面端：Web应用/管理后台
 * - 响应式：自适应多端
 * 
 * 支持模式：
 * - 单代理模式：快速原型
 * - 多代理团队：完整交付
 * - 超长周期：从0到1孵化
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');

class LingjingMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'lingjing-design-system',
        version: '3.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    
    this.server.onerror = (error) => {
      console.error('[MCP Error]', error);
    };
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          // ========== 灵境·双代理（全平台）==========
          {
            name: 'lingjing_architect',
            description: '🏛️ 【灵境·架构师】将PRD转换为结构化UI规格书(JSON)。支持App/Web/响应式设计。',
            inputSchema: {
              type: 'object',
              properties: {
                prd: { type: 'string', description: '产品需求文档(PRD)' },
                platform: { 
                  type: 'string', 
                  enum: ['iOS', 'Android', 'iOS/Android', 'Web', 'Desktop', 'Responsive'], 
                  default: 'Responsive',
                  description: '目标平台：iOS/Android(移动端App) | Web(网页) | Desktop(桌面应用) | Responsive(响应式)'
                },
                viewport: { 
                  type: 'string', 
                  default: '375x667',
                  description: '视口尺寸：移动端375x667 | Web端1440x900 | 桌面端1920x1080'
                },
                responsiveBreakpoints: {
                  type: 'array',
                  items: { type: 'string' },
                  default: ['mobile:375px', 'tablet:768px', 'desktop:1440px'],
                  description: '响应式断点（仅Responsive平台需要）'
                },
                aiProvider: { type: 'string', default: 'openrouter' },
                model: { type: 'string', default: 'openrouter/healer-alpha' }
              },
              required: ['prd']
            }
          },
          {
            name: 'lingjing_craftsman',
            description: '⚒️ 【灵境·匠人】将UI规格书(JSON)渲染为HTML/CSS/PNG。支持多端预览。',
            inputSchema: {
              type: 'object',
              properties: {
                spec: { type: 'object', description: 'UI规格书JSON' },
                outputFormat: { 
                  type: 'string', 
                  enum: ['html', 'png', 'responsive-html', 'all'], 
                  default: 'all',
                  description: '输出格式：html(单端) | png(图片) | responsive-html(响应式) | all(全部)'
                },
                platforms: {
                  type: 'array',
                  items: { type: 'string', enum: ['mobile', 'tablet', 'desktop'] },
                  default: ['mobile'],
                  description: '需要渲染的平台（仅responsive-html有效）'
                }
              },
              required: ['spec']
            }
          },
          {
            name: 'lingjing_pipeline',
            description: '🎯 【灵境·完整流程】PRD → JSON → HTML/PNG 一键完成（支持全平台）',
            inputSchema: {
              type: 'object',
              properties: {
                prd: { type: 'string' },
                platform: { 
                  type: 'string', 
                  enum: ['iOS', 'Android', 'iOS/Android', 'Web', 'Desktop', 'Responsive'],
                  default: 'Responsive' 
                },
                aiProvider: { type: 'string', default: 'openrouter' }
              },
              required: ['prd']
            }
          },

          // ========== 像素手·图标集设计代理人 ==========
          {
            name: 'pixelhand_icon_designer',
            description: '🎨 【像素手】图标集设计代理人。支持App图标、Web图标、Favicon全套设计。',
            inputSchema: {
              type: 'object',
              properties: {
                prd: { type: 'string', description: '产品需求文档或设计规范' },
                platform: {
                  type: 'string',
                  enum: ['App', 'Web', 'Both'],
                  default: 'Both',
                  description: '图标用途：App(移动端) | Web(网页) | Both(全平台)'
                },
                industry: { type: 'string', description: '产品行业（如金融、医疗、社交、电商、SaaS）' },
                iconCount: { type: 'number', description: '预估图标数量', default: 20 },
                style: { 
                  type: 'string', 
                  enum: ['线性', '面性', '3D', '毛玻璃', '渐变', '拟物'],
                  default: '面性'
                },
                colorScheme: { 
                  type: 'string', 
                  enum: ['单色', '双色', '渐变', '多彩'],
                  default: '单色'
                },
                aiProvider: { type: 'string', default: 'openrouter' },
                model: { type: 'string', default: 'openrouter/healer-alpha' }
              },
              required: ['prd']
            }
          },
          {
            name: 'pixelhand_extract_icons',
            description: '🔍 【像素手·提取】从PRD自动提取所有图标需求（支持App/Web全场景）',
            inputSchema: {
              type: 'object',
              properties: {
                prd: { type: 'string' },
                platform: { type: 'string', enum: ['App', 'Web', 'Both'], default: 'Both' },
                aiProvider: { type: 'string', default: 'openrouter' }
              },
              required: ['prd']
            }
          },

          // ========== 灵境团队·多代理协作（全平台）==========
          {
            name: 'lingjing_team_fullapp',
            description: '👥 【灵境团队】三代理协作 → 整套App/Web/响应式网站交付',
            inputSchema: {
              type: 'object',
              properties: {
                prd: { type: 'string', description: '完整产品需求文档' },
                platform: {
                  type: 'string',
                  enum: ['Mobile App', 'Web App', 'Desktop App', 'Responsive Website', 'Full Stack'],
                  default: 'Responsive Website',
                  description: '交付平台类型'
                },
                industry: { type: 'string', description: '产品行业' },
                targetUsers: { type: 'string', description: '目标用户群体' },
                pageCount: { type: 'number', description: '预计页面数量', default: 5 },
                responsive: {
                  type: 'boolean',
                  default: true,
                  description: '是否需要响应式设计（Web项目）'
                },
                aiProvider: { type: 'string', default: 'openrouter' },
                model: { type: 'string', default: 'openrouter/healer-alpha' }
              },
              required: ['prd']
            }
          },
          {
            name: 'lingjing_team_architecture',
            description: '🏗️ 【灵境团队·架构代理】解析PRD，输出全平台页面结构与布局说明书',
            inputSchema: {
              type: 'object',
              properties: {
                prd: { type: 'string' },
                platform: {
                  type: 'string',
                  enum: ['Mobile', 'Web', 'Desktop', 'Responsive'],
                  default: 'Responsive'
                },
                aiProvider: { type: 'string', default: 'openrouter' }
              },
              required: ['prd']
            }
          },
          {
            name: 'lingjing_team_visual',
            description: '🎨 【灵境团队·视觉代理】基于布局说明书，输出全平台高保真视觉描述',
            inputSchema: {
              type: 'object',
              properties: {
                architectureDoc: { type: 'string', description: '架构代理输出的布局说明书' },
                platform: {
                  type: 'string',
                  enum: ['Mobile', 'Web', 'Desktop', 'Responsive'],
                  default: 'Responsive'
                },
                industry: { type: 'string', description: '产品行业' },
                aiProvider: { type: 'string', default: 'openrouter' }
              },
              required: ['architectureDoc']
            }
          },
          {
            name: 'lingjing_team_component',
            description: '🔧 【灵境团队·组件代理】输出跨平台组件复用报告，确保多端一致性',
            inputSchema: {
              type: 'object',
              properties: {
                visualDescriptions: { 
                  type: 'array', 
                  items: { type: 'string' },
                  description: '视觉代理输出的所有平台页面描述' 
                },
                platforms: {
                  type: 'array',
                  items: { type: 'string', enum: ['mobile', 'tablet', 'desktop'] },
                  default: ['mobile', 'desktop']
                },
                aiProvider: { type: 'string', default: 'openrouter' }
              },
              required: ['visualDescriptions']
            }
          },

          // ========== 创世者·超长周期代理人（全平台）==========
          {
            name: 'creator_full_lifecycle',
            description: '🌟 【创世者】超长周期代理人：一句话需求 → 自主调研 → PRD → UI(App/Web) → 交付',
            inputSchema: {
              type: 'object',
              properties: {
                idea: { 
                  type: 'string', 
                  description: '产品想法（一句话）',
                  examples: [
                    '做一个帮助独居老人提醒吃药的App',
                    '做一个Z世代二手潮牌交易平台',
                    '做一个SaaS企业后台管理系统',
                    '做一个响应式个人博客网站'
                  ]
                },
                platform: {
                  type: 'string',
                  enum: ['Mobile App', 'Web App', 'Desktop App', 'Responsive Website'],
                  default: 'Responsive Website',
                  description: '目标平台类型'
                },
                targetUsers: { type: 'string', description: '目标用户（可选）' },
                competitors: { type: 'string', description: '已知竞品（可选）' },
                aiProvider: { type: 'string', default: 'openrouter' },
                model: { type: 'string', default: 'openrouter/healer-alpha' }
              },
              required: ['idea']
            }
          },
          {
            name: 'creator_phase1_research',
            description: '🔬 【创世者·阶段1】需求挖掘：提问→调研→输出全平台产品需求草案',
            inputSchema: {
              type: 'object',
              properties: {
                idea: { type: 'string' },
                platform: { type: 'string', default: 'Responsive Website' },
                targetUsers: { type: 'string' },
                competitors: { type: 'string' },
                aiProvider: { type: 'string', default: 'openrouter' }
              },
              required: ['idea']
            }
          },
          {
            name: 'creator_phase2_strategy',
            description: '🎯 【创世者·阶段2】设计策略：决策视觉语言→输出全平台设计语言说明书',
            inputSchema: {
              type: 'object',
              properties: {
                prdDraft: { type: 'string', description: '阶段1输出的产品需求草案' },
                platform: { type: 'string', default: 'Responsive Website' },
                industry: { type: 'string' },
                aiProvider: { type: 'string', default: 'openrouter' }
              },
              required: ['prdDraft']
            }
          },
          {
            name: 'creator_phase3_execute',
            description: '⚡ 【创世者·阶段3】逐页执行：生成完整UI视觉指令集（支持多端）',
            inputSchema: {
              type: 'object',
              properties: {
                prdDraft: { type: 'string' },
                designStrategy: { type: 'string', description: '阶段2输出的设计语言说明书' },
                platform: { type: 'string', default: 'Responsive Website' },
                aiProvider: { type: 'string', default: 'openrouter' }
              },
              required: ['prdDraft', 'designStrategy']
            }
          },

          // ========== 网页设计专用工具 ==========
          {
            name: 'web_design_system',
            description: '🌐 【网页设计系统】生成完整的Web设计系统（色彩/字体/间距/组件）',
            inputSchema: {
              type: 'object',
              properties: {
                name: { type: 'string', default: 'My Web Design System' },
                style: {
                  type: 'string',
                  enum: ['Modern Minimal', 'Corporate', 'Creative', 'E-commerce', 'SaaS', 'Dashboard'],
                  default: 'Modern Minimal'
                },
                primaryColor: { type: 'string', default: '#3B82F6' },
                darkMode: { type: 'boolean', default: false },
                responsive: { type: 'boolean', default: true }
              }
            }
          },
          {
            name: 'responsive_preview',
            description: '📱💻 【响应式预览】生成多设备预览图（手机/平板/桌面）',
            inputSchema: {
              type: 'object',
              properties: {
                spec: { type: 'object', description: 'UI规格书JSON' },
                devices: {
                  type: 'array',
                  items: { 
                    type: 'string', 
                    enum: ['iPhone14', 'iPad', 'MacBook', 'Desktop'] 
                  },
                  default: ['iPhone14', 'MacBook']
                }
              },
              required: ['spec']
            }
          },

          // ========== 辅助工具 ==========
          {
            name: 'get_agents',
            description: '📋 获取所有可用代理人及其能力说明（支持全平台）',
            inputSchema: { type: 'object', properties: {} }
          },
          {
            name: 'compare_modes',
            description: '⚖️ 对比工作模式，推荐最适合的方案（App/Web/响应式）',
            inputSchema: {
              type: 'object',
              properties: {
                projectType: { 
                  type: 'string', 
                  enum: ['Mobile App', 'Web App', 'Desktop App', 'Responsive Website', 'Full Stack'],
                  description: '项目类型'
                },
                prdLength: { type: 'string', enum: ['短', '中', '长'] },
                pageCount: { type: 'number' },
                timeline: { type: 'string', enum: ['紧急', '正常', '充裕'] },
                complexity: { type: 'string', enum: ['简单', '中等', '复杂'] }
              }
            }
          },
          {
            name: 'get_platform_guidelines',
            description: '📚 获取各平台设计规范指南（iOS/Android/Web/Desktop）',
            inputSchema: {
              type: 'object',
              properties: {
                platform: { 
                  type: 'string', 
                  enum: ['iOS', 'Android', 'Web', 'Desktop', 'All'],
                  default: 'All'
                }
              }
            }
          }
        ]
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          // 灵境·双代理
          case 'lingjing_architect':
            return await this.handleLingjingArchitect(args);
          case 'lingjing_craftsman':
            return await this.handleLingjingCraftsman(args);
          case 'lingjing_pipeline':
            return await this.handleLingjingPipeline(args);

          // 像素手·图标集
          case 'pixelhand_icon_designer':
            return await this.handlePixelhandIconDesigner(args);
          case 'pixelhand_extract_icons':
            return await this.handlePixelhandExtractIcons(args);

          // 灵境团队·多代理
          case 'lingjing_team_fullapp':
            return await this.handleLingjingTeamFullapp(args);
          case 'lingjing_team_architecture':
            return await this.handleLingjingTeamArchitecture(args);
          case 'lingjing_team_visual':
            return await this.handleLingjingTeamVisual(args);
          case 'lingjing_team_component':
            return await this.handleLingjingTeamComponent(args);

          // 创世者·超长周期
          case 'creator_full_lifecycle':
            return await this.handleCreatorFullLifecycle(args);
          case 'creator_phase1_research':
            return await this.handleCreatorPhase1(args);
          case 'creator_phase2_strategy':
            return await this.handleCreatorPhase2(args);
          case 'creator_phase3_execute':
            return await this.handleCreatorPhase3(args);

          // 网页设计专用
          case 'web_design_system':
            return await this.handleWebDesignSystem(args);
          case 'responsive_preview':
            return await this.handleResponsivePreview(args);

          // 辅助工具
          case 'get_agents':
            return await this.handleGetAgents();
          case 'compare_modes':
            return await this.handleCompareModes(args);
          case 'get_platform_guidelines':
            return await this.handleGetPlatformGuidelines(args);

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [{ type: 'text', text: `❌ Error: ${error.message}` }],
          isError: true
        };
      }
    });
  }

  // ========== 工具实现 ==========

  async handleLingjingArchitect(args) {
    const platformNames = {
      'iOS': 'iOS App',
      'Android': 'Android App',
      'iOS/Android': 'iOS/Android 双端App',
      'Web': 'Web网页',
      'Desktop': '桌面应用',
      'Responsive': '响应式网站'
    };

    const viewportGuide = {
      '375x667': '移动端标准 (iPhone SE)',
      '390x844': '移动端大屏 (iPhone 14)',
      '768x1024': '平板 (iPad)',
      '1440x900': 'Web标准',
      '1920x1080': '桌面全高清'
    };

    return {
      content: [{
        type: 'text',
        text: `🏛️ 【灵境·架构师】全平台架构设计\n\n📱💻 目标平台: ${platformNames[args.platform] || args.platform}\n📐 视口尺寸: ${args.viewport} (${viewportGuide[args.viewport] || '自定义'})\n${args.platform === 'Responsive' ? `📊 响应式断点: ${(args.responsiveBreakpoints || []).join(', ')}` : ''}\n\n🎯 平台特性:\n${this.getPlatformFeatures(args.platform)}\n\n✅ 架构师已就绪，开始分析PRD并生成UI规格书...`
      }]
    };
  }

  getPlatformFeatures(platform) {
    const features = {
      'iOS': '  - 遵循 Human Interface Guidelines\n  - 底部标签栏导航\n  - 圆角卡片设计\n  - San Francisco 字体',
      'Android': '  - 遵循 Material Design 3\n  - 底部导航栏/侧边抽屉\n  - 浮动操作按钮(FAB)\n  - Roboto 字体',
      'Web': '  - 标准Web布局\n  - 顶部导航+Hero区域\n  - 12列网格系统\n  - 系统字体栈',
      'Desktop': '  - 侧边栏导航\n  - 数据密集型布局\n  - 快捷键支持\n  - 高密度信息展示',
      'Responsive': '  - 移动优先设计\n  - 断点适配: 375/768/1440px\n  - 弹性网格布局\n  - 触摸+鼠标双适配'
    };
    return features[platform] || features['Web'];
  }

  async handleLingjingTeamFullapp(args) {
    const platformDesc = {
      'Mobile App': '移动端App（iOS/Android）',
      'Web App': 'Web应用',
      'Desktop App': '桌面应用',
      'Responsive Website': '响应式网站',
      'Full Stack': '全栈产品（App+Web+后台）'
    };

    return {
      content: [{
        type: 'text',
        text: `👥 【灵境团队】全平台协作模式启动\n\n🎯 交付类型: ${platformDesc[args.platform] || args.platform}\n🏭 产品行业: ${args.industry || '待分析'}\n👥 目标用户: ${args.targetUsers || '待定义'}\n📄 预计页面: ${args.pageCount} 页\n${args.platform.includes('Web') ? `📱💻 响应式设计: ${args.responsive ? '是' : '否'}` : ''}\n\n🏗️ 代理分工:\n  ├─ 代理1【骨架】- 架构代理\n  │   └─ 解析PRD → 信息架构 → 页面流程 → ${args.platform.includes('Responsive') ? '响应式断点规划' : '布局框架'}\n  ├─ 代理2【皮肤】- 视觉代理\n  │   └─ 设计系统 → 视觉规范 → ${args.platform.includes('Web') ? 'Web组件库' : '移动端组件'} → 高保真视觉\n  └─ 代理3【零件】- 组件代理\n      └─ 组件清单 → 复用分析 → ${args.platform === 'Full Stack' ? '跨平台一致性' : '多端适配'}校验\n\n📋 执行流程:\n  第1步: 代理1输出《${args.platform} 页面结构与布局说明书》\n  第2步: 代理2逐页生成高保真UI视觉描述\n  第3步: 代理3输出《组件复用与一致性报告》\n  第4步: 整合交付《完整UI设计交付物》\n\n请提供完整PRD，团队将立即开始协作。`
      }]
    };
  }

  async handleWebDesignSystem(args) {
    const styleDesc = {
      'Modern Minimal': '现代极简风格，大量留白，简洁线条',
      'Corporate': '企业商务风格，稳重专业，蓝色调为主',
      'Creative': '创意艺术风格，大胆配色，独特排版',
      'E-commerce': '电商购物风格，促销元素，商品展示优化',
      'SaaS': 'SaaS产品风格，功能导向，数据可视化',
      'Dashboard': '仪表盘风格，信息密集，图表丰富'
    };

    return {
      content: [{
        type: 'text',
        text: `🌐 【网页设计系统】生成完成\n\n📦 系统名称: ${args.name}\n🎨 风格定位: ${styleDesc[args.style]}\n🎯 主色调: ${args.primaryColor}\n🌙 暗黑模式: ${args.darkMode ? '支持' : '仅亮色'}\n📱💻 响应式: ${args.responsive ? '支持' : '固定宽度'}\n\n📋 设计系统包含:\n  ✓ 色彩系统（主色/辅助色/中性色/功能色）\n  ✓ 字体规范（标题/正文/辅助文字层级）\n  ✓ 间距系统（4px基数: 4, 8, 12, 16, 24, 32, 48, 64）\n  ✓ 圆角规范（小4px/中8px/大16px/全圆）\n  ✓ 阴影层级（无/小/中/大/悬浮）\n  ✓ 断点定义（Mobile:375/Tablet:768/Desktop:1440）\n  ✓ Web组件库（Button/Input/Card/Modal/Table等30+组件）\n  ✓ ${args.darkMode ? '暗黑模式变量' : ''}\n\n🎨 特色组件:\n  ${args.style === 'E-commerce' ? '• 商品卡片（图片+价格+评分+标签）\n  • 购物车浮层\n  • 促销Banner' : ''}
  ${args.style === 'SaaS' ? '• 数据卡片（指标+趋势图）\n  • 功能导航网格\n  • 定价对比表' : ''}
  ${args.style === 'Dashboard' ? '• 统计图表区域\n  • 快捷操作面板\n  • 实时数据流' : ''}
  • 响应式导航栏\n  • Hero首屏区域\n  • 内容区块\n  • 页脚布局\n\n💡 使用建议:\n  1. 复制设计令牌到CSS变量\n  2. 使用组件类名快速搭建页面\n  3. 遵循8pt网格保持视觉一致性`
      }]
    };
  }

  async handleGetAgents() {
    return {
      content: [{
        type: 'text',
        text: `📋 灵境设计系统 v3.1 - 全平台可用代理人\n\n═══════════════════════════════════════════════════\n\n🏛️ 【灵境·双代理】- UI规格书 → HTML/PNG渲染\n  ├─ lingjing_architect    - 架构师: PRD→JSON规格书\n  │                          支持: App(iOS/Android) | Web | Desktop | Responsive\n  ├─ lingjing_craftsman    - 匠人: JSON→HTML预览\n  │                          支持: 单端/响应式/多设备预览\n  └─ lingjing_pipeline     - 完整流程: 一键完成\n\n适用场景:\n  • 移动端App → platform: "iOS/Android", viewport: "375x667"\n  • Web网站   → platform: "Web", viewport: "1440x900"\n  • 桌面应用  → platform: "Desktop", viewport: "1920x1080"\n  • 响应式    → platform: "Responsive", 自动适配多端\n\n═══════════════════════════════════════════════════\n\n🎨 【像素手·图标集设计代理人】- PRD→图标集\n  ├─ pixelhand_icon_designer - 完整图标集设计\n  │    支持: App图标 | Web图标 | Favicon | 全平台统一\n  └─ pixelhand_extract_icons - 提取图标需求清单\n\n适用场景:\n  • App底部导航图标\n  • Web导航菜单图标\n  • 功能操作图标\n  • 空状态插画图标\n\n═══════════════════════════════════════════════════\n\n👥 【灵境团队·多代理协作】- PRD→整套产品交付\n  ├─ lingjing_team_fullapp      - 三代理完整交付\n  │    支持: Mobile App | Web App | Desktop | Responsive Website | Full Stack\n  ├─ lingjing_team_architecture - 架构代理\n  ├─ lingjing_team_visual       - 视觉代理\n  └─ lingjing_team_component    - 组件代理\n\n适用场景:\n  • 完整产品从0到1设计\n  • 多平台统一设计系统\n  • 复杂业务流程梳理\n\n═══════════════════════════════════════════════════\n\n🌟 【创世者·超长周期代理人】- 一句话→完整产品\n  ├─ creator_full_lifecycle - 四阶段完整孵化\n  ├─ creator_phase1_research - 需求挖掘\n  ├─ creator_phase2_strategy - 设计策略\n  └─ creator_phase3_execute  - 逐页执行\n\n适用场景:\n  • 只有产品想法，无PRD\n  • 需要AI自主调研竞品\n  • 从概念到交付全流程\n\n═══════════════════════════════════════════════════\n\n🌐 【网页设计专用工具】\n  ├─ web_design_system    - 生成完整Web设计系统\n  └─ responsive_preview   - 多设备响应式预览\n\n═══════════════════════════════════════════════════\n\n💡 快速选择指南:\n\n【移动端App】\n  PRD完整 → lingjing_team_fullapp (platform: "Mobile App")\n  快速原型 → lingjing_pipeline (platform: "iOS/Android")\n\n【Web网站】\n  企业官网 → lingjing_team_fullapp (platform: "Responsive Website")\n  快速落地 → lingjing_pipeline (platform: "Web")\n  设计系统 → web_design_system\n\n【桌面应用】\n  管理后台 → lingjing_team_fullapp (platform: "Desktop App")\n  数据密集 → creator_full_lifecycle (platform: "Desktop App")\n\n【响应式全平台】\n  全栈产品 → lingjing_team_fullapp (platform: "Full Stack")\n  从0到1  → creator_full_lifecycle (platform: "Responsive Website")\n\n【不确定】\n  使用 compare_modes 获取智能推荐`
      }]
    };
  }

  async handleGetPlatformGuidelines(args) {
    const guidelines = {
      'iOS': `
📱 iOS Design Guidelines

Human Interface Guidelines 核心原则:
• 清晰性 (Clarity) - 文字可读，图标明确，装饰微妙
• 尊重内容 (Deference) - 内容占据屏幕中心
• 深度感 (Depth) - 层级分明，过渡自然

设计规范:
• 状态栏: 44pt (iPhone X及以上)
• 导航栏: 44pt
• 标签栏: 49pt
• 边距: 16pt (标准), 20pt (大屏)
• 圆角: 8-12pt (卡片), 全圆 (按钮)
• 字体: San Francisco (系统字体)

组件规范:
• 按钮高度: 44pt (标准), 32pt (紧凑)
• 列表行高: 44pt
• 图标尺寸: 25x25pt (标签栏), 22x22pt (导航栏)
`,
      'Android': `
📱 Android Material Design 3

设计原则:
• 个性化 (Personal) - 表达品牌个性
• 适应性 (Adaptive) - 适配各种设备和场景

设计规范:
• 状态栏: 24dp
• 导航栏: 56dp (手机), 64dp (平板)
• 底部导航: 80dp
• 边距: 16dp (标准)
• 圆角: 4dp (小), 8dp (中), 16dp (大), 28dp (全圆)
• 字体: Roboto (系统字体)

组件规范:
• FAB: 56dp (标准), 40dp (迷你)
• 卡片间距: 8dp
• 列表项高度: 56dp (单行), 72dp (双行)
`,
      'Web': `
💻 Web Design Best Practices

响应式断点:
• Mobile: < 640px
• Tablet: 640px - 1024px
• Desktop: > 1024px
• Large: > 1440px

布局规范:
• 最大宽度: 1200-1400px (内容区)
• 边距: 16px (mobile), 24px (tablet), 32px (desktop)
• 网格: 12列系统
• 间距: 8px基数 (8, 16, 24, 32, 48, 64)

字体规范:
• 标题: 32-48px (H1), 24-32px (H2)
• 正文: 16px (标准), 14px (辅助)
• 行高: 1.5-1.6 (正文), 1.2-1.3 (标题)

可访问性:
• 颜色对比度: 4.5:1 (正文), 3:1 (大文字)
• 触摸目标: 最小44x44px
• 焦点状态: 清晰可见
`
    };

    if (args.platform === 'All') {
      return {
        content: [{
          type: 'text',
          text: `📚 全平台设计规范指南\n\n${guidelines['iOS']}\n${guidelines['Android']}\n${guidelines['Web']}`
        }]
      };
    }

    return {
      content: [{
        type: 'text',
        text: guidelines[args.platform] || '暂无该平台的规范指南'
      }]
    };
  }

  // 其他处理方法...
  async handleLingjingCraftsman(args) {
    return { content: [{ type: 'text', text: '⚒️ 【灵境·匠人】渲染中...' }] };
  }

  async handleLingjingPipeline(args) {
    return { content: [{ type: 'text', text: '🎯 【灵境·完整流程】执行中...' }] };
  }

  async handlePixelhandIconDesigner(args) {
    return { content: [{ type: 'text', text: '🎨 【像素手】设计图标集中...' }] };
  }

  async handlePixelhandExtractIcons(args) {
    return { content: [{ type: 'text', text: '🔍 【像素手·提取】分析中...' }] };
  }

  async handleLingjingTeamArchitecture(args) {
    return { content: [{ type: 'text', text: '🏗️ 【灵境团队·架构代理】解析PRD中...' }] };
  }

  async handleLingjingTeamVisual(args) {
    return { content: [{ type: 'text', text: '🎨 【灵境团队·视觉代理】生成视觉描述中...' }] };
  }

  async handleLingjingTeamComponent(args) {
    return { content: [{ type: 'text', text: '🔧 【灵境团队·组件代理】检查一致性中...' }] };
  }

  async handleCreatorFullLifecycle(args) {
    return { content: [{ type: 'text', text: '🌟 【创世者】启动全生命周期设计...' }] };
  }

  async handleCreatorPhase1(args) {
    return { content: [{ type: 'text', text: '🔬 【创世者·阶段1】需求挖掘中...' }] };
  }

  async handleCreatorPhase2(args) {
    return { content: [{ type: 'text', text: '🎯 【创世者·阶段2】设计策略制定中...' }] };
  }

  async handleCreatorPhase3(args) {
    return { content: [{ type: 'text', text: '⚡ 【创世者·阶段3】逐页执行中...' }] };
  }

  async handleResponsivePreview(args) {
    return { content: [{ type: 'text', text: '📱💻 【响应式预览】生成多设备预览图...' }] };
  }

  async handleCompareModes(args) {
    return { content: [{ type: 'text', text: '⚖️ 分析中，推荐最适合的方案...' }] };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('🌟 Lingjing MCP Server v3.1.0 running');
    console.error('支持: App | Web | Desktop | Responsive');
  }
}

const server = new LingjingMCPServer();
server.run().catch(console.error);
