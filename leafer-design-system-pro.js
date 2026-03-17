/**
 * LeaferJS 设计系统生成器 Pro 版
 * 
 * 增强功能：
 * - 更多组件（表格、模态框、下拉菜单、标签页、开关、单选/复选框）
 * - 暗黑模式支持
 * - 响应式设计
 * - 交互热点支持
 */

const fs = require('fs');
const path = require('path');

/**
 * 主题配置类 - 支持亮色/暗色模式
 */
class ThemeConfig {
  constructor(options = {}) {
    this.mode = options.mode || 'light';
    this.name = options.name || 'My Design System';
    
    // 基础颜色配置
    this.colors = {
      light: {
        primary: options.primaryColor || '#667eea',
        secondary: options.secondaryColor || '#764ba2',
        success: '#48bb78',
        warning: '#ed8936',
        error: '#f56565',
        info: '#4299e1',
        background: '#ffffff',
        surface: '#f9fafb',
        border: '#e5e7eb',
        text: {
          primary: '#111827',
          secondary: '#6b7280',
          disabled: '#9ca3af',
          inverse: '#ffffff'
        }
      },
      dark: {
        primary: '#818cf8',
        secondary: '#a78bfa',
        success: '#34d399',
        warning: '#fbbf24',
        error: '#f87171',
        info: '#60a5fa',
        background: '#111827',
        surface: '#1f2937',
        border: '#374151',
        text: {
          primary: '#f9fafb',
          secondary: '#d1d5db',
          disabled: '#6b7280',
          inverse: '#111827'
        }
      }
    };
    
    // 字体配置
    this.typography = {
      fontFamily: options.fontFamily || 'Microsoft YaHei',
      fontSize: {
        xs: 12, sm: 14, base: 16, lg: 18, xl: 20,
        '2xl': 24, '3xl': 30, '4xl': 36
      },
      fontWeight: {
        light: 300, normal: 400, medium: 500,
        semibold: 600, bold: 700
      }
    };
    
    // 间距配置
    this.spacing = {
      0: 0, 1: 4, 2: 8, 3: 12, 4: 16, 5: 20,
      6: 24, 8: 32, 10: 40, 12: 48, 16: 64
    };
    
    // 圆角配置
    this.borderRadius = {
      none: 0, sm: 2, md: 4, lg: 8, xl: 12, '2xl': 16, full: 9999
    };
    
    // 阴影配置
    this.shadows = {
      sm: { x: 0, y: 1, blur: 2, color: '#0000000d' },
      md: { x: 0, y: 4, blur: 6, color: '#0000001a' },
      lg: { x: 0, y: 10, blur: 15, color: '#00000026' },
      xl: { x: 0, y: 20, blur: 25, color: '#00000026' }
    };
  }
  
  getColors() {
    return this.colors[this.mode];
  }
  
  setMode(mode) {
    this.mode = mode;
  }
}

/**
 * 高级组件生成器
 */
class AdvancedComponentGenerator {
  constructor(config) {
    this.config = config;
    this.colors = config.getColors();
  }
  
  // 生成表格
  generateTable(headers, rows, options = {}) {
    const { width = 600, rowHeight = 40 } = options;
    const colors = this.colors;
    
    const elements = [];
    
    // 表头背景
    elements.push({
      type: 'box',
      x: 0, y: 0, width, height: rowHeight,
      fill: colors.surface,
      cornerRadius: { topLeft: 8, topRight: 8 }
    });
    
    // 表头文字
    const colWidth = width / headers.length;
    headers.forEach((header, i) => {
      elements.push({
        type: 'text',
        x: i * colWidth + 16,
        y: 12,
        text: header,
        fill: colors.text.primary,
        fontSize: 14,
        fontWeight: 600,
        fontFamily: this.config.typography.fontFamily
      });
    });
    
    // 数据行
    rows.forEach((row, rowIndex) => {
      const y = (rowIndex + 1) * rowHeight;
      const isEven = rowIndex % 2 === 0;
      
      // 行背景
      elements.push({
        type: 'box',
        x: 0, y, width, height: rowHeight,
        fill: isEven ? colors.background : colors.surface
      });
      
      // 行数据
      row.forEach((cell, cellIndex) => {
        elements.push({
          type: 'text',
          x: cellIndex * colWidth + 16,
          y: y + 12,
          text: String(cell),
          fill: colors.text.secondary,
          fontSize: 14,
          fontFamily: this.config.typography.fontFamily
        });
      });
    });
    
    // 底部边框
    elements.push({
      type: 'box',
      x: 0, y: (rows.length + 1) * rowHeight - 1,
      width, height: 1,
      fill: colors.border
    });
    
    return {
      type: 'group',
      x: options.x || 0,
      y: options.y || 0,
      children: elements
    };
  }
  
