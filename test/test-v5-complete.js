/**
 * v5.0 完整功能测试
 * 测试：三层扫描、技能链、质量门控、透明度
 */

const MegaAnalyzer = require('../src/mega-analyzer');

const analyzer = new MegaAnalyzer();

console.log('🧪 开始 v5.0 完整功能测试\n');
console.log('=' .repeat(80));

const tests = {
  // 1. 三层扫描机制测试
  threeLayerScan: [
    { input: '写玄幻小说', expected: { verb: '写', noun: '小说', modifier: '玄幻' } },
    { input: '创作科幻小说', expected: { verb: '创作', noun: '小说', modifier: '科幻' } },
    { input: '生成图片', expected: { verb: '生成', noun: '图片' } },
    { input: '分析销售数据', expected: { verb: '分析', noun: '数据' } },
    { input: '规划旅行路线', expected: { verb: '规划', noun: '旅行' } },
  ],
  
  // 2. 技能链测试
  skillChain: [
    { input: '写长篇小说', shouldHaveChain: true },
    { input: '创作剧本', shouldHaveChain: true },
    { input: '写文章', shouldHaveChain: true },
    { input: '数据分析', shouldHaveChain: true },
  ],
  
  // 3. 透明度测试
  transparency: [
    { input: '帮我写小说', shouldDeclare: true },
    { input: '分析数据', shouldDeclare: true },
  ],
  
  // 4. 细粒度分解测试
  decomposition: [
    { input: '写一部玄幻小说', expectSubtasks: true },
    { input: '创作文章', expectSubtasks: true },
  ],
};

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

// 测试组 1: 三层扫描机制
console.log('\n📍 测试组 1: 三层扫描机制');
console.log('-'.repeat(80));
for (const test of tests.threeLayerScan) {
  totalTests++;
  const result = analyzer.analyze(test.input);
  
  const hasVerb = result.scanResult?.verbMatch?.verb === test.expected.verb;
  const hasNoun = result.scanResult?.nounMatch?.noun === test.expected.noun;
  const hasModifier = !test.expected.modifier || result.scanResult?.modifierMatch?.modifier === test.expected.modifier;
  
  if (hasVerb && hasNoun && hasModifier) {
    passedTests++;
    console.log(`✅ "${test.input}" → 动词:${test.expected.verb} | 名词:${test.expected.noun} ${test.expected.modifier ? '| 修饰:' + test.expected.modifier : ''}`);
  } else {
    failedTests++;
    console.log(`❌ "${test.input}"`);
    console.log(`   期望：动词=${test.expected.verb}, 名词=${test.expected.noun} ${test.expected.modifier ? '修饰=' + test.expected.modifier : ''}`);
    console.log(`   实际：动词=${result.scanResult?.verbMatch?.verb || '无'}, 名词=${result.scanResult?.nounMatch?.noun || '无'} ${result.scanResult?.modifierMatch ? '修饰=' + result.scanResult.modifierMatch.modifier : ''}`);
  }
}

// 测试组 2: 技能链存在性
console.log('\n📍 测试组 2: 技能链存在性');
console.log('-'.repeat(80));
for (const test of tests.skillChain) {
  totalTests++;
  const result = analyzer.analyze(test.input);
  
  const hasSkillChain = result.skillChain !== null;
  
  if (hasSkillChain === test.shouldHaveChain) {
    passedTests++;
    console.log(`✅ "${test.input}" → ${hasSkillChain ? '有技能链' : '无技能链'}`);
  } else {
    failedTests++;
    console.log(`❌ "${test.input}" → 期望${test.shouldHaveChain ? '有' : '无'}技能链，实际${hasSkillChain ? '有' : '无'}`);
  }
}

// 测试组 3: 透明度声明
console.log('\n📍 测试组 3: 透明度声明');
console.log('-'.repeat(80));
for (const test of tests.transparency) {
  totalTests++;
  const result = analyzer.analyze(test.input);
  
  const hasTransparency = result.transparency !== null;
  
  if (hasTransparency === test.shouldDeclare) {
    passedTests++;
    console.log(`✅ "${test.input}" → 透明度${hasTransparency ? '正常' : '缺失'}`);
    if (result.transparency) {
      console.log(`   识别到 ${result.transparency.skillChain} 个技能，预计耗时 ${result.transparency.estimatedTime} 分钟`);
    }
  } else {
    failedTests++;
    console.log(`❌ "${test.input}" → 期望${test.shouldDeclare ? '有' : '无'}透明度，实际${hasTransparency ? '有' : '无'}`);
  }
}

// 测试组 4: 细粒度分解
console.log('\n📍 测试组 4: 细粒度分解');
console.log('-'.repeat(80));
for (const test of tests.decomposition) {
  totalTests++;
  const result = analyzer.analyze(test.input);
  
  const hasSubtasks = result.subtasks && result.subtasks.length > 0;
  
  if (hasSubtasks === test.expectSubtasks) {
    passedTests++;
    console.log(`✅ "${test.input}" → 分解为 ${result.subtasks.length} 个子任务`);
    if (result.subtasks.length > 0) {
      console.log(`   子任务：${result.subtasks.join(', ')}`);
    }
  } else {
    failedTests++;
    console.log(`❌ "${test.input}" → 期望${test.expectSubtasks ? '有' : '无'}子任务，实际${hasSubtasks ? '有' : '无'}`);
  }
}

// 总结
console.log('\n' + '='.repeat(80));
console.log('📊 测试结果汇总');
console.log('-'.repeat(80));
console.log(`总测试数：${totalTests}`);
console.log(`通过：${passedTests} (${(passedTests/totalTests*100).toFixed(1)}%)`);
console.log(`失败：${failedTests} (${(failedTests/totalTests*100).toFixed(1)}%)`);
console.log('=' .repeat(80));

if (failedTests === 0) {
  console.log('\n✅ 所有 v5.0 功能测试通过！');
} else {
  console.log('\n⚠️  有失败的测试用例');
}

console.log('\n✨ v5.0 完整功能测试完成！\n');

process.exit(failedTests > 0 ? 1 : 0);
