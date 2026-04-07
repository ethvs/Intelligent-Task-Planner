/**
 * 终极测试 - 重点测试之前的失败案例
 */

const UltimateIntentAnalyzer = require('../src/ultimate-analyzer');

const analyzer = new UltimateIntentAnalyzer();

// 重点测试之前的失败案例
const criticalTests = [
  // 之前的失败案例
  { input: '诊断内容问题', expected: 'content_diagnosis', note: '消歧测试' },
  { input: '分析数据', expected: 'data_analysis_basic', note: '短词扩展' },
  { input: '活动策划', expected: 'event_planning', note: '跨类别消歧' },
  { input: '会议安排', expected: 'meeting_management', note: '短词消歧' },
  { input: '会议记录', expected: 'meeting_management', note: '短词消歧' },
  { input: '简历制作', expected: 'resume_writing', note: '短词扩展' },
  { input: '面试准备', expected: 'interview_prep', note: '短词扩展' },
  { input: '冥想练习', expected: 'mindfulness_meditation', note: '短词扩展' },
  { input: '冥想静心', expected: 'mindfulness_meditation', note: '短词扩展' },
  { input: '备考复习', expected: 'exam_preparation', note: '短词扩展' },
  { input: '创意想法', expected: 'creative_ideation', note: '短词扩展' },
  { input: '生成图表', expected: 'data_analysis_basic', note: '跨类别消歧' },
  
  // 确保之前通过的仍然通过
  { input: '写一部玄幻小说', expected: 'creative_writing_novel' },
  { input: '北京天气', expected: 'weather_forecast' },
  { input: 'Python 代码', expected: 'code_python' },
  { input: '生成图片', expected: 'image_generation_art' },
  { input: '数据分析', expected: 'data_analysis_basic' },
  { input: '营销策划', expected: 'marketing_plan' },
  { input: '健康建议', expected: 'health_advice' },
  { input: '旅游计划', expected: 'travel_plan' },
  { input: '职业规划', expected: 'career_advice' },
  { input: '项目管理', expected: 'project_management' },
  { input: '时间管理', expected: 'time_management' },
  { input: '学英语', expected: 'language_learning' },
  { input: 'PPT 设计', expected: 'presentation_design' },
  { input: '决策分析', expected: 'decision_making' },
  { input: '解决问题', expected: 'problem_solving' },
  { input: '视频剪辑', expected: 'video_editing' },
  { input: '游戏攻略', expected: 'game_strategy' }
];

async function runUltimateTests() {
  console.log('🧪 开始终极测试 - 重点优化案例验证\n');
  console.log('=' .repeat(80));
  
  let passed = 0;
  let failed = 0;
  const failedTests = [];
  const criticalFailed = [];
  
  for (const test of criticalTests) {
    const result = analyzer.analyze(test.input);
    const success = result.category === test.expected;
    
    const status = success ? '✅' : '❌';
    const note = test.note ? ` [${test.note}]` : '';
    
    if (success) {
      passed++;
      console.log(`${status} ${test.input}${note} → ${result.category} (${(result.confidence * 100).toFixed(0)}%)`);
    } else {
      failed++;
      console.log(`${status} ${test.input}${note}`);
      console.log(`   期望：${test.expected}`);
      console.log(`   实际：${result.category} (${(result.confidence * 100).toFixed(0)}%)`);
      
      failedTests.push({ 
        input: test.input, 
        expected: test.expected, 
        actual: result.category,
        confidence: result.confidence
      });
      
      if (test.note) {
        criticalFailed.push(test);
      }
    }
  }
  
  console.log('\n' + '='.repeat(80));
  console.log(`\n📊 测试结果:`);
  console.log(`   通过：${passed}/${criticalTests.length} (${(passed/criticalTests.length*100).toFixed(1)}%)`);
  console.log(`   失败：${failed}/${criticalTests.length}`);
  
  if (criticalFailed.length > 0) {
    console.log(`\n⚠️  关键失败（带标注的案例）:`);
    criticalFailed.forEach(t => {
      console.log(`   - ${t.input} [${t.note}]`);
    });
  }
  
  if (failedTests.length > 0) {
    console.log(`\n❌ 所有失败用例:`);
    failedTests.forEach(t => {
      console.log(`   - ${t.input}: 期望${t.expected}, 实际${t.actual}`);
    });
  }
  
  // 性能对比
  console.log(`\n📈 性能对比:`);
  console.log(`   v1.0: 75.0%`);
  console.log(`   v2.0: 78.6%`);
  console.log(`   v3.0: 85.7%`);
  console.log(`   v4.0: ${(passed/criticalTests.length*100).toFixed(1)}% ⬆️`);
  
  return { passed, failed, total: criticalTests.length };
}

// 运行测试
runUltimateTests().then(stats => {
  console.log('\n✨ 终极测试完成！\n');
  process.exit(stats.failed > 0 ? 1 : 0);
}).catch(error => {
  console.error('测试执行失败:', error);
  process.exit(1);
});