  // 生成模态框
  generateModal(title, content, options = {}) {
    const { width = 480 } = options;
    const colors = this.colors;
    
    return {
      type: 'group',
      x: options.x || 0,
      y: options.y || 0,
      children: [
        // 遮罩层
        {
          type: 'rect',
          x: -1000, y: -1000,
          width: 3000, height: 3000,
          fill: '#00000080'
        },
        // 模态框背景
        {
          type: 'box',
          x: 0, y: 0, width, height: 200,
          fill: colors.background,
          cornerRadius: 12,
          shadow: this.config.shadows.xl
        },
        // 标题
        {
          type: 'text',
          x: 24, y: 20,
          text: title,
          fill: colors.text.primary,
          fontSize: 18,
          fontWeight: 600,
          fontFamily: this.config.typography.fontFamily
        },
        // 关闭按钮
        {
          type: 'text',
          x: width - 40, y: 20,
          text: '✕',
          fill: colors.text.secondary,
          fontSize: 20
        },
        // 分隔线
        {
          type: 'rect',
          x: 0, y: 56, width, height: 1,
          fill: colors.border
        },
        // 内容
        {
          type: 'text',
          x: 24, y: 76,
          text: content,
          fill: colors.text.secondary,
          fontSize: 14,
          fontFamily: this.config.typography.fontFamily
        },
        // 按钮组
        {
          type: 'box',
          x: width - 180, y: 140,
          width: 80, height: 36,
          fill: colors.surface,
          cornerRadius: 6,
          children: [{
            type: 'text',
            x: 24, y: 10,
            text: '取消',
            fill: colors.text.secondary,
            fontSize: 14,
            fontFamily: this.config.typography.fontFamily
          }]
        },
        {
          type: 'box',
          x: width - 90, y: 140,
          width: 70, height: 36,
          fill: colors.primary,
          cornerRadius: 6,
          children: [{
            type: 'text',
            x: 24, y: 10,
            text: '确认',
            fill: colors.text.inverse,
            fontSize: 14,
            fontFamily: this.config.typography.fontFamily
          }]
        }
      ]
    };
  }
  
  // 生成下拉菜单
  generateDropdown(label, items, options = {}) {
    const { width = 200 } = options;
    const colors = this.colors;
    const itemHeight = 36;
    
    const children = [
      // 触发按钮
      {
        type: 'box',
        x: 0, y: 0, width, height: 40,
        fill: colors.background,
        stroke: colors.border,
        strokeWidth: 1,
        cornerRadius: 6,
        children: [
          {
            type: 'text',
            x: 12, y: 12,
            text: label,
            fill: colors.text.primary,
            fontSize: 14,
            fontFamily: this.config.typography.fontFamily
          },
          {
            type: 'text',
            x: width - 24, y: 12,
            text: '▼',
            fill: colors.text.secondary,
            fontSize: 10
          }
        ]
      }
    ];
    
    // 下拉列表
    if (options.isOpen) {
      children.push({
        type: 'box',
        x: 0, y: 44, width,
        height: items.length * itemHeight + 8,
        fill: colors.background,
        cornerRadius: 6,
        shadow: this.config.shadows.lg
      });
      
      items.forEach((item, i) => {
        children.push({
          type: 'box',
          x: 4, y: 48 + i * itemHeight,
          width: width - 8, height: itemHeight,
          fill: item.selected ? colors.primary + '15' : colors.background,
          cornerRadius: 4,
          children: [{
            type: 'text',
            x: 12, y: 10,
            text: item.label,
            fill: item.selected ? colors.primary : colors.text.primary,
            fontSize: 14,
            fontFamily: this.config.typography.fontFamily
          }]
        });
      });
    }
    
    return {
      type: 'group',
      x: options.x || 0,
      y: options.y || 0,
      children
    };
  }
  
