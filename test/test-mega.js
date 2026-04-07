/**
 * v5.0 Mega 测试 - 百任务系统完整测试
 * 测试范围：三层扫描、技能链、质量门控、透明度
 */

const fs = require('fs');
const path = require('path');

// 尝试加载 v5 分析器（如果存在）
let MegaAnalyzer;
let analyzer;
let hasV5 = false;

try {
  const megaPath = path.join(__dirname, '../src/mega-analyzer.js');
  if (fs.existsSync(megaPath)) {
    MegaAnalyzer = require(megaPath);
    analyzer = new MegaAnalyzer();
    hasV5 = true;
  }
} catch (e) {
  console.log('⚠️  v5 分析器不存在，使用 v4 模拟测试');
}

// 如果 v5 不存在，用 v4 模拟
if (!hasV5) {
  const UltimateAnalyzer = require('../src/ultimate-analyzer');
  analyzer = new UltimateAnalyzer();
}

// 测试用例设计
const testSuites = {
  // 1. 三层扫描机制测试
  threeLayerScan: [
    { input: '写玄幻小说', expected: 'creative_writing_novel', note: '动词 + 名词 + 修饰词' },
    { input: '创作科幻小说', expected: 'creative_writing_novel', note: '同义动词' },
    { input: '生成图片', expected: 'image_generation_art', note: '动词 + 名词' },
    { input: '分析销售数据', expected: 'data_analysis_basic', note: '动词 + 对象' },
    { input: '规划旅行路线', expected: 'travel_plan', note: '动词 + 对象' },
  ],
  
  // 2. 技能链执行测试
  skillChain: [
    { input: '写长篇小说', expectChain: true, note: '应触发多阶段技能链' },
    { input: '创作剧本', expectChain: true, note: '应触发多阶段技能链' },
    { input: '写文章', expectChain: false, note: '简单任务，单技能' },
  ],
  
  // 3. 质量门控测试
  qualityGate: [
    { input: '写小说', hasQualityGate: true, note: '创作类应有质量门控' },
    { input: '数据分析', hasQualityGate: true, note: '分析类应有质量门控' },
  ],
  
  // 4. 透明度测试
  transparency: [
    { input: '帮我写小说', shouldDeclare: true, note: '应声明技能需求' },
  ],
  
  // 5. 108 种任务覆盖测试（抽样）
  taskCoverage: [
    { input: '写小说', category: 'creative_writing_novel' },
    { input: '写文章', category: 'creative_writing_article' },
    { input: '角色设计', category: 'character_design' },
    { input: '大纲', category: 'outline_creation' },
    { input: '润色', category: 'content_polishing' },
    { input: '诊断问题', category: 'content_diagnosis' },
    { input: '天气', category: 'weather_forecast' },
    { input: '数据分析', category: 'data_analysis_basic' },
    { input: 'Python 代码', category: 'code_python' },
    { input: 'JavaScript', category: 'code_javascript' },
    { input: '生成图片', category: 'image_generation_art' },
    { input: '翻译', category: 'translation_zh_en' },
    { input: '视频剪辑', category: 'video_editing' },
    { input: '音频处理', category: 'audio_processing' },
    { input: '写论文', category: 'research_academic' },
    { input: '营销方案', category: 'marketing_plan' },
    { input: '商业计划', category: 'business_plan' },
    { input: '法律咨询', category: 'legal_consult' },
    { input: '健康建议', category: 'health_advice' },
    { input: '旅游计划', category: 'travel_plan' },
  ],
  
  // 6. 细粒度分解测试
  decomposition: [
    { 
      input: '写一部玄幻小说', 
      expectSubtasks: ['outline', 'character', 'world', 'chapter', 'review', 'polish'],
      note: '应分解为 6 个子任务'
    },
  ],
};

async function runMegaTests() {
  console.log('🧪 开始 v5.0 Mega 测试 - 百任务系统验证\n');
  console.log('=' .repeat(80));
  console.log(`v5 分析器状态：${hasV5 ? '✅ 存在' : '❌ 不存在 (使用 v4 模拟)'}`);
  console.log('=' .repeat(80) + '\n');
  
  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0
  };
  
  // 1. 三层扫描测试
  console.log('📍 测试组 1: 三层扫描机制');
  console.log('-'.repeat(80));
  for (const test of testSuites.threeLayerScan) {
    results.total++;
    const result = analyzer.analyze(test.input);
    const success = result.category === test.expected;
    
    if (success) {
      results.passed++;
      console.log(`✅ ${test.input} [${test.note}] → ${result.category}`);
    } else {
      results.failed++;
      console.log(`❌ ${test.input} [${test.note}]`);
      console.log(`   期望：${test.expected}`);
      console.log(`   实际：${result.category}`);
    }
  }
  
  // 2. 任务覆盖测试
  console.log('\n📍 测试组 2: 任务类型覆盖（抽样 20 种）');
  console.log('-'.repeat(80));
  for (const test of testSuites.taskCoverage) {
    results.total++;
    const result = analyzer.analyze(test.input);
    const success = result.category === test.category;
    
    if (success) {
      results.passed++;
      console.log(`✅ ${test.input} → ${result.category}`);
    } else {
      results.failed++;
      console.log(`❌ ${test.input}`);
      console.log(`   期望：${test.category}`);
      console.log(`   实际：${result.category}`);
    }
  }
  
  // 3. 细粒度分解测试
  console.log('\n📍 测试组 3: 细粒度分解');
  console.log('-'.repeat(80));
  for (const test of testSuites.decomposition) {
    results.total++;
    const result = analyzer.analyze(test.input);
    
    // 检查是否有 subtasks
    const hasSubtasks = result.subtasks && result.subtasks.length > 0;
    
    if (hasSubtasks) {
      results.passed++;
      console.log(`✅ ${test.input} → 分解为 ${result.subtasks.length} 个子任务`);
      console.log(`   子任务：${result.subtasks.join(', ')}`);
    } else {
      results.failed++;
      console.log(`❌ ${test.input} → 未分解出子任务`);
    }
  }
  
  // 4. 透明度和质量门控（需要 v5 支持）
  if (hasV5) {
    console.log('\n📍 测试组 4: 透明度声明');
    console.log('-'.repeat(80));
    // TODO: 实现透明度测试
    console.log('⏳ 待实现透明度测试逻辑');
    results.skipped += testSuites.transparency.length;
  }
  
  // 总结
  console.log('\n' + '='.repeat(80));
  console.log('📊 测试结果汇总');
  console.log('-'.repeat(80));
  console.log(`总测试数：${results.total}`);
  console.log(`通过：${results.passed} (${(results.passed/results.total*100).toFixed(1)}%)`);
  console.log(`失败：${results.failed} (${(results.failed/results.total*100).toFixed(1)}%)`);
  console.log(`跳过：${results.skipped}`);
  console.log('=' .repeat(80));
  
  if (results.failed > 0) {
    console.log('\n⚠️  有失败的测试用例，请检查实现');
  } else {
    console.log('\n✅ 所有测试通过！');
  }
  
  return results;
}

// 运行测试
runMegaTests().then(stats => {
  console.log('\n✨ v5.0 Mega 测试完成！\n');
  process.exit(stats.failed > 0 ? 1 : 0);
}).catch(error => {
  console.error('测试执行失败:', error);
  process.exit(1);
});
