/**
 * LeaferJS AI 布局插件 V2
 * 
 * 增强功能：
 * - 智能响应式布局
 * - 自动适配不同屏幕尺寸
 * - 支持约束布局（Constraint Layout）
 * - 支持堆栈布局（Stack Layout）增强版
 * - 自动间距计算
 * 
 * 贡献给 LeaferJS 社区
 * @author Leafer Design System Team
 * @version 2.0.0
 * @license MIT
 */

const { Leafer, Box, Rect, Text } = require('@leafer-ui/core');

/**
 * AI 布局插件 V2
 */
class AILayoutPluginV2 {
  constructor(leafer) {
    this.leafer = leafer;
    this.name = 'AILayoutV2';
    this.version = '2.0.0';
    
    // 断点配置
    this.breakpoints = {
      mobile: { max: 480 },
      tablet: { min: 481, max: 768 },
      desktop: { min: 769, max: 1024 },
      large: { min: 1025 }
    };
    
    // 当前断点
    this.currentBreakpoint = 'desktop';
    
    // 监听画布大小变化
    this.setupResizeListener();
  }
  
  /**
   * 设置大小变化监听
   */
  setupResizeListener() {
    if (this.leafer && this.leafer.canvas) {
      const resizeObserver = new ResizeObserver((entries) => {
        for (let entry of entries) {
          const { width } = entry.contentRect;
          this.updateBreakpoint(width);
          this.applyResponsiveLayout();
        }
      });
      
      resizeObserver.observe(this.leafer.canvas.view);
    }
  }
  
  /**
   * 更新当前断点
   */
  updateBreakpoint(width) {
    if (width <= this.breakpoints.mobile.max) {
      this.currentBreakpoint = 'mobile';
    } else if (width <= this.breakpoints.tablet.max) {
      this.currentBreakpoint = 'tablet';
    } else if (width <= this.breakpoints.desktop.max) {
      this.currentBreakpoint = 'desktop';
    } else {
      this.currentBreakpoint = 'large';
    }
  }
  
  /**
   * 应用响应式布局
   */
  applyResponsiveLayout() {
    this.leafer.children.forEach(child => {
      if (child.layoutConfig && child.layoutConfig.responsive) {
        this.applyResponsiveConfig(child);
      }
    });
  }
  
  /**
   * 应用响应式配置
   */
  applyResponsiveConfig(element) {
    const config = element.layoutConfig.responsive[this.currentBreakpoint];
    if (config) {
      if (config.x !== undefined) element.x = config.x;
      if (config.y !== undefined) element.y = config.y;
      if (config.width !== undefined) element.width = config.width;
      if (config.height !== undefined) element.height = config.height;
      if (config.scale !== undefined) element.scale = config.scale;
    }
  }
  
  /**
   * 约束布局 - 类似 iOS Auto Layout
   * @param {Object} config - 布局配置
   */
  constraintLayout(config) {
    const {
      container,
      items,
      padding = { top: 0, left: 0, right: 0, bottom: 0 },
      spacing = 10
    } = config;
    
    const containerWidth = container.width - padding.left - padding.right;
    const containerHeight = container.height - padding.top - padding.bottom;
    
    let currentY = padding.top;
    
    items.forEach((item, index) => {
      const element = item.element;
      const constraints = item.constraints || {};
      
      // 应用约束
      if (constraints.top !== undefined) {
        element.y = padding.top + constraints.top;
      } else if (constraints.bottom !== undefined) {
        element.y = container.height - padding.bottom - element.height - constraints.bottom;
      } else if (index === 0) {
        element.y = currentY;
      } else {
        element.y = currentY + spacing;
      }
      
      if (constraints.left !== undefined) {
        element.x = padding.left + constraints.left;
      } else if (constraints.right !== undefined) {
        element.x = container.width - padding.right - element.width - constraints.right;
      } else if (constraints.centerX) {
        element.x = (container.width - element.width) / 2;
      }
      
      if (constraints.centerY) {
        element.y = (container.height - element.height) / 2;
      }
      
      // 宽度约束
      if (constraints.width === 'fill') {
        element.width = containerWidth - (constraints.left || 0) - (constraints.right || 0);
      }
      
      currentY = element.y + element.height;
    });
  }
  
  /**
   * 智能网格布局
   * @param {Object} config - 布局配置
   */
  smartGridLayout(config) {
    const {
      container,
      items,
      columns = 3,
      spacing = 10,
      padding = 10,
      aspectRatio = 1 // 宽高比
    } = config;
    
    const containerWidth = container.width - padding * 2;
    const itemWidth = (containerWidth - spacing * (columns - 1)) / columns;
    const itemHeight = itemWidth / aspectRatio;
    
    items.forEach((item, index) => {
      const row = Math.floor(index / columns);
      const col = index % columns;
      
      item.x = padding + col * (itemWidth + spacing);
      item.y = padding + row * (itemHeight + spacing);
      item.width = itemWidth;
      item.height = itemHeight;
    });
    
    // 返回总高度
    const rows = Math.ceil(items.length / columns);
    return padding * 2 + rows * itemHeight + (rows - 1) * spacing;
  }
  
