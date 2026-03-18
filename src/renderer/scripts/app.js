class App {
  constructor() {
    this.currentPage = 'organize';
    this.config = null;
    this.diskChart = null; // 磁盘图表实例
    this.init();
  }

  async init() {
    await this.loadConfig();
    this.setupNavigation();
    this.setupSearch();
    this.loadPage('organize');
    
    window.electronAPI.onNavigate((page) => {
      this.navigateTo(page);
    });
    
    // 监听深度分析进度
    window.electronAPI.onDeepAnalysisProgress((progress) => {
      this.updateDeepAnalysisProgress(progress);
    });
  }

  /**
   * 更新深度分析进度显示
   * @param {Object} progress - 进度信息
   */
  updateDeepAnalysisProgress(progress) {
    console.log('[C盘优化] 深度分析进度:', progress);
    
    // 更新加载提示
    const diskLoading = document.getElementById('diskLoading');
    if (diskLoading && diskLoading.style.display !== 'none') {
      const loadingText = diskLoading.querySelector('p');
      if (loadingText) {
        loadingText.textContent = `深度分析中... ${progress.progress}% - ${progress.detail}`;
      }
    }
    
    // 可以在这里添加进度条显示
    this.showProgressNotification(progress.progress, progress.detail);
  }

  /**
   * 显示进度通知
   * @param {number} progress - 进度百分比
   * @param {string} detail - 详细信息
   */
  showProgressNotification(progress, detail) {
    // 移除旧的进度通知
    const oldNotification = document.querySelector('.progress-notification');
    if (oldNotification) {
      oldNotification.remove();
    }
    
    // 创建新的进度通知
    const notification = document.createElement('div');
    notification.className = 'progress-notification';
    notification.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #667eea;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 1000;
      min-width: 250px;
    `;
    
    notification.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 8px;">深度分析中...</div>
      <div style="font-size: 12px; margin-bottom: 8px; opacity: 0.9;">${detail}</div>
      <div style="background: rgba(255,255,255,0.3); height: 4px; border-radius: 2px; overflow: hidden;">
        <div style="background: white; height: 100%; width: ${progress}%; transition: width 0.3s ease;"></div>
      </div>
      <div style="font-size: 11px; margin-top: 4px; text-align: right; opacity: 0.8;">${progress}%</div>
    `;
    
    document.body.appendChild(notification);
    
    // 100% 时自动移除
    if (progress >= 100) {
      setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(20px)';
        notification.style.transition = 'all 0.5s ease';
        setTimeout(() => notification.remove(), 500);
      }, 2000);
    }
  }

  async loadConfig() {
    try {
      this.config = await window.electronAPI.getConfig();
    } catch (error) {
      console.error('加载配置失败:', error);
    }
  }

  setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const page = item.dataset.page;
        this.navigateTo(page);
      });
    });
  }

  navigateTo(page) {
    this.currentPage = page;
    
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.page === page);
    });
    
    this.loadPage(page);
  }

  async loadPage(page) {
    const contentArea = document.getElementById('contentArea');
    contentArea.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

    switch (page) {
      case 'organize':
        await this.renderOrganizePage();
        break;
      case 'transfer':
        await this.renderTransferPage();
        break;
      case 'timeline':
        await this.renderTimelinePage();
        break;
      case 'duplicates':
        await this.renderDuplicatesPage();
        break;
      case 'settings':
        await this.renderSettingsPage();
        break;
      case 'optimizer':
        await this.renderOptimizerPage();
        break;
      default:
        contentArea.innerHTML = '<div class="empty-state"><p>页面不存在</p></div>';
    }
  }

  setupSearch() {
    const searchInput = document.getElementById('searchInput');
    let debounceTimer;
    
    searchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        this.handleSearch(e.target.value);
      }, 300);
    });
  }

  async handleSearch(keyword) {
    if (!keyword.trim()) return;
    
    console.log('搜索:', keyword);
  }

  async renderOrganizePage() {
    const contentArea = document.getElementById('contentArea');
    
    contentArea.innerHTML = `
      <h1 class="page-title">文件整理</h1>
      
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">智能分类</h2>
        </div>
        
        <div class="form-group">
          <label class="form-label">源文件夹</label>
          <div class="folder-selector">
            <input type="text" class="form-input" id="sourceFolder" placeholder="选择要整理的文件夹">
            <button class="btn btn-secondary" id="selectSourceBtn">浏览</button>
          </div>
        </div>
        
        <div class="form-group">
          <label class="form-label">目标文件夹</label>
          <div class="folder-selector">
            <input type="text" class="form-input" id="targetFolder" placeholder="选择整理后的存放位置">
            <button class="btn btn-secondary" id="selectTargetBtn">浏览</button>
          </div>
        </div>
        
        <div class="form-group">
          <label class="form-label">整理方式</label>
          <select class="form-input" id="organizeType">
            <option value="byDate">按日期分类</option>
            <option value="byType">按文件类型分类</option>
            <option value="custom">自定义规则</option>
          </select>
        </div>
        
        <button class="btn btn-primary" id="startOrganizeBtn">开始整理</button>
      </div>
      
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">批量重命名</h2>
        </div>
        
        <div class="form-group">
          <label class="form-label">文件夹</label>
          <div class="folder-selector">
            <input type="text" class="form-input" id="renameFolder" placeholder="选择文件夹">
            <button class="btn btn-secondary" id="selectRenameFolderBtn">浏览</button>
          </div>
        </div>
        
        <div class="form-group">
          <label class="form-label">命名规则</label>
          <input type="text" class="form-input" id="renamePattern" placeholder="{date}_{index}" value="{date}_{index}">
          <small style="color: var(--text-secondary); margin-top: 4px; display: block;">
            可用变量: {date} 日期, {index} 序号, {original} 原文件名
          </small>
        </div>
        
        <button class="btn btn-primary" id="startRenameBtn">开始重命名</button>
      </div>
    `;

    this.setupOrganizeEvents();
  }

  setupOrganizeEvents() {
    document.getElementById('selectSourceBtn').addEventListener('click', async () => {
      const folder = await window.electronAPI.selectFolder();
      if (folder) {
        document.getElementById('sourceFolder').value = folder;
      }
    });

    document.getElementById('selectTargetBtn').addEventListener('click', async () => {
      const folder = await window.electronAPI.selectFolder();
      if (folder) {
        document.getElementById('targetFolder').value = folder;
      }
    });

    document.getElementById('selectRenameFolderBtn').addEventListener('click', async () => {
      const folder = await window.electronAPI.selectFolder();
      if (folder) {
        document.getElementById('renameFolder').value = folder;
      }
    });

    document.getElementById('startOrganizeBtn').addEventListener('click', async () => {
      const sourceFolder = document.getElementById('sourceFolder').value;
      const targetFolder = document.getElementById('targetFolder').value;
      const organizeType = document.getElementById('organizeType').value;

      console.log('[文件整理] 开始整理');
      console.log('[文件整理] 源文件夹:', sourceFolder);
      console.log('[文件整理] 目标文件夹:', targetFolder);
      console.log('[文件整理] 整理类型:', organizeType);

      if (!sourceFolder || !targetFolder) {
        alert('请选择源文件夹和目标文件夹');
        return;
      }

      // 如果源文件夹和目标文件夹相同，表示原地整理
      const isInPlace = sourceFolder.toLowerCase() === targetFolder.toLowerCase();
      if (isInPlace) {
        console.log('[文件整理] 原地整理模式');
      }

      try {
        this.showLoading('正在整理文件...');
        console.log('[文件整理] 调用 organizeFiles API...');
        
        const result = await window.electronAPI.organizeFiles({
          sourceFolder,
          targetFolder,
          organizeType
        });
        
        console.log('[文件整理] 整理完成:', result);
        
        // 显示详细的错误信息
        let errorDetails = '';
        if (result.errors && result.errors.length > 0) {
          errorDetails = '\n\n错误详情 (前5条):';
          result.errors.slice(0, 5).forEach((err, index) => {
            errorDetails += `\n${index + 1}. ${err.error}`;
          });
          if (result.errors.length > 5) {
            errorDetails += `\n... 还有 ${result.errors.length - 5} 个错误`;
          }
        }
        
        alert(`整理完成！\n总计: ${result.total}\n成功: ${result.success}\n失败: ${result.failed}\n跳过: ${result.skipped}${errorDetails}`);
      } catch (error) {
        console.error('[文件整理] 整理失败:', error);
        alert('整理失败: ' + error.message);
      } finally {
        this.hideLoading();
      }
    });
  }

  async renderTransferPage() {
    const contentArea = document.getElementById('contentArea');
    const status = await window.electronAPI.getServerStatus();
    
    contentArea.innerHTML = `
      <h1 class="page-title">局域网传输</h1>
      
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">服务器状态</h2>
          <span class="status-badge ${status.isRunning ? 'status-online' : 'status-offline'}">
            ${status.isRunning ? '运行中' : '已停止'}
          </span>
        </div>
        
        <div class="qr-container" id="qrContainer" style="${status.isRunning ? '' : 'display: none;'}">
          <img class="qr-code" id="qrCode" alt="扫码连接">
          <div class="server-url" id="serverUrl"></div>
          <div class="auth-code" id="authCode"></div>
          <p style="color: var(--text-secondary); font-size: 14px;">扫描二维码或输入上方地址连接</p>
          <p style="color: var(--text-secondary); font-size: 12px; margin-top: 8px;">连接时需要输入验证码</p>
          
          <div style="margin-top: 16px; text-align: left;">
            <p style="color: var(--text-secondary); font-size: 12px; margin-bottom: 8px;">如果上方地址无法连接，请尝试以下IP：</p>
            <div id="ipList" style="display: flex; flex-wrap: wrap; gap: 8px;"></div>
          </div>
          
          <div style="margin-top: 16px; padding: 12px; background: rgba(245, 158, 11, 0.1); border-radius: 8px; border-left: 3px solid var(--warning-color);">
            <p style="color: var(--warning-color); font-size: 12px; margin: 0;">
              <strong>💡 提示：</strong>如果无法连接，请检查Windows防火墙是否允许此应用通过，或暂时关闭防火墙测试。
            </p>
          </div>
        </div>
        
        <div style="margin-top: 20px;">
          ${status.isRunning 
            ? '<button class="btn btn-danger" id="stopServerBtn">停止服务器</button>'
            : '<button class="btn btn-primary" id="startServerBtn">启动服务器</button>'
          }
        </div>
      </div>
      
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">已连接设备</h2>
        </div>
        <div class="device-list" id="deviceList">
          <div class="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
              <line x1="12" y1="18" x2="12.01" y2="18"></line>
            </svg>
            <p>暂无连接设备</p>
          </div>
        </div>
      </div>
      
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">传输历史</h2>
        </div>
        <div class="transfer-list" id="transferList">
          <div class="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"></path>
            </svg>
            <p>暂无传输记录</p>
          </div>
        </div>
      </div>
    `;

    this.setupTransferEvents(status);
    
    if (status.isRunning) {
      this.updateQRCode();
      this.loadConnectedDevices();
      this.loadTransferHistory();
    }
  }

  setupTransferEvents(status) {
    const startBtn = document.getElementById('startServerBtn');
    const stopBtn = document.getElementById('stopServerBtn');

    if (startBtn) {
      startBtn.addEventListener('click', async () => {
        try {
          await window.electronAPI.startServer();
          this.renderTransferPage();
        } catch (error) {
          alert('启动失败: ' + error.message);
        }
      });
    }

    if (stopBtn) {
      stopBtn.addEventListener('click', async () => {
        try {
          await window.electronAPI.stopServer();
          this.renderTransferPage();
        } catch (error) {
          alert('停止失败: ' + error.message);
        }
      });
    }
  }

  async updateQRCode() {
    try {
      const qrData = await window.electronAPI.getQRCode();
      const allIPs = await window.electronAPI.getAllIPs();
      
      const qrImg = document.getElementById('qrCode');
      const urlEl = document.getElementById('serverUrl');
      const codeEl = document.getElementById('authCode');
      const ipListEl = document.getElementById('ipList');
      
      if (qrImg && qrData.qrCode) {
        qrImg.src = qrData.qrCode;
      }
      if (urlEl) {
        urlEl.textContent = qrData.url;
      }
      if (codeEl) {
        codeEl.textContent = qrData.authCode;
      }
      
      // 显示所有可用的IP地址
      if (ipListEl && allIPs.length > 0) {
        ipListEl.innerHTML = allIPs.map(ip => `
          <button class="btn btn-secondary" style="font-size: 12px; padding: 6px 12px;" 
                  onclick="navigator.clipboard.writeText('http://${ip.address}:${qrData.url.split(':')[2]}')">
            ${ip.interface}: ${ip.address}
          </button>
        `).join('');
      }
    } catch (error) {
      console.error('获取二维码失败:', error);
    }
  }

  async loadConnectedDevices() {
    try {
      const devices = await window.electronAPI.getConnectedDevices();
      const listEl = document.getElementById('deviceList');
      
      if (devices.length === 0) {
        listEl.innerHTML = `
          <div class="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
              <line x1="12" y1="18" x2="12.01" y2="18"></line>
            </svg>
            <p>暂无连接设备</p>
          </div>
        `;
        return;
      }

      listEl.innerHTML = devices.map(device => `
        <div class="device-item">
          <div class="device-info">
            <div class="device-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
                <line x1="12" y1="18" x2="12.01" y2="18"></line>
              </svg>
            </div>
            <div>
              <div class="device-name">${device.name}</div>
              <div class="device-ip">${device.ip}</div>
            </div>
          </div>
          <span class="status-badge status-online">已连接</span>
        </div>
      `).join('');
    } catch (error) {
      console.error('加载设备列表失败:', error);
    }
  }

  async loadTransferHistory() {
    try {
      const history = await window.electronAPI.getTransferHistory();
      const listEl = document.getElementById('transferList');
      
      if (history.length === 0) {
        listEl.innerHTML = `
          <div class="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"></path>
            </svg>
            <p>暂无传输记录</p>
          </div>
        `;
        return;
      }

      listEl.innerHTML = history.map(item => `
        <div class="transfer-item">
          <div class="transfer-icon ${item.direction}">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              ${item.direction === 'upload' 
                ? '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"></path>'
                : '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"></path>'
              }
            </svg>
          </div>
          <div class="transfer-info">
            <div class="transfer-name">${item.file_name}</div>
            <div class="transfer-meta">
              ${item.device_name || '未知设备'} · ${this.formatFileSize(item.file_size)} · ${this.formatDate(item.started_at)}
            </div>
          </div>
          <span class="status-badge ${item.status === 'completed' ? 'status-online' : 'status-offline'}">
            ${item.status === 'completed' ? '已完成' : '进行中'}
          </span>
        </div>
      `).join('');
    } catch (error) {
      console.error('加载传输历史失败:', error);
    }
  }

  async renderTimelinePage() {
    const contentArea = document.getElementById('contentArea');
    
    contentArea.innerHTML = `
      <h1 class="page-title">时间线</h1>
      
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">按时间浏览</h2>
          <div>
            <input type="date" id="startDate" class="form-input" style="width: auto;">
            <span style="margin: 0 8px;">至</span>
            <input type="date" id="endDate" class="form-input" style="width: auto;">
            <button class="btn btn-primary" id="filterTimelineBtn">筛选</button>
          </div>
        </div>
        
        <div class="timeline" id="timelineContent">
          <div class="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <p>暂无文件数据，请先整理文件</p>
          </div>
        </div>
      </div>
    `;

    this.setupTimelineEvents();
    this.loadTimeline();
  }

  setupTimelineEvents() {
    const filterBtn = document.getElementById('filterTimelineBtn');
    if (filterBtn) {
      filterBtn.addEventListener('click', () => {
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        this.loadTimeline(startDate, endDate);
      });
    }
  }

  async loadTimeline(startDate, endDate) {
    try {
      const timeline = await window.electronAPI.getTimeline({ startDate, endDate });
      const contentEl = document.getElementById('timelineContent');
      
      const dates = Object.keys(timeline).sort().reverse();
      
      if (dates.length === 0) {
        contentEl.innerHTML = `
          <div class="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <p>暂无文件数据</p>
          </div>
        `;
        return;
      }

      contentEl.innerHTML = dates.map(date => `
        <div class="timeline-date">
          <div class="timeline-date-header">${this.formatDisplayDate(date)}</div>
          <div class="timeline-items">
            ${timeline[date].map(file => `
              <div class="timeline-item" title="${file.name}">
                <div style="width: 100%; height: 100%; background: var(--bg-color); display: flex; align-items: center; justify-content: center;">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--text-secondary);">
                    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                    <polyline points="13 2 13 9 20 9"></polyline>
                  </svg>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `).join('');
    } catch (error) {
      console.error('加载时间线失败:', error);
    }
  }

  async renderDuplicatesPage() {
    const contentArea = document.getElementById('contentArea');
    
    contentArea.innerHTML = `
      <h1 class="page-title">重复文件检测</h1>
      
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">扫描设置</h2>
        </div>
        
        <div class="form-group">
          <label class="form-label">扫描文件夹</label>
          <div class="folder-selector">
            <input type="text" class="form-input" id="scanFolder" placeholder="选择要扫描的文件夹">
            <button class="btn btn-secondary" id="selectScanFolderBtn">浏览</button>
          </div>
        </div>
        
        <button class="btn btn-primary" id="startScanBtn">开始扫描</button>
      </div>
      
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">重复文件列表</h2>
        </div>
        <div id="duplicatesList">
          <div class="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            <p>点击"开始扫描"检测重复文件</p>
          </div>
        </div>
      </div>
    `;

    this.setupDuplicatesEvents();
  }

  setupDuplicatesEvents() {
    document.getElementById('selectScanFolderBtn').addEventListener('click', async () => {
      const folder = await window.electronAPI.selectFolder();
      if (folder) {
        document.getElementById('scanFolder').value = folder;
      }
    });

    document.getElementById('startScanBtn').addEventListener('click', async () => {
      const folder = document.getElementById('scanFolder').value;
      
      if (!folder) {
        alert('请选择扫描文件夹');
        return;
      }

      try {
        this.showLoading('正在扫描重复文件...');
        const duplicates = await window.electronAPI.scanDuplicates(folder);
        this.renderDuplicatesList(duplicates);
      } catch (error) {
        alert('扫描失败: ' + error.message);
      } finally {
        this.hideLoading();
      }
    });
  }

  renderDuplicatesList(duplicates) {
    const listEl = document.getElementById('duplicatesList');
    
    if (duplicates.length === 0) {
      listEl.innerHTML = `
        <div class="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          <p>没有发现重复文件</p>
        </div>
      `;
      return;
    }

    listEl.innerHTML = duplicates.map((dup, index) => `
      <div class="duplicate-group">
        <div class="duplicate-header">
          <div class="duplicate-info">
            发现 ${dup.count} 个重复文件 · 总大小 ${this.formatFileSize(dup.size * dup.count)}
          </div>
          <button class="btn btn-danger btn-sm" onclick="app.deleteDuplicate(${index})">删除重复</button>
        </div>
        <div class="duplicate-files">
          ${dup.files.map((file, fileIndex) => `
            <div class="duplicate-file">
              <input type="radio" name="dup-${index}" value="${fileIndex}" ${fileIndex === 0 ? 'checked' : ''}>
              <span>${file}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');
  }

  async renderSettingsPage() {
    const contentArea = document.getElementById('contentArea');
    const config = this.config;
    
    contentArea.innerHTML = `
      <h1 class="page-title">设置</h1>
      
      <div class="card">
        <div class="settings-section">
          <h3 class="settings-section-title">基本设置</h3>
          
          <div class="setting-item">
            <div>
              <div class="setting-label">语言</div>
              <div class="setting-description">选择界面语言</div>
            </div>
            <select class="select" id="languageSelect">
              <option value="zh-CN" ${config.language === 'zh-CN' ? 'selected' : ''}>简体中文</option>
              <option value="en-US" ${config.language === 'en-US' ? 'selected' : ''}>English</option>
            </select>
          </div>
          
          <div class="setting-item">
            <div>
              <div class="setting-label">主题</div>
              <div class="setting-description">选择界面主题</div>
            </div>
            <select class="select" id="themeSelect">
              <option value="light" ${config.theme === 'light' ? 'selected' : ''}>浅色</option>
              <option value="dark" ${config.theme === 'dark' ? 'selected' : ''}>深色</option>
            </select>
          </div>
        </div>
        
        <div class="settings-section">
          <h3 class="settings-section-title">服务器设置</h3>
          
          <div class="setting-item">
            <div>
              <div class="setting-label">自动启动服务器</div>
              <div class="setting-description">启动应用时自动开启局域网传输服务</div>
            </div>
            <label class="toggle">
              <input type="checkbox" id="autoStartServer" ${config.autoStartServer ? 'checked' : ''}>
              <span class="toggle-slider"></span>
            </label>
          </div>
          
          <div class="setting-item">
            <div>
              <div class="setting-label">服务器端口</div>
              <div class="setting-description">局域网传输服务使用的端口</div>
            </div>
            <input type="number" class="form-input" id="serverPort" value="${config.serverPort}" style="width: 100px;">
          </div>
        </div>
        
        <div class="settings-section">
          <h3 class="settings-section-title">安全设置</h3>
          
          <div class="setting-item">
            <div>
              <div class="setting-label">需要验证码</div>
              <div class="setting-description">设备连接时需要输入验证码</div>
            </div>
            <label class="toggle">
              <input type="checkbox" id="requireAuth" ${config.security?.requireAuth !== false ? 'checked' : ''}>
              <span class="toggle-slider"></span>
            </label>
          </div>
        </div>
        
        <button class="btn btn-primary" id="saveSettingsBtn">保存设置</button>
      </div>
    `;

    this.setupSettingsEvents();
  }

  setupSettingsEvents() {
    document.getElementById('saveSettingsBtn').addEventListener('click', async () => {
      const newConfig = {
        language: document.getElementById('languageSelect').value,
        theme: document.getElementById('themeSelect').value,
        autoStartServer: document.getElementById('autoStartServer').checked,
        serverPort: parseInt(document.getElementById('serverPort').value),
        security: {
          requireAuth: document.getElementById('requireAuth').checked
        }
      };

      try {
        await window.electronAPI.setConfig(newConfig);
        this.config = { ...this.config, ...newConfig };
        alert('设置已保存');
      } catch (error) {
        alert('保存失败: ' + error.message);
      }
    });
  }

  showLoading(message) {
    const loadingOverlay = document.getElementById('globalLoading');
    const loadingMessage = document.getElementById('loadingMessage');
    if (loadingOverlay) {
      loadingOverlay.style.display = 'flex';
      if (loadingMessage) {
        loadingMessage.textContent = message;
      }
    }
    console.log(`[Loading] ${message}`);
  }

  hideLoading() {
    const loadingOverlay = document.getElementById('globalLoading');
    if (loadingOverlay) {
      loadingOverlay.style.display = 'none';
    }
    console.log('[Loading] 隐藏');
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN');
  }

  formatDisplayDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  }

  async renderOptimizerPage() {
    const contentArea = document.getElementById('contentArea');
    
    contentArea.innerHTML = `
      <h1 class="page-title">C盘优化</h1>
      
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">磁盘空间概览</h2>
          <button class="btn btn-primary" id="analyzeDiskBtn">开始分析</button>
        </div>
        
        <div id="diskOverview" style="display: none;">
          <div class="disk-stats">
            <div class="disk-stat-item">
              <div class="disk-stat-value" id="totalSize">-</div>
              <div class="disk-stat-label">总容量</div>
            </div>
            <div class="disk-stat-item">
              <div class="disk-stat-value" id="usedSpace">-</div>
              <div class="disk-stat-label">已用空间</div>
            </div>
            <div class="disk-stat-item">
              <div class="disk-stat-value" id="freeSpace">-</div>
              <div class="disk-stat-label">可用空间</div>
            </div>
            <div class="disk-stat-item">
              <div class="disk-stat-value" id="usagePercent">-</div>
              <div class="disk-stat-label">使用率</div>
            </div>
          </div>
          
          <div class="disk-progress">
            <div class="disk-progress-bar" id="diskProgressBar"></div>
          </div>
          
          <!-- 饼图容器 -->
          <div class="disk-chart-container" style="margin-top: 24px; padding: 20px; background: #f8f9fa; border-radius: 8px;">
            <h3 style="margin-bottom: 16px; font-size: 16px; color: #333;">空间占用分布</h3>
            <div style="display: flex; align-items: center; gap: 20px;">
              <div style="flex: 1; max-width: 400px;">
                <canvas id="diskChart" width="400" height="300"></canvas>
              </div>
              <div id="diskChartLegend" style="flex: 1;"></div>
            </div>
          </div>
          
          <div class="disk-categories" id="diskCategories"></div>
        </div>
        
        <div id="diskLoading" style="display: none;">
          <div class="loading">
            <div class="spinner"></div>
            <span style="margin-left: 16px;">正在分析磁盘空间...</span>
          </div>
        </div>
        
        <div id="diskEmpty" class="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path>
          </svg>
          <p>点击"开始分析"查看C盘空间使用情况</p>
        </div>
      </div>
      
      <div class="card" id="cleanableCard" style="display: none;">
        <div class="card-header">
          <h2 class="card-title">可清理项目</h2>
          <div>
            <span id="totalCleanableSize" style="margin-right: 12px; color: var(--success-color); font-weight: 500;"></span>
            <button class="btn btn-success" id="quickCleanBtn">一键安全清理</button>
          </div>
        </div>
        
        <div class="risk-legend">
          <div class="risk-item">
            <span class="risk-dot safe"></span>
            <span>安全可删</span>
          </div>
          <div class="risk-item">
            <span class="risk-dot caution"></span>
            <span>谨慎删除</span>
          </div>
          <div class="risk-item">
            <span class="risk-dot danger"></span>
            <span>不建议删除</span>
          </div>
        </div>
        
        <div class="cleanable-list" id="cleanableList"></div>
      </div>
      
      <div class="card" id="largeFilesCard" style="display: none;">
        <div class="card-header">
          <h2 class="card-title">大文件列表 (Top 100)</h2>
        </div>
        <div class="large-files-list" id="largeFilesList"></div>
      </div>
      
      <div class="card" id="suggestionsCard" style="display: none;">
        <div class="card-header">
          <h2 class="card-title">系统优化建议</h2>
        </div>
        <div class="suggestions-list" id="suggestionsList"></div>
      </div>
    `;

    this.setupOptimizerEvents();
  }

  setupOptimizerEvents() {
    const analyzeBtn = document.getElementById('analyzeDiskBtn');
    if (analyzeBtn) {
      analyzeBtn.addEventListener('click', () => this.analyzeDisk());
    }

    const quickCleanBtn = document.getElementById('quickCleanBtn');
    if (quickCleanBtn) {
      quickCleanBtn.addEventListener('click', () => this.quickClean());
    }
  }

  async analyzeDisk() {
    console.log('[C盘优化] analyzeDisk 方法被调用');
    
    const diskEmpty = document.getElementById('diskEmpty');
    const diskLoading = document.getElementById('diskLoading');
    const diskOverview = document.getElementById('diskOverview');
    const cleanableCard = document.getElementById('cleanableCard');
    const largeFilesCard = document.getElementById('largeFilesCard');
    const suggestionsCard = document.getElementById('suggestionsCard');

    diskEmpty.style.display = 'none';
    diskLoading.style.display = 'block';
    diskOverview.style.display = 'none';
    cleanableCard.style.display = 'none';
    largeFilesCard.style.display = 'none';
    suggestionsCard.style.display = 'none';

    try {
      const result = await window.electronAPI.analyzeDisk();
      
      if (result.success) {
        this.currentAnalysisResult = result;
        this.renderDiskOverview(result.diskInfo);
        this.renderCategories(result.categories);
        this.renderCleanableItems(result.cleanableItems);
        this.renderLargeFiles(result.largeFiles);
        
        // 初始化并更新磁盘图表
        this.initDiskChart(result.categories);
        
        diskOverview.style.display = 'block';
        cleanableCard.style.display = 'block';
        largeFilesCard.style.display = 'block';
        
        // 加载优化建议
        const suggestions = await window.electronAPI.getOptimizationSuggestions();
        this.renderSuggestions(suggestions);
        if (suggestions.length > 0) {
          suggestionsCard.style.display = 'block';
        }
        
        // 显示分析完成时间
        this.showAnalysisTime(result.analyzedAt);
        
        // 开始轮询获取深度分析结果
        this.startDeepAnalysisPolling();
      } else {
        this.showError('分析失败: ' + (result.error || '未知错误'));
      }
    } catch (error) {
      console.error('分析磁盘失败:', error);
      this.showError('分析失败: ' + error.message);
    } finally {
      diskLoading.style.display = 'none';
    }
  }

  showAnalysisTime(timestamp) {
    const analyzeBtn = document.getElementById('analyzeDiskBtn');
    if (analyzeBtn && timestamp) {
      const date = new Date(timestamp);
      analyzeBtn.textContent = `上次分析: ${date.toLocaleTimeString('zh-CN')}`;
      analyzeBtn.classList.add('btn-secondary');
      analyzeBtn.classList.remove('btn-primary');
    }
  }

  /**
   * 初始化磁盘图表
   * @param {Object} categories - 分类数据
   */
  initDiskChart(categories) {
    console.log('[C盘优化] 初始化磁盘图表');
    
    try {
      // 如果图表已存在，先销毁
      if (this.diskChart) {
        this.diskChart.destroy();
      }
      
      // 创建新图表
      this.diskChart = new DiskChart('diskChart');
      this.diskChart.init();
      
      // 更新数据
      if (categories) {
        this.diskChart.updateData(categories);
      }
      
      console.log('[C盘优化] 磁盘图表初始化完成');
    } catch (error) {
      console.error('[C盘优化] 初始化磁盘图表失败:', error);
    }
  }

  showError(message) {
    const contentArea = document.getElementById('contentArea');
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
      <span>${message}</span>
    `;
    contentArea.insertBefore(errorDiv, contentArea.firstChild);
    
    setTimeout(() => {
      errorDiv.remove();
    }, 5000);
  }

  /**
   * 开始轮询获取深度分析结果
   */
  startDeepAnalysisPolling() {
    console.log('[C盘优化] 开始轮询深度分析结果...');
    
    // 清除之前的轮询
    if (this.deepAnalysisInterval) {
      clearInterval(this.deepAnalysisInterval);
    }
    
    let pollCount = 0;
    const maxPolls = 60; // 最多轮询60次（10分钟）
    
    this.deepAnalysisInterval = setInterval(async () => {
      pollCount++;
      
      try {
        const deepResult = await window.electronAPI.getDeepAnalysis();
        
        if (deepResult) {
          console.log('[C盘优化] 获取到深度分析结果:', deepResult);
          console.log('[C盘优化] categories:', deepResult.categories);
          console.log('[C盘优化] categories keys:', Object.keys(deepResult.categories || {}));
          
          // 更新可清理项目列表
          if (deepResult.categories && Object.keys(deepResult.categories).length > 0) {
            console.log('[C盘优化] 调用 updateCleanableItemsWithDeepAnalysis');
            this.updateCleanableItemsWithDeepAnalysis(deepResult);
          } else {
            console.log('[C盘优化] 跳过更新，categories 为空');
          }
          
          // 更新大文件列表
          if (deepResult.largeFiles && deepResult.largeFiles.length > 0) {
            this.renderLargeFiles(deepResult.largeFiles);
          }
          
          // 显示完成提示
          if (deepResult.canCleanSize > 0) {
            const additionalSize = this.formatBytes(deepResult.canCleanSize);
            console.log(`[C盘优化] 深度分析发现额外可清理空间: ${additionalSize}`);
          }
          
          // 停止轮询
          clearInterval(this.deepAnalysisInterval);
          this.deepAnalysisInterval = null;
          console.log('[C盘优化] 深度分析完成，停止轮询');
          
          // 开始轮询高级分析结果
          this.startAdvancedAnalysisPolling();
          
        } else if (pollCount >= maxPolls) {
          // 超过最大轮询次数，停止轮询
          clearInterval(this.deepAnalysisInterval);
          this.deepAnalysisInterval = null;
          console.log('[C盘优化] 深度分析轮询超时');
        }
      } catch (error) {
        console.error('[C盘优化] 获取深度分析结果失败:', error);
      }
    }, 10000); // 每10秒轮询一次
  }

  /**
   * 开始轮询高级分析结果
   */
  startAdvancedAnalysisPolling() {
    console.log('[C盘优化] 开始轮询高级分析结果...');
    
    // 清除之前的轮询
    if (this.advancedAnalysisInterval) {
      clearInterval(this.advancedAnalysisInterval);
    }
    
    let pollCount = 0;
    const maxPolls = 60; // 最多轮询60次（10分钟）
    
    this.advancedAnalysisInterval = setInterval(async () => {
      pollCount++;
      
      try {
        const advancedResult = await window.electronAPI.getAdvancedAnalysis();
        
        if (advancedResult) {
          console.log('[C盘优化] 获取到高级分析结果:', advancedResult);
          
          // 更新可清理项目列表
          if (advancedResult.recommendations && advancedResult.recommendations.length > 0) {
            console.log(`[C盘优化] 高级分析发现 ${advancedResult.recommendations.length} 个建议`);
            this.updateCleanableItemsWithAdvancedAnalysis(advancedResult);
          } else {
            console.log('[C盘优化] 高级分析没有找到建议');
          }
          
          // 显示完成提示
          if (advancedResult.topDirectories && advancedResult.topDirectories.length > 0) {
            console.log('[C盘优化] 最大的目录:', advancedResult.topDirectories.map(d => `${d.name}: ${d.sizeFormatted}`).join(', '));
          }
          
          // 停止轮询
          clearInterval(this.advancedAnalysisInterval);
          this.advancedAnalysisInterval = null;
          console.log('[C盘优化] 高级分析完成，停止轮询');
          
        } else if (pollCount >= maxPolls) {
          // 超过最大轮询次数，停止轮询
          clearInterval(this.advancedAnalysisInterval);
          this.advancedAnalysisInterval = null;
          console.log('[C盘优化] 高级分析轮询超时');
        }
      } catch (error) {
        console.error('[C盘优化] 获取高级分析结果失败:', error);
      }
    }, 10000); // 每10秒轮询一次
  }

  /**
   * 使用高级分析结果更新可清理项目
   */
  updateCleanableItemsWithAdvancedAnalysis(advancedResult) {
    console.log('[C盘优化] 更新可清理项目，高级分析结果:', advancedResult);
    
    const cleanableList = document.getElementById('cleanableList');
    if (!cleanableList) {
      console.log('[C盘优化] 找不到 cleanableList 元素');
      return;
    }
    
    // 转换高级分析结果为可清理项目
    const advancedItems = [];
    
    // 从 recommendations 中提取可清理项目
    if (advancedResult.recommendations) {
      for (const rec of advancedResult.recommendations) {
        if (rec.size > 0) {
          console.log(`[C盘优化] 添加高级分析项目: ${rec.name} (${rec.sizeFormatted})`);
          
          let riskLevel = 'caution';
          let impact = rec.suggestion;
          
          // 根据类型设置风险等级
          if (rec.type === 'large_files' || rec.type === 'user_folder') {
            riskLevel = 'caution';
          } else if (rec.type === 'large_program') {
            riskLevel = 'unsafe';
            impact = '卸载程序可能影响系统功能，请谨慎操作';
          } else if (rec.type === 'system_directory_analysis') {
            riskLevel = 'danger';
            impact = '系统目录，需要深入分析才能确定可删除的文件，不建议直接删除整个目录';
          }
          
          advancedItems.push({
            id: `advanced_${rec.type}_${rec.name.replace(/\s+/g, '_').toLowerCase()}`,
            name: rec.name,
            description: rec.suggestion,
            impact: impact,
            riskLevel: riskLevel,
            size: rec.size,
            sizeFormatted: rec.sizeFormatted,
            paths: rec.path ? [rec.path] : (rec.files ? rec.files.map(f => f.path) : []),
            isAdvancedAnalysisResult: true,
            details: rec.files || rec
          });
        }
      }
    }
    
    console.log(`[C盘优化] 找到 ${advancedItems.length} 个高级分析项目`);
    
    if (advancedItems.length === 0) {
      console.log('[C盘优化] 没有可添加的高级分析项目');
      return;
    }
    
    // 添加高级分析项目到列表
    for (const item of advancedItems) {
      // 检查是否已存在
      const existingItem = this.currentAnalysisResult.cleanableItems.find(i => i.id === item.id);
      if (!existingItem) {
        this.currentAnalysisResult.cleanableItems.push(item);
      }
    }
    
    // 重新排序
    this.currentAnalysisResult.cleanableItems.sort((a, b) => b.size - a.size);
    
    // 重新渲染
    this.renderCleanableItems(this.currentAnalysisResult.cleanableItems);
    
    // 更新可释放空间显示
    this.updateReleasableSpace();
    
    // 显示提示
    this.showNotification(`高级分析完成，发现 ${advancedItems.length} 个新的可清理项目`);
  }

  /**
   * 使用深度分析结果更新可清理项目
   */
  updateCleanableItemsWithDeepAnalysis(deepResult) {
    console.log('[C盘优化] 更新可清理项目，深度分析结果:', deepResult);
    
    const cleanableList = document.getElementById('cleanableList');
    if (!cleanableList) {
      console.log('[C盘优化] 找不到 cleanableList 元素');
      return;
    }
    
    // 转换深度分析结果为可清理项目
    const deepItems = [];
    
    // 从 categories 中提取可清理项目
    if (deepResult.categories) {
      for (const [name, info] of Object.entries(deepResult.categories)) {
        if (info.safeToClean && info.size > 0) {
          console.log(`[C盘优化] 添加深度分析项目: ${name} (${info.sizeFormatted})`);
          deepItems.push({
            id: `deep_${name.replace(/\s+/g, '_').toLowerCase()}`,
            name: name,
            description: `深度分析发现的${name}`,
            impact: '删除后不会影响系统运行',
            riskLevel: 'safe',
            size: info.size,
            sizeFormatted: info.sizeFormatted,
            paths: [info.path],
            isDeepAnalysisResult: true
          });
        }
      }
    }
    
    // 系统垃圾文件（向后兼容）
    if (deepResult.systemJunk) {
      for (const item of deepResult.systemJunk) {
        if (item.safeToClean && item.size > 0) {
          deepItems.push({
            id: `deep_system_${item.name.replace(/\s+/g, '_').toLowerCase()}`,
            name: item.name,
            description: '深度分析发现的系统垃圾文件',
            impact: '删除后不会影响系统运行',
            riskLevel: 'safe',
            size: item.size,
            sizeFormatted: item.sizeFormatted,
            paths: [item.path],
            isDeepAnalysisResult: true
          });
        }
      }
    }
    
    // 用户垃圾文件（向后兼容）
    if (deepResult.userJunk) {
      for (const item of deepResult.userJunk) {
        if (item.safeToClean && item.size > 0) {
          deepItems.push({
            id: `deep_user_${item.name.replace(/\s+/g, '_').toLowerCase()}`,
            name: item.name,
            description: '深度分析发现的用户垃圾文件',
            impact: '删除后不会影响系统运行，但可能需要重新登录某些应用',
            riskLevel: 'safe',
            size: item.size,
            sizeFormatted: item.sizeFormatted,
            paths: [item.path],
            isDeepAnalysisResult: true
          });
        }
      }
    }
    
    console.log(`[C盘优化] 找到 ${deepItems.length} 个深度分析项目`);
    
    if (deepItems.length === 0) {
      console.log('[C盘优化] 没有可添加的深度分析项目');
      return;
    }
    
    // 添加深度分析项目到列表
    console.log('[C盘优化] 当前可清理项目数量:', this.currentAnalysisResult.cleanableItems.length);
    
    for (const item of deepItems) {
      // 检查是否已存在
      const existingItem = this.currentAnalysisResult.cleanableItems.find(i => i.id === item.id);
      if (!existingItem) {
        console.log('[C盘优化] 添加新项目:', item.name);
        this.currentAnalysisResult.cleanableItems.push(item);
      } else {
        console.log('[C盘优化] 项目已存在:', item.name);
      }
    }
    
    // 重新排序
    this.currentAnalysisResult.cleanableItems.sort((a, b) => b.size - a.size);
    
    console.log('[C盘优化] 重新渲染，总项目数:', this.currentAnalysisResult.cleanableItems.length);
    
    // 重新渲染
    this.renderCleanableItems(this.currentAnalysisResult.cleanableItems);
    
    // 更新可释放空间显示
    this.updateReleasableSpace();
    
    // 显示提示
    this.showNotification(`深度分析完成，发现 ${deepItems.length} 个新的可清理项目`);
  }

  /**
   * 更新可释放空间显示
   */
  updateReleasableSpace() {
    const safeItems = this.currentAnalysisResult.cleanableItems.filter(item => item.riskLevel === 'safe');
    const totalSize = safeItems.reduce((sum, item) => sum + item.size, 0);
    
    const releasableSpace = document.getElementById('releasableSpace');
    if (releasableSpace) {
      releasableSpace.textContent = this.formatBytes(totalSize);
    }
  }

  /**
   * 显示通知
   */
  showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #667eea;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 1000;
      animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 5000);
  }

  /**
   * 格式化字节大小
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  renderDiskOverview(diskInfo) {
    if (!diskInfo) return;
    
    document.getElementById('totalSize').textContent = diskInfo.totalSizeFormatted;
    document.getElementById('usedSpace').textContent = diskInfo.usedSpaceFormatted;
    document.getElementById('freeSpace').textContent = diskInfo.freeSpaceFormatted;
    document.getElementById('usagePercent').textContent = diskInfo.usagePercent + '%';
    
    const progressBar = document.getElementById('diskProgressBar');
    progressBar.style.width = diskInfo.usagePercent + '%';
    
    // 根据使用率设置颜色
    if (diskInfo.usagePercent >= 90) {
      progressBar.style.background = 'linear-gradient(90deg, #ef4444, #dc2626)';
    } else if (diskInfo.usagePercent >= 70) {
      progressBar.style.background = 'linear-gradient(90deg, #f59e0b, #d97706)';
    } else {
      progressBar.style.background = 'linear-gradient(90deg, #22c55e, #16a34a)';
    }
  }

  renderCategories(categories) {
    const container = document.getElementById('diskCategories');
    if (!categories) {
      container.innerHTML = '';
      return;
    }
    
    // 将对象转换为数组
    let categoriesArray = categories;
    if (!Array.isArray(categories)) {
      categoriesArray = Object.entries(categories).map(([name, info]) => ({
        name,
        size: info.size,
        sizeFormatted: info.sizeFormatted,
        color: this.getCategoryColor(name)
      }));
    }
    
    if (categoriesArray.length === 0) {
      container.innerHTML = '';
      return;
    }
    
    container.innerHTML = categoriesArray.map(cat => `
      <div class="category-item">
        <div class="category-color" style="background-color: ${cat.color}"></div>
        <div class="category-info">
          <div class="category-name">${cat.name}</div>
          <div class="category-size">${cat.sizeFormatted}</div>
        </div>
      </div>
    `).join('');
  }

  /**
   * 获取分类颜色
   */
  getCategoryColor(name) {
    const colors = {
      '系统文件': '#FF6B6B',
      '应用程序': '#4ECDC4',
      '应用程序(x86)': '#4ECDC4',
      '用户文件': '#45B7D1',
      '程序数据': '#96CEB4',
      '临时文件': '#FFEAA7',
      '其他': '#DDA0DD'
    };
    return colors[name] || '#999';
  }

  renderCleanableItems(items) {
    const container = document.getElementById('cleanableList');
    const totalSizeEl = document.getElementById('totalCleanableSize');
    
    if (!items || items.length === 0) {
      container.innerHTML = '<div class="empty-state"><p>暂无可清理项目</p></div>';
      totalSizeEl.textContent = '';
      return;
    }
    
    const safeItems = items.filter(item => item.riskLevel === 'safe');
    const cautionItems = items.filter(item => item.riskLevel === 'caution');
    
    const totalSafeSize = safeItems.reduce((sum, item) => sum + item.size, 0);
    
    totalSizeEl.textContent = `可安全释放: ${this.formatFileSize(totalSafeSize)}`;
    
    container.innerHTML = items.map((item, index) => `
      <div class="cleanable-item" data-id="${item.id}" data-risk="${item.riskLevel}">
        <div class="cleanable-checkbox">
          <input type="checkbox" id="clean-${item.id}" ${item.riskLevel === 'safe' ? 'checked' : ''} 
                 ${item.riskLevel === 'danger' ? 'disabled' : ''}>
        </div>
        <div class="cleanable-info">
          <div class="cleanable-header">
            <span class="cleanable-name">${item.name}</span>
            <span class="risk-badge ${item.riskLevel}">${this.getRiskLabel(item.riskLevel)}</span>
          </div>
          <div class="cleanable-description">${item.description}</div>
          <div class="cleanable-impact">
            <strong>影响:</strong> ${item.impact}
          </div>
          ${(item.fileList && item.fileList.length > 0) || (item.paths && item.paths.length > 0) ? `
            <div class="cleanable-files">
              <details>
                <summary>查看包含的 ${item.fileList ? item.fileList.length : item.paths.length} 个项目</summary>
                <ul>
                  ${item.fileList ? item.fileList.map(f => `<li>${f.path} (${this.formatFileSize(f.size)})</li>`).join('') : item.paths.map(p => `<li>${p}</li>`).join('')}
                </ul>
              </details>
            </div>
          ` : ''}
        </div>
        <div class="cleanable-size">${item.sizeFormatted}</div>
      </div>
    `).join('');
  }

  renderLargeFiles(files) {
    const container = document.getElementById('largeFilesList');
    
    if (!files || files.length === 0) {
      container.innerHTML = '<div class="empty-state"><p>未发现大文件</p></div>';
      return;
    }
    
    container.innerHTML = `
      <table class="data-table">
        <thead>
          <tr>
            <th>文件路径</th>
            <th>大小</th>
            <th>修改时间</th>
          </tr>
        </thead>
        <tbody>
          ${files.map(file => `
            <tr>
              <td title="${file.path}">${file.path}</td>
              <td>${file.sizeFormatted}</td>
              <td>${new Date(file.lastModified).toLocaleString('zh-CN')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  renderSuggestions(suggestions) {
    const container = document.getElementById('suggestionsList');
    
    if (!suggestions || suggestions.length === 0) {
      container.innerHTML = '<div class="empty-state"><p>暂无优化建议</p></div>';
      return;
    }
    
    container.innerHTML = suggestions.map(sugg => `
      <div class="suggestion-item">
        <div class="suggestion-header">
          <span class="suggestion-title">${sugg.title}</span>
          <span class="suggestion-saving">可释放 ${sugg.potentialSavingFormatted}</span>
        </div>
        <div class="suggestion-description">${sugg.description}</div>
        <div class="suggestion-status">
          <strong>当前状态:</strong> ${sugg.currentStatus}
        </div>
        <div class="suggestion-impact">
          <strong>影响:</strong> ${sugg.impact}
        </div>
      </div>
    `).join('');
  }

  getRiskLabel(riskLevel) {
    const labels = {
      'safe': '安全',
      'caution': '谨慎',
      'danger': '危险'
    };
    return labels[riskLevel] || riskLevel;
  }

  async quickClean() {
    // 获取所有选中的项目（包括安全可删和谨慎删除）
    const checkboxes = document.querySelectorAll('.cleanable-item input[type="checkbox"]:checked');
    const itemIds = Array.from(checkboxes).map(cb => cb.id.replace('clean-', ''));
    
    if (itemIds.length === 0) {
      alert('请先选择要清理的项目');
      return;
    }
    
    // 计算选中项目的总大小
    let totalSelectedSize = 0;
    checkboxes.forEach(cb => {
      const item = cb.closest('.cleanable-item');
      if (item) {
        const sizeText = item.querySelector('.cleanable-size')?.textContent || '0 B';
        totalSelectedSize += this.parseFileSize(sizeText);
      }
    });
    
    // 检查是否有谨慎删除的项目
    const cautionItems = Array.from(checkboxes).filter(cb => {
      const item = cb.closest('.cleanable-item');
      return item && item.dataset.risk === 'caution';
    });
    
    let confirmed = true;
    if (cautionItems.length > 0) {
      confirmed = confirm(`选中的项目中包含 ${cautionItems.length} 个需要谨慎删除的项目。\n\n即将清理 ${itemIds.length} 个项目，共 ${this.formatFileSize(totalSelectedSize)}\n\n此操作不可恢复！`);
    } else {
      confirmed = confirm(`确定要清理选中的 ${itemIds.length} 个项目吗？\n\n共 ${this.formatFileSize(totalSelectedSize)}\n\n此操作不可恢复！`);
    }
    
    if (!confirmed) return;
    
    try {
      this.showLoading(`正在清理 ${itemIds.length} 个项目...`);
      console.log('[C盘优化] 开始清理，项目ID:', itemIds);
      console.log('[C盘优化] 预计释放空间:', this.formatFileSize(totalSelectedSize));
      
      const startTime = Date.now();
      const result = await window.electronAPI.cleanDiskItems(itemIds);
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      
      console.log('[C盘优化] 清理结果:', result);
      
      if (result.success) {
        const successCount = result.results?.filter(r => r.success).length || 0;
        const failCount = result.results?.length - successCount || 0;
        
        let message = `清理完成！\n\n`;
        message += `✅ 成功: ${successCount} 个项目\n`;
        if (failCount > 0) {
          message += `❌ 失败: ${failCount} 个项目\n`;
        }
        message += `📊 释放空间: ${result.totalCleanedFormatted}\n`;
        message += `⏱️ 耗时: ${duration}秒`;
        
        if (result.restorePointId) {
          message += `\n\n💾 已创建系统还原点: ${result.restorePointId}`;
        }
        
        alert(message);
        
        // 重新分析
        await this.analyzeDisk();
      } else {
        alert('清理过程中出现错误: ' + (result.error || '未知错误'));
      }
    } catch (error) {
      console.error('清理失败:', error);
      alert('清理失败: ' + error.message);
    } finally {
      this.hideLoading();
    }
  }

  /**
   * 解析文件大小字符串
   */
  parseFileSize(sizeStr) {
    const match = sizeStr.match(/^([\d.]+)\s*(B|KB|MB|GB|TB)$/i);
    if (!match) return 0;
    
    const value = parseFloat(match[1]);
    const unit = match[2].toUpperCase();
    
    const units = { 'B': 1, 'KB': 1024, 'MB': 1024*1024, 'GB': 1024*1024*1024, 'TB': 1024*1024*1024*1024 };
    
    return value * (units[unit] || 1);
  }
}

const app = new App();