  // 生成标签页
  generateTabs(tabs, activeIndex = 0, options = {}) {
    const colors = this.colors;
    const tabWidth = options.tabWidth || 100;
    const height = 40;
    
    const children = [];
    
    tabs.forEach((tab, i) => {
      const isActive = i === activeIndex;
      const x = i * tabWidth;
      
      // 标签背景
      children.push({
        type: 'box',
        x, y: 0,
        width: tabWidth, height,
        fill: isActive ? colors.background : colors.surface,
        children: [
          {
            type: 'text',
            x: tabWidth / 2, y: 12,
            text: tab,
            fill: isActive ? colors.primary : colors.text.secondary,
            fontSize: 14,
            fontWeight: isActive ? 500 : 400,
            fontFamily: this.config.typography.fontFamily,
            textAlign: 'center'
          }
        ]
      });
      
      // 激活指示器
      if (isActive) {
        children.push({
          type: 'rect',
          x, y: height - 2,
          width: tabWidth, height: 2,
          fill: colors.primary
        });
      }
    });
    
    // 底部边框
    children.push({
      type: 'rect',
      x: 0, y: height,
      width: tabs.length * tabWidth, height: 1,
      fill: colors.border
    });
    
    return {
      type: 'group',
      x: options.x || 0,
      y: options.y || 0,
      children
    };
  }
  
  // 生成开关
  generateSwitch(isOn = false, options = {}) {
    const colors = this.colors;
    const width = 44;
    const height = 24;
    
    return {
      type: 'group',
      x: options.x || 0,
      y: options.y || 0,
      children: [
        // 轨道
        {
          type: 'box',
          x: 0, y: 0, width, height,
          fill: isOn ? colors.primary : colors.border,
          cornerRadius: height / 2
        },
        // 滑块
        {
          type: 'ellipse',
          x: isOn ? width - height + 2 : 2,
          y: 2,
          width: height - 4, height: height - 4,
          fill: colors.background
        }
      ]
    };
  }
  
  // 生成复选框
  generateCheckbox(checked = false, label = '', options = {}) {
    const colors = this.colors;
    const size = 18;
    
    const children = [
      // 复选框
      {
        type: 'box',
        x: 0, y: 0, width: size, height: size,
        fill: checked ? colors.primary : colors.background,
        stroke: checked ? colors.primary : colors.border,
        strokeWidth: 2,
        cornerRadius: 4
      }
    ];
    
    // 勾选标记
    if (checked) {
      children.push({
        type: 'text',
        x: 4, y: 2,
        text: '✓',
        fill: colors.text.inverse,
        fontSize: 12,
        fontWeight: 'bold'
      });
    }
    
    // 标签
    if (label) {
      children.push({
        type: 'text',
        x: size + 8, y: 2,
        text: label,
        fill: colors.text.primary,
        fontSize: 14,
        fontFamily: this.config.typography.fontFamily
      });
    }
    
    return {
      type: 'group',
      x: options.x || 0,
      y: options.y || 0,
      children
    };
  }
  
  // 生成单选按钮
  generateRadio(selected = false, label = '', options = {}) {
    const colors = this.colors;
    const size = 18;
    
    const children = [
      // 外圆
      {
        type: 'ellipse',
        x: 0, y: 0, width: size, height: size,
        fill: colors.background,
        stroke: selected ? colors.primary : colors.border,
        strokeWidth: 2
      }
    ];
    
    // 内圆（选中状态）
    if (selected) {
      children.push({
        type: 'ellipse',
        x: 5, y: 5,
        width: size - 10, height: size - 10,
        fill: colors.primary
      });
    }
    
    // 标签
    if (label) {
      children.push({
        type: 'text',
        x: size + 8, y: 2,
        text: label,
        fill: colors.text.primary,
        fontSize: 14,
        fontFamily: this.config.typography.fontFamily
      });
    }
    
    return {
      type: 'group',
      x: options.x || 0,
      y: options.y || 0,
      children
    };
  }
}

/**
 * 响应式模板生成器
 */
class ResponsiveTemplateGenerator {
  constructor(config) {
    this.config = config;
    this.componentGen = new AdvancedComponentGenerator(config);
  }
  
