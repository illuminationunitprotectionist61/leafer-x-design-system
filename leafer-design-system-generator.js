/**
 * LeaferJS UI 设计系统生成器
 * 
 * 专家级工具 - 自动生成完整的设计系统、组件库和 UI 原型
 * 
 * 功能：
 * - 主题配置系统（颜色、字体、间距、阴影）
 * - 基础组件生成（Button、Input、Card、Modal 等）
 * - 完整页面模板（Dashboard、Login、Profile 等）
 * - 导出为 LeaferJS JSON 格式
 * - 直接渲染为图片
 * 
 * @author LeaferJS Expert
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');

/**
 * 设计系统配置
 */
class DesignSystemConfig {
  constructor(options = {}) {
    this.name = options.name || 'My Design System';
    this.version = options.version || '1.0.0';
    
    // 颜色系统
    this.colors = {
      primary: options.primaryColor || '#667eea',
      secondary: options.secondaryColor || '#764ba2',
      success: '#48bb78',
      warning: '#ed8936',
      error: '#f56565',
      info: '#4299e1',
      gray: {
        50: '#f9fafb',
        100: '#f3f4f6',
        200: '#e5e7eb',
        300: '#d1d5db',
        400: '#9ca3af',
        500: '#6b7280',
        600: '#4b5563',
        700: '#374151',
        800: '#1f2937',
        900: '#111827'
      },
      ...options.colors
    };
    
    // 字体系统
    this.typography = {
      fontFamily: options.fontFamily || 'Microsoft YaHei',
      fontSize: {
        xs: 12,
        sm: 14,
        base: 16,
        lg: 18,
        xl: 20,
        '2xl': 24,
        '3xl': 30,
        '4xl': 36
      },
      fontWeight: {
        light: 300,
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700
      },
      lineHeight: {
        tight: 1.25,
        normal: 1.5,
        relaxed: 1.75
      }
    };
    
    // 间距系统
    this.spacing = {
      0: 0,
      1: 4,
      2: 8,
      3: 12,
      4: 16,
      5: 20,
      6: 24,
      8: 32,
      10: 40,
      12: 48,
      16: 64
    };
    
    // 圆角系统
    this.borderRadius = {
      none: 0,
      sm: 2,
      md: 4,
      lg: 8,
      xl: 12,
      '2xl': 16,
      full: 9999
    };
    
    // 阴影系统
    this.shadows = {
      sm: { x: 0, y: 1, blur: 2, color: '#0000000d' },
      md: { x: 0, y: 4, blur: 6, color: '#0000001a' },
      lg: { x: 0, y: 10, blur: 15, color: '#0000001a' },
      xl: { x: 0, y: 20, blur: 25, color: '#00000026' },
      inner: { x: 0, y: 2, blur: 4, color: '#0000000d' }
    };
    
    // 断点系统
    this.breakpoints = {
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
      '2xl': 1536
    };
  }
  
  /**
   * 导出配置为 JSON
   */
  toJSON() {
    return {
      name: this.name,
      version: this.version,
      colors: this.colors,
      typography: this.typography,
      spacing: this.spacing,
      borderRadius: this.borderRadius,
      shadows: this.shadows,
      breakpoints: this.breakpoints
    };
  }
  
  /**
   * 保存配置到文件
   */
  save(outputPath) {
    const configPath = path.join(outputPath, 'design-system.json');
    fs.writeFileSync(configPath, JSON.stringify(this.toJSON(), null, 2));
    console.log(`[Design System] Config saved to: ${configPath}`);
    return configPath;
  }
}

/**
 * 组件生成器
 */
class ComponentGenerator {
  constructor(config) {
    this.config = config;
  }
  
