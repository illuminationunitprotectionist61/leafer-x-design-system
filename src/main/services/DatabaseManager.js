const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs-extra');

class DatabaseManager {
  constructor(userDataPath) {
    this.dbPath = path.join(userDataPath, 'assistant.db');
    this.db = null;
    this.SQL = null;
  }

  async initialize() {
    await fs.ensureDir(path.dirname(this.dbPath));
    
    this.SQL = await initSqlJs();
    
    let dbBuffer = null;
    if (await fs.pathExists(this.dbPath)) {
      dbBuffer = await fs.readFile(this.dbPath);
    }
    
    this.db = new this.SQL.Database(dbBuffer);
    this.createTables();
    
    this.saveDatabase();
  }

  createTables() {
    this.db.run(`
      CREATE TABLE IF NOT EXISTS files (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        path TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        extension TEXT,
        size INTEGER,
        hash TEXT,
        created_time TEXT,
        modified_time TEXT,
        exif_date TEXT,
        file_type TEXT,
        thumbnail_path TEXT,
        indexed_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    this.db.run(`
      CREATE TABLE IF NOT EXISTS duplicates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        hash TEXT NOT NULL,
        file_paths TEXT NOT NULL,
        size INTEGER,
        detected_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    this.db.run(`
      CREATE TABLE IF NOT EXISTS transfers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        file_path TEXT NOT NULL,
        file_name TEXT NOT NULL,
        file_size INTEGER,
        direction TEXT NOT NULL,
        device_name TEXT,
        device_ip TEXT,
        status TEXT NOT NULL,
        started_at TEXT DEFAULT CURRENT_TIMESTAMP,
        completed_at TEXT,
        error_message TEXT
      )
    `);

    this.db.run(`
      CREATE TABLE IF NOT EXISTS devices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        ip TEXT NOT NULL,
        user_agent TEXT,
        first_seen TEXT DEFAULT CURRENT_TIMESTAMP,
        last_seen TEXT DEFAULT CURRENT_TIMESTAMP,
        is_trusted INTEGER DEFAULT 0
      )
    `);

    this.db.run(`
      CREATE TABLE IF NOT EXISTS organize_rules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        rule_type TEXT NOT NULL,
        pattern TEXT,
        target_folder TEXT,
        is_active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    this.db.run(`
      CREATE TABLE IF NOT EXISTS cleanup_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
        total_cleaned INTEGER,
        items TEXT
      )
    `);

    // 新的清理历史表（更详细的记录）
    this.db.run(`
      CREATE TABLE IF NOT EXISTS cleanup_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
        items_count INTEGER DEFAULT 0,
        total_size INTEGER DEFAULT 0,
        freed_space INTEGER DEFAULT 0,
        items_json TEXT,
        files_json TEXT,
        restore_point_id TEXT,
        restore_point_description TEXT,
        status TEXT DEFAULT 'completed',
        is_restorable INTEGER DEFAULT 1,
        restored_at TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    this.saveDatabase();
  }

  saveDatabase() {
    try {
      const data = this.db.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(this.dbPath, buffer);
    } catch (error) {
      console.error('保存数据库失败:', error);
    }
  }

  run(sql, params = []) {
    try {
      this.db.run(sql, params);
      this.saveDatabase();
      return { changes: this.db.getRowsModified() };
    } catch (error) {
      console.error('SQL执行错误:', error, sql);
      throw error;
    }
  }

  query(sql, params = []) {
    try {
      const stmt = this.db.prepare(sql);
      if (params.length > 0) {
        stmt.bind(params);
      }
      
      const results = [];
      while (stmt.step()) {
        const row = stmt.getAsObject();
        results.push(row);
      }
      stmt.free();
      return results;
    } catch (error) {
      console.error('SQL查询错误:', error, sql);
      return [];
    }
  }

  queryOne(sql, params = []) {
    const results = this.query(sql, params);
    return results.length > 0 ? results[0] : null;
  }

  addFile(fileData) {
    this.run(`
      INSERT OR REPLACE INTO files 
      (path, name, extension, size, hash, created_time, modified_time, exif_date, file_type, thumbnail_path)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      fileData.path,
      fileData.name,
      fileData.extension,
      fileData.size,
      fileData.hash,
      fileData.created_time ? fileData.created_time.toISOString() : null,
      fileData.modified_time ? fileData.modified_time.toISOString() : null,
      fileData.exif_date ? fileData.exif_date.toISOString() : null,
      fileData.file_type,
      fileData.thumbnail_path
    ]);
  }

  getFileByPath(filePath) {
    return this.queryOne('SELECT * FROM files WHERE path = ?', [filePath]);
  }

  getFileByHash(hash) {
    return this.query('SELECT * FROM files WHERE hash = ?', [hash]);
  }

  getFilesByDateRange(startDate, endDate) {
    return this.query(`
      SELECT * FROM files 
      WHERE (exif_date IS NOT NULL AND exif_date BETWEEN ? AND ?)
         OR (exif_date IS NULL AND created_time BETWEEN ? AND ?)
      ORDER BY COALESCE(exif_date, created_time) DESC
    `, [startDate, endDate, startDate, endDate]);
  }

  getFilesByType(fileType) {
    return this.query('SELECT * FROM files WHERE file_type = ? ORDER BY created_time DESC', [fileType]);
  }

  searchFiles(keyword) {
    const searchTerm = `%${keyword}%`;
    return this.query(`
      SELECT * FROM files 
      WHERE name LIKE ? OR path LIKE ?
      ORDER BY modified_time DESC
    `, [searchTerm, searchTerm]);
  }

  addDuplicate(hash, filePaths, size) {
    this.run(`
      INSERT OR REPLACE INTO duplicates (hash, file_paths, size)
      VALUES (?, ?, ?)
    `, [hash, JSON.stringify(filePaths), size]);
  }

  getDuplicates() {
    const results = this.query('SELECT * FROM duplicates');
    return results.map(r => ({
      ...r,
      file_paths: JSON.parse(r.file_paths || '[]')
    }));
  }

  deleteDuplicate(hash) {
    this.run('DELETE FROM duplicates WHERE hash = ?', [hash]);
  }

  addTransfer(transferData) {
    this.run(`
      INSERT INTO transfers 
      (file_path, file_name, file_size, direction, device_name, device_ip, status, completed_at, error_message)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      transferData.file_path,
      transferData.file_name,
      transferData.file_size,
      transferData.direction,
      transferData.device_name,
      transferData.device_ip,
      transferData.status,
      transferData.completed_at,
      transferData.error_message
    ]);
  }