  // 移动端登录页
  generateMobileLoginPage() {
    const colors = this.config.getColors();
    const w = 375; // iPhone 宽度
    const h = 812; // iPhone 高度
    
    return {
      width: w,
      height: h,
      backgroundColor: colors.background,
      elements: [
        // 状态栏
        {
          type: 'rect',
          x: 0, y: 0, width: w, height: 44,
          fill: colors.background
        },
        {
          type: 'text',
          x: w / 2, y: 14,
          text: '9:41',
          fill: colors.text.primary,
          fontSize: 14,
          fontWeight: 600,
          textAlign: 'center'
        },
        // Logo区域
        {
          type: 'ellipse',
          x: w / 2 - 40, y: 120,
          width: 80, height: 80,
          fill: { type: 'linear', stops: [colors.primary, colors.secondary] }
        },
        {
          type: 'text',
          x: w / 2, y: 220,
          text: '欢迎回来',
          fill: colors.text.primary,
          fontSize: 24,
          fontWeight: 700,
          textAlign: 'center',
          fontFamily: this.config.typography.fontFamily
        },
        // 输入框
        {
          type: 'box',
          x: 24, y: 280, width: w - 48, height: 48,
          fill: colors.surface,
          cornerRadius: 8,
          children: [{
            type: 'text',
            x: 16, y: 16,
            text: '手机号/邮箱',
            fill: colors.text.disabled,
            fontSize: 14,
            fontFamily: this.config.typography.fontFamily
          }]
        },
        {
          type: 'box',
          x: 24, y: 340, width: w - 48, height: 48,
          fill: colors.surface,
          cornerRadius: 8,
          children: [{
            type: 'text',
            x: 16, y: 16,
            text: '密码',
            fill: colors.text.disabled,
            fontSize: 14,
            fontFamily: this.config.typography.fontFamily
          }]
        },
        // 登录按钮
        {
          type: 'box',
          x: 24, y: 420, width: w - 48, height: 48,
          fill: colors.primary,
          cornerRadius: 8,
          children: [{
            type: 'text',
            x: (w - 48) / 2, y: 16,
            text: '登录',
            fill: colors.text.inverse,
            fontSize: 16,
            fontWeight: 600,
            textAlign: 'center',
            fontFamily: this.config.typography.fontFamily
          }]
        },
        // 其他登录方式
        {
          type: 'text',
          x: w / 2, y: 500,
          text: '其他登录方式',
          fill: colors.text.secondary,
          fontSize: 12,
          textAlign: 'center',
          fontFamily: this.config.typography.fontFamily
        },
        // 社交登录图标
        {
          type: 'ellipse',
          x: w / 2 - 60, y: 540, width: 40, height: 40,
          fill: '#07C160'
        },
        {
          type: 'ellipse',
          x: w / 2 - 20, y: 540, width: 40, height: 40,
          fill: '#FA5151'
        },
        {
          type: 'ellipse',
          x: w / 2 + 20, y: 540, width: 40, height: 40,
          fill: '#10AEFF'
        },
        // 底部导航栏
        {
          type: 'rect',
          x: 0, y: h - 34, width: w, height: 34,
          fill: colors.background
        }
      ]
    };
  }
  
  // 移动端首页
  generateMobileHomePage() {
    const colors = this.config.getColors();
    const w = 375;
    const h = 812;
    
    return {
      width: w,
      height: h,
      backgroundColor: colors.surface,
      elements: [
        // 状态栏
        { type: 'rect', x: 0, y: 0, width: w, height: 44, fill: colors.background },
        // 搜索栏
        {
          type: 'box',
          x: 16, y: 54, width: w - 32, height: 36,
          fill: colors.surface,
          cornerRadius: 18,
          children: [{
            type: 'text',
            x: 40, y: 10,
            text: '搜索商品、品牌',
            fill: colors.text.disabled,
            fontSize: 14,
            fontFamily: this.config.typography.fontFamily
          }]
        },
        // Banner
        {
          type: 'box',
          x: 16, y: 102, width: w - 32, height: 120,
          fill: { type: 'linear', stops: [colors.primary, colors.secondary] },
          cornerRadius: 12
        },
        // 分类图标
        ...[0, 1, 2, 3, 4].map(i => ({
          type: 'ellipse',
          x: 30 + i * 65, y: 240,
          width: 48, height: 48,
          fill: colors.primary + '20'
        })),
        // 商品卡片
        ...[0, 1].map(row => ({
          type: 'box',
          x: 16 + row * 175, y: 320,
          width: 163, height: 220,
          fill: colors.background,
          cornerRadius: 8,
          shadow: this.config.shadows.sm,
          children: [
            {
              type: 'box',
              x: 0, y: 0, width: 163, height: 163,
              fill: colors.surface,
              cornerRadius: { topLeft: 8, topRight: 8 }
            },
            {
              type: 'text',
              x: 12, y: 175,
              text: '商品名称',
              fill: colors.text.primary,
              fontSize: 14,
              fontFamily: this.config.typography.fontFamily
            },
            {
              type: 'text',
              x: 12, y: 195,
              text: '¥199',
              fill: colors.error,
              fontSize: 16,
              fontWeight: 600,
              fontFamily: this.config.typography.fontFamily
            }
          ]
        })),
        // 底部导航
        {
          type: 'rect',
          x: 0, y: h - 80, width: w, height: 80,
          fill: colors.background,
          shadow: { x: 0, y: -2, blur: 8, color: '#0000000d' }
        },
        ...['首页', '分类', '购物车', '我的'].map((tab, i) => ({
          type: 'text',
          x: w / 8 + i * (w / 4), y: h - 45,
          text: tab,
          fill: i === 0 ? colors.primary : colors.text.secondary,
          fontSize: 12,
          textAlign: 'center',
          fontFamily: this.config.typography.fontFamily
        }))
      ]
    };
  }
  