  /**
   * 生成按钮组件
   */
  generateButton(variant = 'primary', size = 'md', text = 'Button') {
    const { colors, typography, spacing, borderRadius, shadows } = this.config;
    
    // 尺寸配置
    const sizeConfig = {
      sm: { height: 32, padding: spacing[2], fontSize: typography.fontSize.sm },
      md: { height: 40, padding: spacing[4], fontSize: typography.fontSize.base },
      lg: { height: 48, padding: spacing[6], fontSize: typography.fontSize.lg }
    };
    
    // 变体配置
    const variantConfig = {
      primary: { fill: colors.primary, textColor: '#ffffff' },
      secondary: { fill: colors.secondary, textColor: '#ffffff' },
      success: { fill: colors.success, textColor: '#ffffff' },
      warning: { fill: colors.warning, textColor: '#ffffff' },
      error: { fill: colors.error, textColor: '#ffffff' },
      ghost: { fill: 'transparent', textColor: colors.primary },
      outline: { fill: 'transparent', textColor: colors.primary, stroke: colors.primary, strokeWidth: 2 }
    };
    
    const sizeProps = sizeConfig[size] || sizeConfig.md;
    const variantProps = variantConfig[variant] || variantConfig.primary;
    
    return {
      type: 'box',
      width: 'auto',
      height: sizeProps.height,
      fill: variantProps.fill,
      stroke: variantProps.stroke || undefined,
      strokeWidth: variantProps.strokeWidth || undefined,
      cornerRadius: borderRadius.md,
      shadow: shadows.md,
      children: [
        {
          type: 'text',
          text: text,
          fill: variantProps.textColor,
          fontSize: sizeProps.fontSize,
          fontWeight: typography.fontWeight.medium,
          fontFamily: typography.fontFamily,
          textAlign: 'center',
          verticalAlign: 'middle'
        }
      ]
    };
  }
  
  /**
   * 生成输入框组件
   */
  generateInput(placeholder = '请输入...', width = 240) {
    const { colors, typography, spacing, borderRadius } = this.config;
    
    return {
      type: 'box',
      width: width,
      height: 40,
      fill: '#ffffff',
      stroke: colors.gray[300],
      strokeWidth: 1,
      cornerRadius: borderRadius.md,
      children: [
        {
          type: 'text',
          x: spacing[3],
          y: 12,
          text: placeholder,
          fill: colors.gray[400],
          fontSize: typography.fontSize.base,
          fontFamily: typography.fontFamily
        }
      ]
    };
  }
  
  /**
   * 生成卡片组件
   */
  generateCard(title = 'Card Title', content = 'Card content goes here...') {
    const { colors, typography, spacing, borderRadius, shadows } = this.config;
    
    return {
      type: 'box',
      width: 320,
      height: 'auto',
      fill: '#ffffff',
      cornerRadius: borderRadius.lg,
      shadow: shadows.lg,
      padding: spacing[6],
      children: [
        {
          type: 'text',
          text: title,
          fill: colors.gray[900],
          fontSize: typography.fontSize.lg,
          fontWeight: typography.fontWeight.semibold,
          fontFamily: typography.fontFamily,
          marginBottom: spacing[3]
        },
        {
          type: 'text',
          text: content,
          fill: colors.gray[600],
          fontSize: typography.fontSize.base,
          fontFamily: typography.fontFamily,
          lineHeight: typography.lineHeight.relaxed
        }
      ]
    };
  }
  
  /**
   * 生成徽章组件
   */
  generateBadge(text = 'Badge', color = 'primary') {
    const { colors, typography, spacing, borderRadius } = this.config;
    
    const colorMap = {
      primary: colors.primary,
      success: colors.success,
      warning: colors.warning,
      error: colors.error,
      info: colors.info
    };
    
    return {
      type: 'box',
      height: 24,
      fill: colorMap[color] || colorMap.primary,
      cornerRadius: borderRadius.full,
      padding: [spacing[1], spacing[3]],
      children: [
        {
          type: 'text',
          text: text,
          fill: '#ffffff',
          fontSize: typography.fontSize.xs,
          fontWeight: typography.fontWeight.medium,
          fontFamily: typography.fontFamily
        }
      ]
    };
  }
  
  /**
   * 生成头像组件
   */
  generateAvatar(name = 'User', size = 'md') {
    const { colors, typography } = this.config;
    
    const sizeMap = {
      sm: 32,
      md: 40,
      lg: 48,
      xl: 64
    };
    
    const sizeValue = sizeMap[size] || sizeMap.md;
    const initial = name.charAt(0).toUpperCase();
    
    return {
      type: 'ellipse',
      width: sizeValue,
      height: sizeValue,
      fill: colors.primary,
      children: [
        {
          type: 'text',
          text: initial,
          fill: '#ffffff',
          fontSize: sizeValue * 0.4,
          fontWeight: typography.fontWeight.bold,
          fontFamily: typography.fontFamily,
          textAlign: 'center',
          verticalAlign: 'middle'
        }
      ]
    };
  }
  
