/**
 * 磁盘空间图表组件
 * 使用 Chart.js 展示 C 盘空间占用饼图
 */

class DiskChart {
  constructor(canvasId) {
    this.canvasId = canvasId;
    this.chart = null;
    this.colors = {
      system: '#FF6B6B',      // 系统文件 - 红色
      application: '#4ECDC4', // 应用程序 - 青色
      user: '#45B7D1',        // 用户文件 - 蓝色
      temp: '#96CEB4',        // 临时文件 - 绿色
      other: '#FFEAA7'        // 其他 - 黄色
    };
  }

  /**
   * 初始化图表
   */
  init() {
    const canvas = document.getElementById(this.canvasId);
    if (!canvas) {
      console.error(`[DiskChart] 找不到 canvas 元素: ${this.canvasId}`);
      return;
    }

    const ctx = canvas.getContext('2d');
    
    this.chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: [],
        datasets: [{
          data: [],
          backgroundColor: [],
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              padding: 15,
              font: {
                size: 12
              },
              generateLabels: (chart) => {
                const data = chart.data;
                return data.labels.map((label, i) => ({
                  text: `${label}: ${this.formatBytes(data.datasets[0].data[i])}`,
                  fillStyle: data.datasets[0].backgroundColor[i],
                  hidden: false,
                  index: i
                }));
              }
            }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.label || '';
                const value = context.parsed;
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = ((value / total) * 100).toFixed(1);
                return `${label}: ${this.formatBytes(value)} (${percentage}%)`;
              }
            }
          }
        },
        onClick: (event, elements) => {
          if (elements.length > 0) {
            const index = elements[0].index;
            const label = this.chart.data.labels[index];
            this.onSegmentClick(label, index);
          }
        }
      }
    });

    console.log('[DiskChart] 图表初始化完成');
  }

  /**
   * 更新图表数据
   * @param {Object} categories - 分类数据
   */
  updateData(categories) {
    if (!this.chart) {
      console.error('[DiskChart] 图表未初始化');
      return;
    }

    // 映射分类数据到图表数据（支持多种分类名称）
    const categoryMap = {
      '系统文件': { color: this.colors.system, key: 'system' },
      '应用程序': { color: this.colors.application, key: 'application' },
      '应用程序(x86)': { color: this.colors.application, key: 'application' },
      '用户文件': { color: this.colors.user, key: 'user' },
      '程序数据': { color: this.colors.system, key: 'system' },
      '临时文件': { color: this.colors.temp, key: 'temp' },
      '其他': { color: this.colors.other, key: 'other' }
    };

    const labels = [];
    const data = [];
    const colors = [];

    // 处理传入的分类数据
    for (const [name, info] of Object.entries(categories)) {
      // 跳过垃圾文件类型（只显示主要分类）
      if (info.type === 'junk') continue;
      
      const mapped = categoryMap[name];
      if (mapped && info.size > 0) {
        labels.push(name);
        data.push(info.size);
        colors.push(mapped.color);
      }
    }

    // 更新图表
    this.chart.data.labels = labels;
    this.chart.data.datasets[0].data = data;
    this.chart.data.datasets[0].backgroundColor = colors;
    this.chart.update();

    console.log('[DiskChart] 图表数据已更新:', { labels, data });
  }

  /**
   * 扇区点击事件
   * @param {string} label - 分类名称
   * @param {number} index - 索引
   */
  onSegmentClick(label, index) {
    console.log('[DiskChart] 点击扇区:', label);
    
    // 触发自定义事件
    const event = new CustomEvent('diskChartSegmentClick', {
      detail: { label, index }
    });
    document.dispatchEvent(event);
  }

  /**
   * 销毁图表
   */
  destroy() {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
  }

  /**
   * 格式化字节大小
   * @param {number} bytes - 字节数
   * @returns {string} 格式化后的字符串
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DiskChart;
}