  // 平板布局仪表盘
  generateTabletDashboard() {
    const colors = this.config.getColors();
    const w = 1024;
    const h = 768;
    
    return {
      width: w,
      height: h,
      backgroundColor: colors.surface,
      elements: [
        // 侧边栏
        {
          type: 'box',
          x: 0, y: 0, width: 200, height: h,
          fill: colors.background,
          shadow: { x: 2, y: 0, blur: 8, color: '#0000000d' }
        },
        {
          type: 'text',
          x: 24, y: 24,
          text: 'Admin',
          fill: colors.text.primary,
          fontSize: 20,
          fontWeight: 700,
          fontFamily: this.config.typography.fontFamily
        },
        // 顶部栏
        {
          type: 'rect',
          x: 200, y: 0, width: w - 200, height: 60,
          fill: colors.background
        },
        // 统计卡片
        ...[0, 1, 2, 3].map(i => ({
          type: 'box',
          x: 220 + (i % 2) * 390, y: 80 + Math.floor(i / 2) * 140,
          width: 370, height: 120,
          fill: colors.background,
          cornerRadius: 8,
          shadow: this.config.shadows.sm
        })),
        // 图表区域
        {
          type: 'box',
          x: 220, y: 360, width: 560, height: 380,
          fill: colors.background,
          cornerRadius: 8,
          shadow: this.config.shadows.sm
        },
        // 列表区域
        {
          type: 'box',
          x: 800, y: 360, width: 204, height: 380,
          fill: colors.background,
          cornerRadius: 8,
          shadow: this.config.shadows.sm
        }
      ]
    };
  }
}

/**
 * 主生成器类
 */
class DesignSystemProGenerator {
  constructor(options = {}) {
    this.config = new ThemeConfig(options);
    this.componentGen = new AdvancedComponentGenerator(this.config);
    this.templateGen = new ResponsiveTemplateGenerator(this.config);
    this.templates = {};
  }
  
  // 生成完整设计系统
  generate() {
    return {
      name: this.config.name,
      version: '2.0.0',
      theme: {
        light: this.config.colors.light,
        dark: this.config.colors.dark
      },
      typography: this.config.typography,
      spacing: this.config.spacing,
      borderRadius: this.config.borderRadius,
      shadows: this.config.shadows,
      components: this.generateAllComponents(),
      templates: this.generateAllTemplates()
    };
  }
  
  generateAllComponents() {
    const colors = this.config.getColors();
    
    return {
      // 基础组件
      buttons: this.generateButtonVariants(),
      inputs: this.generateInputVariants(),
      
      // 高级组件
      table: this.componentGen.generateTable(
        ['姓名', '邮箱', '角色', '状态'],
        [
          ['张三', 'zhangsan@example.com', '管理员', '活跃'],
          ['李四', 'lisi@example.com', '编辑', '活跃'],
          ['王五', 'wangwu@example.com', '访客', '离线']
        ],
        { width: 600 }
      ),
      modal: this.componentGen.generateModal(
        '确认删除',
        '确定要删除这条记录吗？此操作不可撤销。'
      ),
      dropdown: this.componentGen.generateDropdown(
        '请选择',
        [
          { label: '选项一', selected: false },
          { label: '选项二', selected: true },
          { label: '选项三', selected: false }
        ],
        { isOpen: true }
      ),
      tabs: this.componentGen.generateTabs(
        ['基本信息', '安全设置', '通知偏好'],
        0
      ),
      switch: this.componentGen.generateSwitch(true),
      checkbox: this.componentGen.generateCheckbox(true, '记住我'),
      radio: this.componentGen.generateRadio(true, '选项A')
    };
  }
  