  /**
   * 生成进度条组件
   */
  generateProgress(progress = 65, width = 200) {
    const { colors, borderRadius } = this.config;
    const height = 8;
    
    return {
      type: 'group',
      width: width,
      height: height,
      children: [
        // 背景
        {
          type: 'rect',
          width: width,
          height: height,
          fill: colors.gray[200],
          cornerRadius: borderRadius.full
        },
        // 进度
        {
          type: 'rect',
          width: width * (progress / 100),
          height: height,
          fill: progress >= 100 ? colors.success : colors.primary,
          cornerRadius: borderRadius.full
        }
      ]
    };
  }
  
  /**
   * 生成所有组件示例
   */
  generateAllComponents() {
    return {
      buttons: {
        primary: this.generateButton('primary', 'md', 'Primary'),
        secondary: this.generateButton('secondary', 'md', 'Secondary'),
        success: this.generateButton('success', 'md', 'Success'),
        warning: this.generateButton('warning', 'md', 'Warning'),
        error: this.generateButton('error', 'md', 'Error'),
        ghost: this.generateButton('ghost', 'md', 'Ghost'),
        outline: this.generateButton('outline', 'md', 'Outline')
      },
      inputs: {
        default: this.generateInput('请输入内容...'),
        search: this.generateInput('搜索...', 300)
      },
      cards: {
        default: this.generateCard(),
        feature: this.generateCard('功能特性', '这是一个功能特性卡片，展示产品的主要功能点。')
      },
      badges: {
        primary: this.generateBadge('Primary', 'primary'),
        success: this.generateBadge('Success', 'success'),
        warning: this.generateBadge('Warning', 'warning'),
        error: this.generateBadge('Error', 'error')
      },
      avatars: {
        sm: this.generateAvatar('张三', 'sm'),
        md: this.generateAvatar('李四', 'md'),
        lg: this.generateAvatar('王五', 'lg')
      },
      progress: {
        low: this.generateProgress(25),
        medium: this.generateProgress(50),
        high: this.generateProgress(75),
        complete: this.generateProgress(100)
      }
    };
  }
}

/**
 * 页面模板生成器
 */
class PageTemplateGenerator {
  constructor(config, componentGenerator) {
    this.config = config;
    this.components = componentGenerator;
  }
  