  updateTransferStatus(id, status, completedAt = null, errorMessage = null) {
    this.run(`
      UPDATE transfers 
      SET status = ?, completed_at = ?, error_message = ?
      WHERE id = ?
    `, [status, completedAt, errorMessage, id]);
  }

  getTransferHistory(limit = 100) {
    return this.query(`
      SELECT * FROM transfers 
      ORDER BY started_at DESC 
      LIMIT ?
    `, [limit]);
  }

  addDevice(deviceData) {
    const existing = this.queryOne('SELECT * FROM devices WHERE ip = ?', [deviceData.ip]);
    
    if (existing) {
      this.run(`
        UPDATE devices SET last_seen = datetime('now'), name = ?, user_agent = ?
        WHERE ip = ?
      `, [deviceData.name, deviceData.user_agent, deviceData.ip]);
    } else {
      this.run(`
        INSERT INTO devices (name, ip, user_agent, first_seen, last_seen)
        VALUES (?, ?, ?, datetime('now'), datetime('now'))
      `, [deviceData.name, deviceData.ip, deviceData.user_agent]);
    }
  }

  getDevices() {
    return this.query('SELECT * FROM devices ORDER BY last_seen DESC');
  }

  setDeviceTrusted(ip, trusted) {
    this.run('UPDATE devices SET is_trusted = ? WHERE ip = ?', [trusted ? 1 : 0, ip]);
  }

  addOrganizeRule(ruleData) {
    this.run(`
      INSERT INTO organize_rules (name, rule_type, pattern, target_folder, is_active)
      VALUES (?, ?, ?, ?, ?)
    `, [
      ruleData.name,
      ruleData.rule_type,
      ruleData.pattern,
      ruleData.target_folder,
      ruleData.is_active ? 1 : 0
    ]);
  }