  generateButtonVariants() {
    const variants = ['primary', 'secondary', 'success', 'warning', 'error', 'ghost', 'outline'];
    return variants.map((variant, i) => ({
      type: 'group',
      x: i * 120,
      y: 0,
      children: this.generateButton(variant, 'md', variant)
    }));
  }
  
  generateInputVariants() {
    const states = ['default', 'focused', 'error', 'disabled'];
    return states.map((state, i) => ({
      type: 'group',
      x: 0,
      y: i * 60,
      children: this.generateInput(state)
    }));
  }
  
  generateButton(variant, size, text) {
    // 复用之前的按钮生成逻辑
    const colors = this.config.getColors();
    const variantConfig = {
      primary: { fill: colors.primary, textColor: colors.text.inverse },
      secondary: { fill: colors.secondary, textColor: colors.text.inverse },
      success: { fill: colors.success, textColor: colors.text.inverse },
      warning: { fill: colors.warning, textColor: colors.text.inverse },
      error: { fill: colors.error, textColor: colors.text.inverse },
      ghost: { fill: 'transparent', textColor: colors.text.primary },
      outline: { fill: 'transparent', textColor: colors.primary }
    };
    
    const config = variantConfig[variant] || variantConfig.primary;
    
    return [{
      type: 'box',
      x: 0, y: 0, width: 100, height: 40,
      fill: config.fill,
      stroke: variant === 'outline' ? colors.primary : undefined,
      strokeWidth: variant === 'outline' ? 1 : 0,
      cornerRadius: 6,
      children: [{
        type: 'text',
        x: 50, y: 12,
        text: text || variant,
        fill: config.textColor,
        fontSize: 14,
        textAlign: 'center',
        fontFamily: this.config.typography.fontFamily
      }]
    }];
  }
  
  generateInput(state) {
    const colors = this.config.getColors();
    const stateConfig = {
      default: { stroke: colors.border },
      focused: { stroke: colors.primary },
      error: { stroke: colors.error },
      disabled: { stroke: colors.border, fill: colors.surface }
    };
    
    const config = stateConfig[state] || stateConfig.default;
    
    return [{
      type: 'box',
      x: 0, y: 0, width: 240, height: 40,
      fill: config.fill || colors.background,
      stroke: config.stroke,
      strokeWidth: 1,
      cornerRadius: 6,
      children: [{
        type: 'text',
        x: 12, y: 12,
        text: state === 'disabled' ? '禁用状态' : '请输入内容...',
        fill: state === 'disabled' ? colors.text.disabled : colors.text.secondary,
        fontSize: 14,
        fontFamily: this.config.typography.fontFamily
      }]
    }];
  }
  
  generateAllTemplates() {
    return {
      // 桌面端
      desktop: {
        login: this.generateLoginPage(),
        dashboard: this.generateDashboardPage(),
        showcase: this.generateShowcasePage()
      },
      // 移动端
      mobile: {
        login: this.templateGen.generateMobileLoginPage(),
        home: this.templateGen.generateMobileHomePage()
      },
      // 平板
      tablet: {
        dashboard: this.templateGen.generateTabletDashboard()
      }
    };
  }
  
  generateLoginPage() {
    // 复用之前的登录页生成逻辑
    return this.templateGen.generateMobileLoginPage();
  }
  
  generateDashboardPage() {
    return this.templateGen.generateTabletDashboard();
  }
  