  /**
   * 生成登录页面
   */
  generateLoginPage() {
    const { colors, typography, spacing, borderRadius, shadows } = this.config;
    
    return {
      width: 800,
      height: 600,
      backgroundColor: colors.gray[100],
      elements: [
        // 背景装饰
        {
          type: 'ellipse',
          x: -100, y: -100,
          width: 400, height: 400,
          fill: { type: 'radial', stops: [colors.primary + '20', colors.primary + '00'] }
        },
        {
          type: 'ellipse',
          x: 500, y: 300,
          width: 500, height: 500,
          fill: { type: 'radial', stops: [colors.secondary + '20', colors.secondary + '00'] }
        },
        // 登录卡片
        {
          type: 'box',
          x: 200, y: 100,
          width: 400, height: 400,
          fill: '#ffffff',
          cornerRadius: borderRadius['2xl'],
          shadow: shadows.xl,
          children: [
            // 标题
            {
              type: 'text',
              x: 40, y: 40,
              text: '欢迎登录',
              fill: colors.gray[900],
              fontSize: typography.fontSize['3xl'],
              fontWeight: typography.fontWeight.bold,
              fontFamily: typography.fontFamily
            },
            // 副标题
            {
              type: 'text',
              x: 40, y: 85,
              text: '请输入您的账号和密码',
              fill: colors.gray[500],
              fontSize: typography.fontSize.base,
              fontFamily: typography.fontFamily
            },
            // 用户名输入框
            {
              type: 'box',
              x: 40, y: 130,
              width: 320, height: 48,
              fill: '#ffffff',
              stroke: colors.gray[300],
              strokeWidth: 1,
              cornerRadius: borderRadius.lg,
              children: [
                {
                  type: 'text',
                  x: 16, y: 16,
                  text: '用户名',
                  fill: colors.gray[400],
                  fontSize: typography.fontSize.base,
                  fontFamily: typography.fontFamily
                }
              ]
            },
            // 密码输入框
            {
              type: 'box',
              x: 40, y: 190,
              width: 320, height: 48,
              fill: '#ffffff',
              stroke: colors.gray[300],
              strokeWidth: 1,
              cornerRadius: borderRadius.lg,
              children: [
                {
                  type: 'text',
                  x: 16, y: 16,
                  text: '密码',
                  fill: colors.gray[400],
                  fontSize: typography.fontSize.base,
                  fontFamily: typography.fontFamily
                }
              ]
            },
            // 登录按钮
            {
              type: 'box',
              x: 40, y: 260,
              width: 320, height: 48,
              fill: colors.primary,
              cornerRadius: borderRadius.lg,
              shadow: shadows.md,
              children: [
                {
                  type: 'text',
                  x: 160, y: 16,
                  text: '登录',
                  fill: '#ffffff',
                  fontSize: typography.fontSize.base,
                  fontWeight: typography.fontWeight.semibold,
                  fontFamily: typography.fontFamily,
                  textAlign: 'center'
                }
              ]
            },
            // 注册链接
            {
              type: 'text',
              x: 160, y: 330,
              text: '还没有账号？立即注册',
              fill: colors.primary,
              fontSize: typography.fontSize.sm,
              fontFamily: typography.fontFamily,
              textAlign: 'center'
            }
          ]
        }
      ]
    };
  }
  
  /**
   * 生成 Dashboard 页面
   */
  generateDashboardPage() {
    const { colors, typography, spacing, borderRadius, shadows } = this.config;
    
    return {
      width: 1200,
      height: 800,
      backgroundColor: colors.gray[50],
      elements: [
        // 侧边栏
        {
          type: 'box',
          x: 0, y: 0,
          width: 240, height: 800,
          fill: '#ffffff',
          shadow: shadows.md,
          children: [
            // Logo
            {
              type: 'text',
              x: 24, y: 24,
              text: 'Dashboard',
              fill: colors.gray[900],
              fontSize: typography.fontSize.xl,
              fontWeight: typography.fontWeight.bold,
              fontFamily: typography.fontFamily
            },
            // 菜单项
            ...['概览', '分析', '用户', '设置'].map((item, index) => ({
              type: 'box',
              x: 16, y: 80 + index * 48,
              width: 208, height: 40,
              fill: index === 0 ? colors.primary + '15' : 'transparent',
              cornerRadius: borderRadius.md,
              children: [
                {
                  type: 'text',
                  x: 16, y: 12,
                  text: item,
                  fill: index === 0 ? colors.primary : colors.gray[600],
                  fontSize: typography.fontSize.base,
                  fontWeight: index === 0 ? typography.fontWeight.medium : typography.fontWeight.normal,
                  fontFamily: typography.fontFamily
                }
              ]
            }))
          ]
        },
        // 顶部栏
        {
          type: 'box',
          x: 240, y: 0,
          width: 960, height: 64,
          fill: '#ffffff',
          shadow: shadows.sm,
          children: [
            // 搜索框
            {
              type: 'box',
              x: 24, y: 12,
              width: 320, height: 40,
              fill: colors.gray[100],
              cornerRadius: borderRadius.md,
              children: [
                {
                  type: 'text',
                  x: 16, y: 12,
                  text: '搜索...',
                  fill: colors.gray[400],
                  fontSize: typography.fontSize.sm,
                  fontFamily: typography.fontFamily
                }
              ]
            },
            // 头像
            {
              type: 'ellipse',
              x: 880, y: 12,
              width: 40, height: 40,
              fill: colors.primary
            }
          ]
        },
        // 统计卡片
        ...[
          { title: '总用户', value: '12,345', change: '+12%', color: colors.primary },
          { title: '活跃用户', value: '8,234', change: '+8%', color: colors.success },
          { title: '收入', value: '¥45,678', change: '+23%', color: colors.warning },
          { title: '转化率', value: '3.45%', change: '-2%', color: colors.error }
        ].map((stat, index) => ({
          type: 'box',
          x: 280 + (index % 4) * 220, y: 100 + Math.floor(index / 4) * 140,
          width: 200, height: 120,
          fill: '#ffffff',
          cornerRadius: borderRadius.lg,
          shadow: shadows.md,
          children: [
            {
              type: 'text',
              x: 20, y: 20,
              text: stat.title,
              fill: colors.gray[500],
              fontSize: typography.fontSize.sm,
              fontFamily: typography.fontFamily
            },
            {
              type: 'text',
              x: 20, y: 50,
              text: stat.value,
              fill: colors.gray[900],
              fontSize: typography.fontSize['2xl'],
              fontWeight: typography.fontWeight.bold,
              fontFamily: typography.fontFamily
            },
            {
              type: 'box',
              x: 20, y: 85,
              width: 60, height: 24,
              fill: stat.change.startsWith('+') ? colors.success + '20' : colors.error + '20',
              cornerRadius: borderRadius.full,
              children: [
                {
                  type: 'text',
                  x: 30, y: 6,
                  text: stat.change,
                  fill: stat.change.startsWith('+') ? colors.success : colors.error,
                  fontSize: typography.fontSize.xs,
                  fontWeight: typography.fontWeight.medium,
                  fontFamily: typography.fontFamily,
                  textAlign: 'center'
                }
              ]
            }
          ]
        })),
        // 图表区域
        {
          type: 'box',
          x: 280, y: 260,
          width: 640, height: 300,
          fill: '#ffffff',
          cornerRadius: borderRadius.lg,
          shadow: shadows.md,
          children: [
            {
              type: 'text',
              x: 24, y: 24,
              text: '访问趋势',
              fill: colors.gray[900],
              fontSize: typography.fontSize.lg,
              fontWeight: typography.fontWeight.semibold,
              fontFamily: typography.fontFamily
            },
            // 模拟图表柱状图
            ...[65, 45, 80, 55, 90, 70, 85].map((value, index) => ({
              type: 'rect',
              x: 60 + index * 80, y: 250 - value * 2,
              width: 40, height: value * 2,
              fill: colors.primary,
              cornerRadius: [4, 4, 0, 0]
            }))
          ]
        }
      ]
    };
  }
  