  /**
   * 瀑布流布局
   * @param {Object} config - 布局配置
   */
  waterfallLayout(config) {
    const {
      container,
      items,
      columns = 3,
      spacing = 10,
      padding = 10
    } = config;
    
    const containerWidth = container.width - padding * 2;
    const itemWidth = (containerWidth - spacing * (columns - 1)) / columns;
    
    // 每列的高度
    const columnHeights = new Array(columns).fill(padding);
    
    items.forEach((item) => {
      // 找到最短的列
      const shortestCol = columnHeights.indexOf(Math.min(...columnHeights));
      
      item.x = padding + shortestCol * (itemWidth + spacing);
      item.y = columnHeights[shortestCol];
      item.width = itemWidth;
      
      // 更新列高度
      columnHeights[shortestCol] += item.height + spacing;
    });
    
    // 返回总高度
    return Math.max(...columnHeights) + padding - spacing;
  }
  
  /**
   * 弹性堆栈布局 - 增强版
   * @param {Object} config - 布局配置
   */
  flexStackLayout(config) {
    const {
      container,
      items,
      direction = 'vertical', // 'vertical' | 'horizontal'
      justifyContent = 'start', // 'start' | 'center' | 'end' | 'space-between' | 'space-around'
      alignItems = 'start', // 'start' | 'center' | 'end' | 'stretch'
      spacing = 10,
      padding = 10
    } = config;
    
    const isVertical = direction === 'vertical';
    const containerSize = isVertical ? container.height : container.width;
    const containerCrossSize = isVertical ? container.width : container.height;
    
    // 计算内容总大小
    const contentSize = items.reduce((sum, item) => {
      return sum + (isVertical ? item.height : item.width);
    }, 0) + spacing * (items.length - 1);
    
    // 计算起始位置
    let startPos = padding;
    if (justifyContent === 'center') {
      startPos = (containerSize - contentSize) / 2;
    } else if (justifyContent === 'end') {
      startPos = containerSize - padding - contentSize;
    } else if (justifyContent === 'space-between') {
      spacing = (containerSize - padding * 2 - contentSize + spacing * (items.length - 1)) / (items.length - 1);
    } else if (justifyContent === 'space-around') {
      spacing = (containerSize - padding * 2 - contentSize + spacing * (items.length - 1)) / items.length;
      startPos = padding + spacing / 2;
    }
    
    let currentPos = startPos;
    
    items.forEach((item) => {
      // 主轴位置
      if (isVertical) {
        item.y = currentPos;
      } else {
        item.x = currentPos;
      }
      
      // 交叉轴对齐
      if (alignItems === 'center') {
        if (isVertical) {
          item.x = (containerCrossSize - item.width) / 2;
        } else {
          item.y = (containerCrossSize - item.height) / 2;
        }
      } else if (alignItems === 'end') {
        if (isVertical) {
          item.x = containerCrossSize - padding - item.width;
        } else {
          item.y = containerCrossSize - padding - item.height;
        }
      } else if (alignItems === 'stretch') {
        if (isVertical) {
          item.width = containerCrossSize - padding * 2;
          item.x = padding;
        } else {
          item.height = containerCrossSize - padding * 2;
          item.y = padding;
        }
      }
      
      currentPos += (isVertical ? item.height : item.width) + spacing;
    });
  }
  
  /**
   * 自动间距计算
   * @param {Object} config - 布局配置
   */
  autoSpacing(config) {
    const {
      container,
      items,
      minSpacing = 10,
      maxSpacing = 50,
      targetCount = 4
    } = config;
    
    const containerWidth = container.width;
    const totalItemWidth = items.reduce((sum, item) => sum + item.width, 0);
    const availableSpace = containerWidth - totalItemWidth;
    const numGaps = items.length + 1;
    
    // 计算理想间距
    let spacing = availableSpace / numGaps;
    
    // 限制在最小和最大间距之间
    spacing = Math.max(minSpacing, Math.min(maxSpacing, spacing));
    
    // 应用间距
    let currentX = (containerWidth - (totalItemWidth + spacing * (items.length - 1))) / 2;
    
    items.forEach((item) => {
      item.x = currentX;
      currentX += item.width + spacing;
    });
    
    return spacing;
  }
  
  /**
   * 注册到 Leafer
   */
  register() {
    if (this.leafer) {
      this.leafer.aiLayoutV2 = this;
      console.log('[AILayoutV2] ✅ 插件已注册');
    }
  }
  
  /**
   * 销毁插件
   */
  destroy() {
    if (this.leafer) {
      delete this.leafer.aiLayoutV2;
    }
  }
}

// 导出插件
module.exports = AILayoutPluginV2;

// 使用示例
if (require.main === module) {
  console.log('🎨 LeaferJS AI Layout Plugin V2');
  console.log('================================');
  console.log('');
  console.log('功能特性：');
  console.log('  ✅ 智能响应式布局');
  console.log('  ✅ 约束布局 (类似 iOS Auto Layout)');
  console.log('  ✅ 智能网格布局');
  console.log('  ✅ 瀑布流布局');
  console.log('  ✅ 弹性堆栈布局');
  console.log('  ✅ 自动间距计算');
  console.log('');
  console.log('使用方法：');
  console.log('  const AILayoutPluginV2 = require("./leafer-ai-layout-plugin-v2");');
  console.log('  const plugin = new AILayoutPluginV2(leafer);');
  console.log('  plugin.register();');
}
