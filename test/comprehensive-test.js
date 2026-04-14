const { analyze, recognize, getSupportedTasks, validateConfig } = require('../index');
const MegaAnalyzer = require('../src/mega-analyzer');
const SkillMatcher = require('../src/skill-matcher');

async function runTests() {
  console.log('='.repeat(70));
  console.log('Intelligent Task Planner v6.0.0 - Comprehensive Test Suite');
  console.log('='.repeat(70));

  // Test 1: Configuration Validation
  console.log('\n[TEST 1] Configuration Validation');
  const config = validateConfig();
  console.log(JSON.stringify(config, null, 2));
  if (!config.valid) {
    console.error('❌ FAIL: Config validation failed');
    process.exit(1);
  }
  console.log('✅ PASS: Configuration valid');

  // Test 2: Intent Recognition Confidence (90%+ requirement)
  console.log('\n[TEST 2] Intent Recognition Confidence');
  const analyzer = new MegaAnalyzer();
  const testCases = [
    { input: '帮我写一部玄幻小说', expected: 'creative_writing', minConfidence: 0.90 },
    { input: '分析一下销售数据', expected: 'data_analysis', minConfidence: 0.90 },
    { input: '帮我做个旅行计划', expected: 'travel_plan', minConfidence: 0.90 },
    { input: '生成一个Python脚本', expected: 'code_python', minConfidence: 0.90 },
    { input: '设计一个角色', expected: 'character_design', minConfidence: 0.90 },
    { input: '帮我润色这篇文章', expected: 'content_polishing', minConfidence: 0.90 },
    { input: '查询北京天气', expected: 'weather_query', minConfidence: 0.90 },
  ];

  let allPass = true;
  for (const tc of testCases) {
    const result = analyzer.analyze(tc.input);
    const confidencePct = (result.confidence * 100).toFixed(1);
    const pass = result.confidence >= tc.minConfidence;
    const icon = pass ? '✅' : '❌';
    console.log(`${icon} ${tc.input}`);
    console.log(`  Category: ${result.category}, Confidence: ${confidencePct}%`);
    if (!pass) allPass = false;
  }

  if (!allPass) {
    console.error('❌ FAIL: Some confidence scores below 90%');
    process.exit(1);
  }
  console.log('✅ PASS: All confidence scores >= 90%');

  // Test 3: Skill Matcher (Global Skills → ClawHub)
  console.log('\n[TEST 3] Skill Matcher - Global Skills → ClawHub Structure');
  const matcher = new SkillMatcher();

  // Test skill registry is a Map (dynamic discovery)
  if (!(matcher.skillRegistry instanceof Map)) {
    console.error('❌ FAIL: Skill registry not initialized as Map');
    process.exit(1);
  }
  console.log('✅ Skill registry initialized (dynamic discovery mode)');

  // Test ClawHub registry is a Map
  if (!(matcher.clawhubRegistry instanceof Map)) {
    console.error('❌ FAIL: ClawHub registry not initialized as Map');
    process.exit(1);
  }
  console.log('✅ ClawHub registry initialized (search mode)');

  // Test skill categories
  if (!matcher.skillCategories.creative || !matcher.skillCategories.coding) {
    console.error('❌ FAIL: Skill categories not initialized');
    process.exit(1);
  }
  console.log('✅ Skill categories initialized');

  // Test getSkillMetadata (now supports dynamic sources)
  const metadata = matcher.getSkillMetadata('test-skill');
  if (!metadata.source) {
    console.error('❌ FAIL: getSkillMetadata failed');
    process.exit(1);
  }
  console.log('✅ getSkillMetadata works correctly');

  // Test 4: Skill Similarity Map
  console.log('\n[TEST 4] Skill Similarity Matching');
  if (!matcher.skillSimilarityMap.writer || !matcher.skillSimilarityMap.coder) {
    console.error('❌ FAIL: Skill similarity map not initialized');
    process.exit(1);
  }
  console.log('✅ Skill similarity map initialized');

  console.log('\n[TEST 5] Module Exports');
  const index = require('../index');
  if (typeof index.analyze !== 'function') {
    console.error('❌ FAIL: analyze not exported');
    process.exit(1);
  }
  if (typeof index.recognize !== 'function') {
    console.error('❌ FAIL: recognize not exported');
    process.exit(1);
  }
  console.log('✅ Module exports verified');

  console.log('\n' + '='.repeat(70));
  console.log('ALL TESTS PASSED ✅');
  console.log('='.repeat(70));
}

runTests().catch(err => {
  console.error('Test suite error:', err);
  process.exit(1);
});