  /**
   * 生成组件展示页面
   */
  generateComponentShowcase() {
    const { colors, typography, spacing, borderRadius, shadows } = this.config;
    const allComponents = this.components.generateAllComponents();
    
    return {
      width: 1200,
      height: 1600,
      backgroundColor: colors.gray[50],
      elements: [
        // 页面标题
        {
          type: 'box',
          x: 0, y: 0,
          width: 1200, height: 120,
          fill: '#ffffff',
          shadow: shadows.sm,
          children: [
            {
              type: 'text',
              x: 60, y: 40,
              text: this.config.name,
              fill: colors.gray[900],
              fontSize: typography.fontSize['3xl'],
              fontWeight: typography.fontWeight.bold,
              fontFamily: typography.fontFamily
            },
            {
              type: 'text',
              x: 60, y: 80,
              text: `版本 ${this.config.version} | 组件库展示`,
              fill: colors.gray[500],
              fontSize: typography.fontSize.base,
              fontFamily: typography.fontFamily
            }
          ]
        },
        
        // 按钮组件展示
        {
          type: 'box',
          x: 60, y: 160,
          width: 1100, height: 200,
          fill: '#ffffff',
          cornerRadius: borderRadius.lg,
          shadow: shadows.md,
          children: [
            {
              type: 'text',
              x: 30, y: 30,
              text: '按钮组件 (Buttons)',
              fill: colors.gray[900],
              fontSize: typography.fontSize.xl,
              fontWeight: typography.fontWeight.semibold,
              fontFamily: typography.fontFamily
            },
            // 按钮示例
            ...Object.entries(allComponents.buttons).map(([name, config], index) => ({
              type: 'box',
              x: 30 + (index % 4) * 260, y: 80 + Math.floor(index / 4) * 60,
              width: 100, height: 40,
              fill: config.fill,
              stroke: config.stroke,
              strokeWidth: config.strokeWidth,
              cornerRadius: config.cornerRadius,
              shadow: config.shadow,
              children: [
                {
                  type: 'text',
                  x: 50, y: 12,
                  text: name.charAt(0).toUpperCase() + name.slice(1),
                  fill: config.children[0].fill,
                  fontSize: 14,
                  fontWeight: 500,
                  fontFamily: typography.fontFamily,
                  textAlign: 'center'
                }
              ]
            }))
          ]
        },
        
        // 输入框组件展示
        {
          type: 'box',
          x: 60, y: 390,
          width: 540, height: 200,
          fill: '#ffffff',
          cornerRadius: borderRadius.lg,
          shadow: shadows.md,
          children: [
            {
              type: 'text',
              x: 30, y: 30,
              text: '输入框组件 (Inputs)',
              fill: colors.gray[900],
              fontSize: typography.fontSize.xl,
              fontWeight: typography.fontWeight.semibold,
              fontFamily: typography.fontFamily
            },
            {
              type: 'box',
              x: 30, y: 80,
              width: 240, height: 48,
              fill: '#ffffff',
              stroke: colors.gray[300],
              strokeWidth: 1,
              cornerRadius: borderRadius.md,
              children: [
                {
                  type: 'text',
                  x: 16, y: 16,
                  text: '请输入内容...',
                  fill: colors.gray[400],
                  fontSize: typography.fontSize.base,
                  fontFamily: typography.fontFamily
                }
              ]
            }
          ]
        },
        
        // 卡片组件展示
        {
          type: 'box',
          x: 620, y: 390,
          width: 540, height: 200,
          fill: '#ffffff',
          cornerRadius: borderRadius.lg,
          shadow: shadows.md,
          children: [
            {
              type: 'text',
              x: 30, y: 30,
              text: '卡片组件 (Cards)',
              fill: colors.gray[900],
              fontSize: typography.fontSize.xl,
              fontWeight: typography.fontWeight.semibold,
              fontFamily: typography.fontFamily
            },
            {
              type: 'box',
              x: 30, y: 70,
              width: 320, height: 100,
              fill: '#ffffff',
              stroke: colors.gray[200],
              strokeWidth: 1,
              cornerRadius: borderRadius.lg,
              shadow: shadows.sm,
              children: [
                {
                  type: 'text',
                  x: 20, y: 20,
                  text: '卡片标题',
                  fill: colors.gray[900],
                  fontSize: typography.fontSize.lg,
                  fontWeight: typography.fontWeight.semibold,
                  fontFamily: typography.fontFamily
                },
                {
                  type: 'text',
                  x: 20, y: 50,
                  text: '这是卡片的内容描述...',
                  fill: colors.gray[600],
                  fontSize: typography.fontSize.base,
                  fontFamily: typography.fontFamily
                }
              ]
            }
          ]
        },
        
        // 徽章组件展示
        {
          type: 'box',
          x: 60, y: 620,
          width: 540, height: 150,
          fill: '#ffffff',
          cornerRadius: borderRadius.lg,
          shadow: shadows.md,
          children: [
            {
              type: 'text',
              x: 30, y: 30,
              text: '徽章组件 (Badges)',
              fill: colors.gray[900],
              fontSize: typography.fontSize.xl,
              fontWeight: typography.fontWeight.semibold,
              fontFamily: typography.fontFamily
            },
            // 徽章示例
            ...[
              { text: 'Primary', color: colors.primary },
              { text: 'Success', color: colors.success },
              { text: 'Warning', color: colors.warning },
              { text: 'Error', color: colors.error }
            ].map((badge, index) => ({
              type: 'box',
              x: 30 + index * 120, y: 80,
              width: 80, height: 28,
              fill: badge.color,
              cornerRadius: borderRadius.full,
              children: [
                {
                  type: 'text',
                  x: 40, y: 7,
                  text: badge.text,
                  fill: '#ffffff',
                  fontSize: typography.fontSize.xs,
                  fontWeight: typography.fontWeight.medium,
                  fontFamily: typography.fontFamily,
                  textAlign: 'center'
                }
              ]
            }))
          ]
        },
        
        // 进度条组件展示
        {
          type: 'box',
          x: 620, y: 620,
          width: 540, height: 150,
          fill: '#ffffff',
          cornerRadius: borderRadius.lg,
          shadow: shadows.md,
          children: [
            {
              type: 'text',
              x: 30, y: 30,
              text: '进度条组件 (Progress)',
              fill: colors.gray[900],
              fontSize: typography.fontSize.xl,
              fontWeight: typography.fontWeight.semibold,
              fontFamily: typography.fontFamily
            },
            // 进度条背景
            {
              type: 'rect',
              x: 30, y: 70,
              width: 200, height: 8,
              fill: colors.gray[200],
              cornerRadius: borderRadius.full
            },
            // 进度条填充
            {
              type: 'rect',
              x: 30, y: 70,
              width: 130, height: 8,
              fill: colors.primary,
              cornerRadius: borderRadius.full
            },
            {
              type: 'text',
              x: 240, y: 68,
              text: '65%',
              fill: colors.gray[600],
              fontSize: typography.fontSize.sm,
              fontFamily: typography.fontFamily
            }
          ]
        }
      ]
    };
  }
}

