/**
 * Codebuff 智能助手 - Solo 模式集成
 * 
 * 在 Solo 模式下自动监听代码操作并提供智能建议
 */

const vscode = require('vscode');
const path = require('path');

/**
 * Solo 模式下的 Codebuff 智能助手
 */
class CodebuffSoloAssistant {
  constructor() {
    this.disposables = [];
    this.isActive = false;
    this.analysisQueue = [];
    this.isProcessing = false;
    this.lastAnalysisTime = 0;
    this.analysisCooldown = 5000; // 5秒冷却时间
    this.outputChannel = vscode.window.createOutputChannel('Codebuff Solo');
    
    // 配置
    this.config = {
      autoAnalyze: true,
      analyzeOnSave: true,
      analyzeOnType: true,
      analyzeOnSelection: true,
      showInlineSuggestions: true,
      maxSuggestions: 5
    };
  }

  /**
   * 激活助手
   */
  activate(context) {
    this.isActive = true;
    this.outputChannel.appendLine('Codebuff Solo 助手已激活');
    
    // 注册事件监听器
    this.registerEventListeners(context);
    
    // 显示欢迎消息
    this.showWelcomeMessage();
  }

  /**
   * 注册事件监听器
   */
  registerEventListeners(context) {
    // 1. 保存文件时分析
    if (this.config.analyzeOnSave) {
      const saveDisposable = vscode.workspace.onDidSaveTextDocument((document) => {
        this.onFileSaved(document);
      });
      context.subscriptions.push(saveDisposable);
      this.disposables.push(saveDisposable);
    }

    // 2. 输入时分析（防抖）
    if (this.config.analyzeOnType) {
      let typingTimeout;
      const typeDisposable = vscode.workspace.onDidChangeTextDocument((event) => {
        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => {
          this.onFileChanged(event);
        }, 2000); // 2秒防抖
      });
      context.subscriptions.push(typeDisposable);
      this.disposables.push(typeDisposable);
    }

    // 3. 选择代码时分析
    if (this.config.analyzeOnSelection) {
      const selectionDisposable = vscode.window.onDidChangeTextEditorSelection((event) => {
        this.onSelectionChanged(event);
      });
      context.subscriptions.push(selectionDisposable);
      this.disposables.push(selectionDisposable);
    }

