/**
 * LeaferJS AI 布局插件
 * 
 * 专家级插件示例 - 提供智能布局功能
 * 功能：
 * - Grid 网格布局
 * - Flex 弹性布局
 * - Stack 堆叠布局
 * - 自动对齐和分布
 * - 响应式布局支持
 * 
 * @author AI Expert
 * @version 1.0.0
 */

const { Group, Box, registerUI } = require('leafer-ui/node');

// 布局配置接口
/**
 * @typedef {Object} LayoutConfig
 * @property {'grid' | 'flex' | 'stack'} type - 布局类型
 * @property {number} [columns=3] - Grid 列数
 * @property {number} [gap=10] - 元素间距
 * @property {number} [padding=20] - 内边距
 * @property {'start' | 'center' | 'end' | 'space-between' | 'space-around'} [justify='start'] - 主轴对齐
 * @property {'start' | 'center' | 'end' | 'stretch'} [align='start'] - 交叉轴对齐
 * @property {boolean} [wrap=false] - 是否换行
 * @property {number} [maxWidth] - 最大宽度
 * @property {number} [maxHeight] - 最大高度
 */

class AILayout extends Box {
    constructor(config = {}) {
        super(config);
        this.layoutConfig = {
            type: 'grid',
            columns: 3,
            gap: 10,
            padding: 20,
            justify: 'start',
            align: 'start',
            wrap: false,
            ...config.layoutConfig
        };
        
        // 监听子元素变化
        this.on('child.add', () => this.scheduleLayout());
        this.on('child.remove', () => this.scheduleLayout());
    }

    /**
     * 调度布局更新
     */
    scheduleLayout() {
        if (this._layoutScheduled) return;
        this._layoutScheduled = true;
        
        setTimeout(() => {
            this.applyLayout();
            this._layoutScheduled = false;
        }, 0);
    }

    /**
     * 应用布局
     */
    applyLayout() {
        const { type } = this.layoutConfig;
        
        switch (type) {
            case 'grid':
                this.applyGridLayout();
                break;
            case 'flex':
                this.applyFlexLayout();
                break;
            case 'stack':
                this.applyStackLayout();
                break;
            default:
                console.warn(`[AI Layout] Unknown layout type: ${type}`);
        }
        
        // 触发布局完成事件
        this.emit('layout.complete');
    }

    /**
     * Grid 网格布局
     */
    applyGridLayout() {
        const { 
            columns = 3, 
            gap = 10, 
            padding = 20,
            justify = 'start',
            align = 'start'
        } = this.layoutConfig;
        
        const children = this.children;
        if (children.length === 0) return;
        
        // 计算单元格尺寸
        const availableWidth = this.width - padding * 2 - gap * (columns - 1);
        const cellWidth = availableWidth / columns;
        
        // 计算行数
        const rows = Math.ceil(children.length / columns);
        
        // 布局每个子元素
        children.forEach((child, index) => {
            const row = Math.floor(index / columns);
            const col = index % columns;
            
            // 计算位置
            let x = padding + col * (cellWidth + gap);
            let y = padding + row * (child.height + gap);
            
            // 处理对齐
            if (justify === 'center') {
                x += (cellWidth - child.width) / 2;
            } else if (justify === 'end') {
                x += cellWidth - child.width;
            }
            
            if (align === 'center') {
                // 需要知道行高才能垂直居中
                // 简化处理：使用默认高度
            }
            
            // 应用位置
            child.x = x;
            child.y = y;
            
            // 可选：调整子元素宽度
            if (child.width > cellWidth) {
                child.width = cellWidth;
            }
        });
        
        // 更新容器高度（如果需要）
        const contentHeight = padding * 2 + rows * (children[0]?.height || 0) + (rows - 1) * gap;
        if (contentHeight > this.height) {
            this.height = contentHeight;
        }
    }