/**
 * 主生成器类
 */
class DesignSystemGenerator {
  constructor(options = {}) {
    this.config = new DesignSystemConfig(options);
    this.components = new ComponentGenerator(this.config);
    this.templates = new PageTemplateGenerator(this.config, this.components);
  }
  
  /**
   * 生成完整的设计系统
   */
  generate(options = {}) {
    const output = {
      config: this.config.toJSON(),
      components: this.components.generateAllComponents(),
      templates: {}
    };
    
    // 生成页面模板
    if (options.includeLogin !== false) {
      output.templates.login = this.templates.generateLoginPage();
    }
    
    if (options.includeDashboard !== false) {
      output.templates.dashboard = this.templates.generateDashboardPage();
    }
    
    if (options.includeShowcase !== false) {
      output.templates.showcase = this.templates.generateComponentShowcase();
    }
    
    return output;
  }
  
  /**
   * 导出为文件
   */
  export(outputDir = './design-system') {
    // 创建输出目录
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // 生成设计系统
    const designSystem = this.generate();
    
    // 保存配置文件
    this.config.save(outputDir);
    
    // 保存组件库
    const componentsPath = path.join(outputDir, 'components.json');
    fs.writeFileSync(componentsPath, JSON.stringify(designSystem.components, null, 2));
    console.log(`[Design System] Components saved to: ${componentsPath}`);
    
    // 保存模板
    const templatesDir = path.join(outputDir, 'templates');
    if (!fs.existsSync(templatesDir)) {
      fs.mkdirSync(templatesDir, { recursive: true });
    }
    
    Object.entries(designSystem.templates).forEach(([name, template]) => {
      const templatePath = path.join(templatesDir, `${name}.json`);
      fs.writeFileSync(templatePath, JSON.stringify(template, null, 2));
      console.log(`[Design System] Template "${name}" saved to: ${templatePath}`);
    });
    
    console.log(`\n✅ Design system generated successfully at: ${outputDir}`);
    return designSystem;
  }
  
  /**
   * 渲染模板为图片（通过 MCP 服务）
   */
  async renderTemplate(templateName, mcpServiceUrl = 'http://localhost:3001') {
    const template = this.templates[`generate${templateName.charAt(0).toUpperCase() + templateName.slice(1)}Page`]?.();
    
    if (!template) {
      throw new Error(`Template "${templateName}" not found`);
    }
    
    // 这里可以通过 HTTP 请求发送到 MCP 服务进行渲染
    // 返回渲染后的图片 URL
    return {
      template: templateName,
      data: template,
      renderUrl: `${mcpServiceUrl}/api/v1/ui/render`
    };
  }
}

// 导出模块
module.exports = {
  DesignSystemGenerator,
  DesignSystemConfig,
  ComponentGenerator,
  PageTemplateGenerator
};

// CLI 支持
if (require.main === module) {
  const generator = new DesignSystemGenerator({
    name: 'My Awesome Design System',
    primaryColor: '#667eea',
    secondaryColor: '#764ba2'
  });
  
  generator.export('./my-design-system');
}