  generateShowcasePage() {
    const colors = this.config.getColors();
    const w = 1200;
    const h = 1600;
    
    return {
      width: w,
      height: h,
      backgroundColor: colors.surface,
      elements: [
        // 标题
        {
          type: 'text',
          x: 40, y: 40,
          text: this.config.name,
          fill: colors.text.primary,
          fontSize: 32,
          fontWeight: 700,
          fontFamily: this.config.typography.fontFamily
        },
        {
          type: 'text',
          x: 40, y: 80,
          text: '版本 2.0.0 | 组件库展示',
          fill: colors.text.secondary,
          fontSize: 14,
          fontFamily: this.config.typography.fontFamily
        },
        // 按钮展示
        {
          type: 'text',
          x: 40, y: 140,
          text: '按钮组件 (Buttons)',
          fill: colors.text.primary,
          fontSize: 18,
          fontWeight: 600,
          fontFamily: this.config.typography.fontFamily
        },
        ...['primary', 'secondary', 'success', 'warning', 'error', 'ghost', 'outline'].map((variant, i) => ({
          type: 'box',
          x: 40 + (i % 4) * 140, y: 180 + Math.floor(i / 4) * 60,
          width: 120, height: 40,
          fill: variant === 'outline' ? 'transparent' : 
                variant === 'ghost' ? 'transparent' :
                colors[variant] || colors.primary,
          stroke: variant === 'outline' ? colors.primary : undefined,
          strokeWidth: variant === 'outline' ? 1 : 0,
          cornerRadius: 6,
          children: [{
            type: 'text',
            x: 60, y: 12,
            text: variant.charAt(0).toUpperCase() + variant.slice(1),
            fill: variant === 'ghost' ? colors.text.primary :
                  variant === 'outline' ? colors.primary :
                  colors.text.inverse,
            fontSize: 14,
            textAlign: 'center',
            fontFamily: this.config.typography.fontFamily
          }]
        })),
        // 表单组件展示
        {
          type: 'text',
          x: 40, y: 320,
          text: '表单组件 (Form Elements)',
          fill: colors.text.primary,
          fontSize: 18,
          fontWeight: 600,
          fontFamily: this.config.typography.fontFamily
        },
        // 开关
        {
          type: 'text',
          x: 40, y: 360,
          text: '开关:',
          fill: colors.text.secondary,
          fontSize: 14,
          fontFamily: this.config.typography.fontFamily
        },
        {
          type: 'group',
          x: 100, y: 358,
          children: this.componentGen.generateSwitch(true).children
        },
        // 复选框
        {
          type: 'text',
          x: 40, y: 400,
          text: '复选框:',
          fill: colors.text.secondary,
          fontSize: 14,
          fontFamily: this.config.typography.fontFamily
        },
        {
          type: 'group',
          x: 100, y: 398,
          children: this.componentGen.generateCheckbox(true, '选项').children
        },
        // 单选
        {
          type: 'text',
          x: 40, y: 440,
          text: '单选:',
          fill: colors.text.secondary,
          fontSize: 14,
          fontFamily: this.config.typography.fontFamily
        },
        {
          type: 'group',
          x: 100, y: 438,
          children: this.componentGen.generateRadio(true, '选项').children
        }
      ]
    };
  }
  
  // 导出设计系统
  export(outputDir) {
    const designSystem = this.generate();
    
    // 确保输出目录存在
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // 保存设计系统配置
    fs.writeFileSync(
      path.join(outputDir, 'design-system-pro.json'),
      JSON.stringify(designSystem, null, 2)
    );
    
    // 保存各个模板
    const templatesDir = path.join(outputDir, 'templates');
    if (!fs.existsSync(templatesDir)) {
      fs.mkdirSync(templatesDir, { recursive: true });
    }
    
    // 导出桌面端模板
    Object.entries(designSystem.templates.desktop).forEach(([name, template]) => {
      fs.writeFileSync(
        path.join(templatesDir, `desktop-${name}.json`),
        JSON.stringify(template, null, 2)
      );
    });
    
    // 导出移动端模板
    Object.entries(designSystem.templates.mobile).forEach(([name, template]) => {
      fs.writeFileSync(
        path.join(templatesDir, `mobile-${name}.json`),
        JSON.stringify(template, null, 2)
      );
    });
    
    // 导出平板模板
    Object.entries(designSystem.templates.tablet).forEach(([name, template]) => {
      fs.writeFileSync(
        path.join(templatesDir, `tablet-${name}.json`),
        JSON.stringify(template, null, 2)
      );
    });
    
    console.log(`\n✅ Pro 设计系统已导出到: ${outputDir}`);
    console.log(`📁 包含 ${Object.keys(designSystem.templates).length} 个设备类型的模板`);
    
    return designSystem;
  }
}

// 导出模块
module.exports = {
  DesignSystemProGenerator,
  ThemeConfig,
  AdvancedComponentGenerator,
  ResponsiveTemplateGenerator
};

// CLI 支持
if (require.main === module) {
  const generator = new DesignSystemProGenerator({
    name: 'Pro Design System',
    primaryColor: '#667eea',
    secondaryColor: '#764ba2'
  });
  
  generator.export('./my-design-system-pro');
}