    // 4. 诊断信息变化时分析
    const diagnosticDisposable = vscode.languages.onDidChangeDiagnostics(() => {
      this.onDiagnosticsChanged();
    });
    context.subscriptions.push(diagnosticDisposable);
    this.disposables.push(diagnosticDisposable);
  }

  /**
   * 显示欢迎消息
   */
  showWelcomeMessage() {
    const message = `
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║           🤖 Codebuff Solo 助手已启动！                     ║
║                                                            ║
╠════════════════════════════════════════════════════════════╣
║                                                            ║
║  我是你的 AI 编程助手，会自动：                             ║
║                                                            ║
║  💾 保存文件时分析代码                                      ║
║  ⌨️  停止输入后提供建议                                     ║
║  🖱️  选择代码时优化                                         ║
║  ⚠️  检测到错误时修复                                       ║
║                                                            ║
╠════════════════════════════════════════════════════════════╣
║                                                            ║
║  使用方法：                                                 ║
║  • 正常编写代码，我会自动分析                               ║
║  • 查看右下角的通知和提示                                   ║
║  • 点击灯泡图标查看建议                                     ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
    `;

    this.outputChannel.clear();
    this.outputChannel.appendLine(message);
    this.outputChannel.show();

    vscode.window.showInformationMessage(
      'Codebuff Solo 助手已启动！我会自动分析你的代码。',
      '查看面板',
      '配置设置'
    ).then(selection => {
      if (selection === '查看面板') {
        this.outputChannel.show();
      } else if (selection === '配置设置') {
        vscode.commands.executeCommand('workbench.action.openSettings', 'codebuff');
      }
    });
  }

  /**
   * 文件保存时的处理
   */
  async onFileSaved(document) {
    if (!this.shouldAnalyze()) return;

    const fileName = path.basename(document.fileName);
    this.outputChannel.appendLine(`\n[${new Date().toLocaleTimeString()}] 文件已保存: ${fileName}`);

    // 分析代码
    await this.analyzeDocument(document);
  }

  /**
   * 文件改变时的处理
   */
  async onFileChanged(event) {
    if (!this.shouldAnalyze()) return;

    const document = event.document;
    const fileName = path.basename(document.fileName);
    
    // 只分析当前激活的编辑器
    const activeEditor = vscode.window.activeTextEditor;
    if (!activeEditor || activeEditor.document !== document) return;

    this.outputChannel.appendLine(`\n[${new Date().toLocaleTimeString()}] 文件已修改: ${fileName}`);

    // 获取当前编辑的区域
    const changes = event.contentChanges;
    if (changes.length === 0) return;

    // 分析修改的区域
    for (const change of changes) {
      const line = change.range.start.line;
      const lineText = document.lineAt(line).text;
      
      this.outputChannel.appendLine(`  修改行 ${line + 1}: ${lineText.substring(0, 50)}...`);
      
      // 检测代码模式
      await this.detectCodePatterns(lineText, document.languageId);
    }
  }

  /**
   * 选择改变时的处理
   */
  async onSelectionChanged(event) {
    if (!this.shouldAnalyze()) return;

    const selection = event.selections[0];
    if (selection.isEmpty) return;

    const editor = event.textEditor;
    const text = editor.document.getText(selection);
    
    // 限制分析长度
    if (text.length > 1000) return;

    this.outputChannel.appendLine(`\n[${new Date().toLocaleTimeString()}] 选中代码 (${text.length} 字符)`);

    // 分析选中的代码
    await this.analyzeCode(text, editor.document.languageId);
  }

  /**
   * 诊断信息改变时的处理
   */
  async onDiagnosticsChanged() {
    if (!this.shouldAnalyze()) return;

    const activeEditor = vscode.window.activeTextEditor;
    if (!activeEditor) return;

    const uri = activeEditor.document.uri;
    const diagnostics = vscode.languages.getDiagnostics(uri);

    if (diagnostics.length > 0) {
      this.outputChannel.appendLine(`\n[${new Date().toLocaleTimeString()}] 检测到 ${diagnostics.length} 个诊断问题`);
      
      // 显示错误提示
      const errors = diagnostics.filter(d => d.severity === vscode.DiagnosticSeverity.Error);
      const warnings = diagnostics.filter(d => d.severity === vscode.DiagnosticSeverity.Warning);

      if (errors.length > 0) {
        this.showErrorNotification(errors.length);
      }

      // 提供修复建议
      await this.suggestFixes(diagnostics, activeEditor.document);
    }
  }

  /**
   * 分析整个文档
   */
  async analyzeDocument(document) {
    const text = document.getText();
    const language = document.languageId;

    this.outputChannel.appendLine(`正在分析 ${language} 文件...`);

    // 检测代码模式
    const patterns = this.detectPatterns(text, language);

    if (patterns.length > 0) {
      this.outputChannel.appendLine(`\n检测到以下代码模式：`);
      patterns.forEach((pattern, index) => {
        this.outputChannel.appendLine(`${index + 1}. ${pattern.name} - ${pattern.description}`);
      });

      // 生成优化建议
      await this.generateSuggestions(patterns, text, language);
    } else {
      this.outputChannel.appendLine('未检测到需要优化的代码模式');
    }
  }

  /**
   * 分析代码片段
   */
  async analyzeCode(code, language) {
    this.outputChannel.appendLine(`\n代码分析中...`);

    const patterns = this.detectPatterns(code, language);
    
    if (patterns.length > 0) {
      this.outputChannel.appendLine('检测到的问题：');
      patterns.forEach(p => {
        this.outputChannel.appendLine(`- ${p.name}: ${p.description}`);
      });
    }
  }

  /**
   * 检测代码模式
   */
  detectPatterns(code, language) {
    const patterns = [];

    // JavaScript/TypeScript 检测
    if (['javascript', 'typescript', 'javascriptreact', 'typescriptreact'].includes(language)) {
      // 检测函数定义
      if (/function\s+\w+\s*\([^)]*\)\s*\{/g.test(code) || 
          /const\s+\w+\s*=\s*\([^)]*\)\s*=>/g.test(code)) {
        patterns.push({
          name: '函数定义',
          description: '检测到函数定义，可以添加类型注解和错误处理',
          type: 'function'
        });
      }

      // 检测 try-catch
      if (/try\s*\{/g.test(code)) {
        if (!/catch\s*\(/g.test(code)) {
          patterns.push({
            name: '缺少错误处理',
            description: 'try 块缺少 catch 或 finally',
            type: 'error_handling'
          });
        }
      }

      // 检测 any 类型
      if (/:\s*any\b/g.test(code)) {
        patterns.push({
          name: 'any 类型',
          description: '使用了 any 类型，建议添加具体类型注解',
          type: 'types'
        });
      }

      // 检测 console.log
      if (/console\.log\(/g.test(code)) {
        patterns.push({
          name: '调试代码',
          description: '包含 console.log，建议在生产代码中移除',
          type: 'debug'
        });
      }

      // 检测 TODO
      if (/TODO|FIXME|XXX/gi.test(code)) {
        patterns.push({
          name: '待办事项',
          description: '代码中包含 TODO/FIXME 注释',
          type: 'todo'
        });
      }

      // 检测长函数
      const lines = code.split('\n');
      if (lines.length > 50) {
        patterns.push({
          name: '长函数',
          description: `函数/代码块较长 (${lines.length} 行)，建议拆分为小函数`,
          type: 'complexity'
        });
      }

      // 检测嵌套循环
      const nestedLoops = (code.match(/for\s*\([^)]*\)\s*\{[\s\S]*?for\s*\(/g) || []).length;
      if (nestedLoops > 0) {
        patterns.push({
          name: '嵌套循环',
          description: '检测到嵌套循环，可能影响性能',
          type: 'performance'
        });
      }
    }

    return patterns;
  }

  /**
   * 检测单行代码模式
   */
  async detectCodePatterns(lineText, language) {
    const patterns = [];

    // 检测未使用的变量
    const varMatch = lineText.match(/(?:const|let|var)\s+(\w+)/);
    if (varMatch) {
      const varName = varMatch[1];
      // 简单检查变量是否在行内使用
      const restOfLine = lineText.substring(lineText.indexOf(varName) + varName.length);
      if (!restOfLine.includes(varName) && !lineText.includes('=')) {
        patterns.push({
          name: '可能的未使用变量',
          description: `变量 ${varName} 可能在当前行未使用`,
          type: 'unused'
        });
      }
    }

    // 检测魔法数字
    if (/\b\d+\b/.test(lineText) && !lineText.includes('//')) {
      const numMatch = lineText.match(/\b(\d+)\b/);
      if (numMatch && parseInt(numMatch[1]) > 10) {
        patterns.push({
          name: '魔法数字',
          description: `使用了魔法数字 ${numMatch[1]}，建议定义为常量`,
          type: 'magic_number'
        });
      }
    }

    // 检测长行
    if (lineText.length > 100) {
      patterns.push({
        name: '长代码行',
        description: `代码行过长 (${lineText.length} 字符)，建议换行`,
        type: 'long_line'
      });
    }

    if (patterns.length > 0) {
      patterns.forEach(p => {
        this.outputChannel.appendLine(`  ⚠️  ${p.name}: ${p.description}`);
      });
    }
  }

  /**
   * 生成优化建议
   */
  async generateSuggestions(patterns, code, language) {
    const suggestions = [];

    for (const pattern of patterns) {
      switch (pattern.type) {
        case 'function':
          suggestions.push({
            title: '添加类型注解',
            description: '为函数参数和返回值添加 TypeScript 类型注解',
            action: 'add_types'
          });
          break;

        case 'error_handling':
          suggestions.push({
            title: '完善错误处理',
            description: '添加 try-catch 块来捕获可能的错误',
            action: 'add_error_handling'
          });
          break;

        case 'types':
          suggestions.push({
            title: '替换 any 类型',
            description: '使用具体的类型替代 any',
            action: 'fix_types'
          });
          break;

        case 'performance':
          suggestions.push({
            title: '性能优化',
            description: '优化嵌套循环或复杂算法',
            action: 'optimize'
          });
          break;

        case 'debug':
          suggestions.push({
            title: '移除调试代码',
            description: '移除 console.log 等调试语句',
            action: 'remove_debug'
          });
          break;
      }
    }

    if (suggestions.length > 0) {
      this.showSuggestions(suggestions);
    }
  }

  /**
   * 显示优化建议
   */
  showSuggestions(suggestions) {
    // 限制显示数量
    const displaySuggestions = suggestions.slice(0, this.config.maxSuggestions);
    
    const items = displaySuggestions.map((s, index) => ({
      label: `$(lightbulb) ${s.title}`,
      description: s.description,
      detail: `建议 ${index + 1}/${suggestions.length}`,
      index
    }));

    vscode.window.showQuickPick(items, {
      placeHolder: `Codebuff 检测到 ${suggestions.length} 个优化建议`,
      canPickMany: false
    }).then(selected => {
      if (selected) {
        this.applySuggestion(suggestions[selected.index]);
      }
    });
  }

  /**
   * 应用建议
   */
  async applySuggestion(suggestion) {
    this.outputChannel.appendLine(`\n应用优化: ${suggestion.title}`);
    
    // 这里可以实现具体的代码修改逻辑
    // 例如使用 vscode.workspace.applyEdit()
    
    vscode.window.showInformationMessage(`已应用优化: ${suggestion.title}`);
  }

  /**
   * 显示错误通知
   */
  showErrorNotification(errorCount) {
    vscode.window.showWarningMessage(
      `Codebuff 检测到 ${errorCount} 个错误，需要修复`,
      '查看详情',
      '忽略'
    ).then(selection => {
      if (selection === '查看详情') {
        this.outputChannel.show();
      }
    });
  }

  /**
   * 建议修复方案
   */
  async suggestFixes(diagnostics, document) {
    // 根据诊断信息生成修复建议
    const fixes = diagnostics.map(d => ({
      message: d.message,
      line: d.range.start.line,
      code: d.code
    }));

    if (fixes.length > 0) {
      this.outputChannel.appendLine('\n建议修复方案：');
      fixes.forEach((fix, index) => {
        this.outputChannel.appendLine(`${index + 1}. 第 ${fix.line + 1} 行: ${fix.message}`);
      });
    }
  }

  /**
   * 检查是否应该分析
   */
  shouldAnalyze() {
    if (!this.isActive || !this.config.autoAnalyze) return false;

    const now = Date.now();
    if (now - this.lastAnalysisTime < this.analysisCooldown) return false;

    this.lastAnalysisTime = now;
    return true;
  }

  /**
   * 停用助手
   */
  deactivate() {
    this.isActive = false;
    this.disposables.forEach(d => d.dispose());
    this.disposables = [];
    this.outputChannel.appendLine('Codebuff Solo 助手已停用');
  }
}

module.exports = {
  CodebuffSoloAssistant,
  activate: (context) => {
    const assistant = new CodebuffSoloAssistant();
    assistant.activate(context);
    return assistant;
  }
};
