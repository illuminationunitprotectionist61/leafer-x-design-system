/**
 * 基础使用示例
 * 
 * 演示如何在其他项目中使用 leafer-design-system
 */

const {
  generateDesignSystem,
  renderTemplate,
  createGenerator,
  createRenderer
} = require('../index');

async function basicExample() {
  console.log('🎨 基础使用示例\n');

  // 1. 快速生成设计系统
  console.log('1️⃣ 生成设计系统...');
  const designSystem = generateDesignSystem({
    name: 'My Awesome App',
    primaryColor: '#3b82f6',
    secondaryColor: '#8b5cf6',
    mode: 'light'
  }, './output/my-app-design');

  console.log('✅ 设计系统生成成功!');
  console.log(`   名称: ${designSystem.name}`);
  console.log(`   版本: ${designSystem.version}`);
  console.log(`   模板数量: ${Object.keys(designSystem.templates).length}\n`);

  // 2. 渲染移动端登录页
  console.log('2️⃣ 渲染移动端登录页...');
  const mobileLogin = designSystem.templates.mobile.login;
  const result = await renderTemplate(mobileLogin, {
    outputDir: './output/examples',
    format: 'png'
  });

  console.log('✅ 渲染成功!');
  console.log(`   图片路径: ${result.url}`);
  console.log(`   渲染时间: ${result.renderTime}ms\n`);
}

async function advancedExample() {
  console.log('🚀 高级自定义示例\n');

  // 1. 创建自定义生成器
  console.log('1️⃣ 创建自定义生成器...');
  const generator = createGenerator({
    name: 'Custom Design System',
    primaryColor: '#10b981',
    secondaryColor: '#f59e0b',
    mode: 'dark'
  });

  // 2. 获取组件生成器
  const componentGen = generator.componentGen;

  // 3. 生成自定义组件
  console.log('2️⃣ 生成自定义组件...');
  
  // 生成表格
  const table = componentGen.generateTable(
    ['产品', '价格', '库存', '状态'],
    [
      ['iPhone 15', '¥5999', '100', '有货'],
      ['iPad Pro', '¥7999', '50', '有货'],
      ['MacBook Pro', '¥14999', '20', '缺货']
    ],
    { width: 600, x: 50, y: 50 }
  );

  // 生成模态框
  const modal = componentGen.generateModal(
    '确认订单',
    '您确定要提交此订单吗？总计: ¥28,997',
    { x: 200, y: 150 }
  );

  // 4. 渲染组件
  console.log('3️⃣ 渲染组件...');
  const renderer = createRenderer({ outputDir: './output/examples' });

  // 渲染表格
  const tableResult = await renderer.render({
    width: 700,
    height: 300,
    elements: [table],
    options: { format: 'png', backgroundColor: '#f9fafb' }
  });

  console.log('✅ 表格渲染成功!');
  console.log(`   图片路径: ${tableResult.url}\n`);

  // 渲染模态框
  const modalResult = await renderer.render({
    width: 800,
    height: 600,
    elements: [modal],
    options: { format: 'png', backgroundColor: '#f3f4f6' }
  });

  console.log('✅ 模态框渲染成功!');
  console.log(`   图片路径: ${modalResult.url}\n`);
}

async function batchRenderExample() {
  console.log('📦 批量渲染示例\n');

  // 1. 生成设计系统
  const generator = createGenerator({
    name: 'Batch Example',
    primaryColor: '#ec4899',
    secondaryColor: '#6366f1'
  });

  const designSystem = generator.generate();

  // 2. 准备批量渲染的模板
  const templates = [
    { ...designSystem.templates.mobile.login, name: 'mobile-login' },
    { ...designSystem.templates.mobile.home, name: 'mobile-home' },
    { ...designSystem.templates.tablet.dashboard, name: 'tablet-dashboard' }
  ];

  // 3. 批量渲染
  console.log(`开始批量渲染 ${templates.length} 个模板...\n`);
  
  const { renderTemplates } = require('../index');
  const results = await renderTemplates(templates, {
    outputDir: './output/examples/batch'
  });

  // 4. 输出结果
  console.log('📊 批量渲染结果:\n');
  results.forEach((result, i) => {
    if (result.success) {
      console.log(`✅ ${result.template}: ${result.result.url}`);
    } else {
      console.log(`❌ ${result.template}: ${result.error}`);
    }
  });
}

// 运行示例
async function main() {
  try {
    await basicExample();
    console.log('\n' + '='.repeat(50) + '\n');
    
    await advancedExample();
    console.log('\n' + '='.repeat(50) + '\n');
    
    await batchRenderExample();
    
    console.log('\n🎉 所有示例运行完成!');
  } catch (error) {
    console.error('❌ 错误:', error.message);
    console.error(error.stack);
  }
}

main();