    /**
     * Flex 弹性布局
     */
    applyFlexLayout() {
        const { 
            gap = 10, 
            padding = 20,
            justify = 'start',
            align = 'start',
            wrap = false
        } = this.layoutConfig;
        
        const children = this.children;
        if (children.length === 0) return;
        
        const availableWidth = this.width - padding * 2;
        const totalGap = (children.length - 1) * gap;
        const totalChildrenWidth = children.reduce((sum, child) => sum + child.width, 0);
        
        let x = padding;
        let y = padding;
        let currentRowHeight = 0;
        let rowStartIndex = 0;
        
        // 计算起始位置（基于 justify）
        if (justify === 'center') {
            x = padding + (availableWidth - totalChildrenWidth - totalGap) / 2;
        } else if (justify === 'end') {
            x = this.width - padding - totalChildrenWidth - totalGap;
        } else if (justify === 'space-between' && children.length > 1) {
            const space = (availableWidth - totalChildrenWidth) / (children.length - 1);
            // 特殊处理：在元素之间均匀分布
        } else if (justify === 'space-around' && children.length > 0) {
            const space = (availableWidth - totalChildrenWidth) / children.length;
            x = padding + space / 2;
        }
        
        // 布局每个子元素
        children.forEach((child, index) => {
            // 处理换行
            if (wrap && x + child.width > this.width - padding && index > rowStartIndex) {
                x = padding;
                y += currentRowHeight + gap;
                currentRowHeight = 0;
                rowStartIndex = index;
            }
            
            // 设置位置
            child.x = x;
            child.y = y;
            
            // 更新行高
            currentRowHeight = Math.max(currentRowHeight, child.height);
            
            // 更新 x 位置
            if (justify === 'space-between' && children.length > 1) {
                const space = (availableWidth - totalChildrenWidth) / (children.length - 1);
                x += child.width + space;
            } else if (justify === 'space-around') {
                const space = (availableWidth - totalChildrenWidth) / children.length;
                x += child.width + space;
            } else {
                x += child.width + gap;
            }
        });
        
        // 处理交叉轴对齐
        if (align !== 'start') {
            this.alignChildrenInRow(rowStartIndex, children.length - 1, currentRowHeight, align);
        }
    }

    /**
     * Stack 堆叠布局
     */
    applyStackLayout() {
        const { 
            gap = 10, 
            padding = 20,
            align = 'start'
        } = this.layoutConfig;
        
        const children = this.children;
        if (children.length === 0) return;
        
        let y = padding;
        
        children.forEach((child) => {
            // 计算 x 位置（基于对齐）
            let x = padding;
            
            if (align === 'center') {
                x = padding + (this.width - padding * 2 - child.width) / 2;
            } else if (align === 'end') {
                x = this.width - padding - child.width;
            } else if (align === 'stretch') {
                child.width = this.width - padding * 2;
            }
            
            child.x = x;
            child.y = y;
            
            y += child.height + gap;
        });
        
        // 更新容器高度
        const contentHeight = y - gap + padding;
        if (contentHeight > this.height) {
            this.height = contentHeight;
        }
    }

    /**
     * 对齐行内的子元素
     */
    alignChildrenInRow(startIndex, endIndex, rowHeight, align) {
        for (let i = startIndex; i <= endIndex; i++) {
            const child = this.children[i];
            if (!child) continue;
            
            if (align === 'center') {
                child.y += (rowHeight - child.height) / 2;
            } else if (align === 'end') {
                child.y += rowHeight - child.height;
            } else if (align === 'stretch') {
                child.height = rowHeight;
            }
        }
    }

    /**
     * 更新布局配置
     */
    updateLayoutConfig(config) {
        this.layoutConfig = { ...this.layoutConfig, ...config };
        this.applyLayout();
    }

    /**
     * 添加子元素并自动布局
     */
    addChild(element) {
        this.add(element);
        // 自动触发布局
        return this;
    }

    /**
     * 批量添加子元素
     */
    addChildren(elements) {
        elements.forEach(el => this.add(el));
        return this;
    }

    /**
     * 获取布局信息
     */
    getLayoutInfo() {
        return {
            type: this.layoutConfig.type,
            childCount: this.children.length,
            bounds: this.boxBounds,
            config: this.layoutConfig
        };
    }
}

// 注册元素
registerUI(AILayout);

// 导出插件
module.exports = {
    AILayout,
    
    // 便捷创建函数
    createGridLayout(config = {}) {
        return new AILayout({
            layoutConfig: { type: 'grid', ...config }
        });
    },
    
    createFlexLayout(config = {}) {
        return new AILayout({
            layoutConfig: { type: 'flex', ...config }
        });
    },
    
    createStackLayout(config = {}) {
        return new AILayout({
            layoutConfig: { type: 'stack', ...config }
        });
    }
};