  getOrganizeRules() {
    return this.query('SELECT * FROM organize_rules WHERE is_active = 1');
  }

  deleteFile(filePath) {
    this.run('DELETE FROM files WHERE path = ?', [filePath]);
  }

  clearFiles() {
    this.run('DELETE FROM files');
  }

  getFileStats() {
    return this.query(`
      SELECT 
        COUNT(*) as total_files,
        SUM(size) as total_size,
        file_type
      FROM files
      GROUP BY file_type
    `);
  }

  addCleanupLog(logData) {
    this.run(`
      INSERT INTO cleanup_logs (timestamp, total_cleaned, items)
      VALUES (?, ?, ?)
    `, [
      logData.timestamp,
      logData.totalCleaned,
      JSON.stringify(logData.items)
    ]);
  }

  getCleanupLogs(limit = 50) {
    const results = this.query(`
      SELECT * FROM cleanup_logs 
      ORDER BY timestamp DESC 
      LIMIT ?
    `, [limit]);
    
    return results.map(r => ({
      ...r,
      items: JSON.parse(r.items || '[]')
    }));
  }

  // ==================== 新的清理历史方法 ====================

  /**
   * 添加清理历史记录
   * @param {Object} historyData - 清理历史数据
   * @returns {number} 新记录的ID
   */
  addCleanupHistory(historyData) {
    const result = this.run(`
      INSERT INTO cleanup_history 
      (items_count, total_size, freed_space, items_json, files_json, 
       restore_point_id, restore_point_description, status, is_restorable)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      historyData.itemsCount || 0,
      historyData.totalSize || 0,
      historyData.freedSpace || 0,
      JSON.stringify(historyData.items || []),
      JSON.stringify(historyData.files || []),
      historyData.restorePointId || null,
      historyData.restorePointDescription || null,
      historyData.status || 'completed',
      historyData.isRestorable !== false ? 1 : 0
    ]);
    
    return result.lastID || result.changes;
  }

  /**
   * 获取清理历史列表
   * @param {number} limit - 限制数量
   * @returns {Array} 清理历史列表
   */
  getCleanupHistory(limit = 50) {
    const results = this.query(`
      SELECT * FROM cleanup_history 
      ORDER BY timestamp DESC 
      LIMIT ?
    `, [limit]);
    
    return results.map(r => ({
      ...r,
      items: JSON.parse(r.items_json || '[]'),
      files: JSON.parse(r.files_json || '[]'),
      isRestorable: r.is_restorable === 1
    }));
  }

  /**
   * 获取单个清理历史记录
   * @param {number} id - 记录ID
   * @returns {Object} 清理历史记录
   */
  getCleanupHistoryById(id) {
    const result = this.queryOne(`
      SELECT * FROM cleanup_history WHERE id = ?
    `, [id]);
    
    if (result) {
      result.items = JSON.parse(result.items_json || '[]');
      result.files = JSON.parse(result.files_json || '[]');
      result.isRestorable = result.is_restorable === 1;
    }
    
    return result;
  }

  /**
   * 更新清理历史状态为已还原
   * @param {number} id - 记录ID
   */
  markCleanupHistoryRestored(id) {
    this.run(`
      UPDATE cleanup_history 
      SET status = 'restored', restored_at = datetime('now'), is_restorable = 0
      WHERE id = ?
    `, [id]);
  }

  /**
   * 删除清理历史记录
   * @param {number} id - 记录ID
   */
  deleteCleanupHistory(id) {
    this.run('DELETE FROM cleanup_history WHERE id = ?', [id]);
  }

  /**
   * 获取清理统计信息
   * @returns {Object} 统计信息
   */
  getCleanupStats() {
    return this.queryOne(`
      SELECT 
        COUNT(*) as total_cleanups,
        SUM(freed_space) as total_freed_space,
        SUM(items_count) as total_items_cleaned
      FROM cleanup_history
      WHERE status = 'completed'
    `);
  }

  close() {
    if (this.db) {
      this.saveDatabase();
      this.db.close();
    }
  }
}

module.exports = DatabaseManager;
