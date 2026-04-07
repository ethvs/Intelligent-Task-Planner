/**
 * 超级测试脚本 - 测试 100+ 任务类型
 */

const UltraIntentAnalyzer = require('../src/ultra-analyzer');

const analyzer = new UltraIntentAnalyzer();

// 全面测试场景 - 覆盖所有 56 种任务类型
const ultraTests = [
  // 创作类 (8)
  { input: '写一部玄幻小说', expected: 'creative_writing_novel' },
  { input: '创作小说', expected: 'creative_writing_novel' },
  { input: '写文章', expected: 'creative_writing_article' },
  { input: '写文案', expected: 'creative_writing_article' },
  { input: '角色设计', expected: 'character_design' },
  { input: '人物设定', expected: 'character_design' },
  { input: '写大纲', expected: 'outline_creation' },
  { input: '大纲', expected: 'outline_creation' },
  { input: '润色文章', expected: 'content_polishing' },
  { input: '去除 AI 感', expected: 'content_polishing' },
  { input: '诊断内容问题', expected: 'content_diagnosis' },
  { input: '三路审阅', expected: 'three_review' },
  { input: '章节逻辑', expected: 'chapter_logic' },
  
  // 查询类 (6)
  { input: '北京天气', expected: 'weather_forecast' },
  { input: '明天下雨吗', expected: 'weather_forecast' },
  { input: '今天天气怎么样', expected: 'weather_forecast' },
  { input: '分析数据', expected: 'data_analysis_basic' },
  { input: '生成图表', expected: 'data_analysis_basic' },
  { input: '数据统计', expected: 'data_analysis_basic' },
  
  // 技术类 (6)
  { input: 'Python 代码', expected: 'code_python' },
  { input: '写 Python 脚本', expected: 'code_python' },
  { input: 'JavaScript', expected: 'code_javascript' },
  { input: '前端开发', expected: 'code_javascript' },
  { input: '生成图片', expected: 'image_generation_art' },
  { input: 'AI 绘画', expected: 'image_generation_art' },
  
  // 服务类 (6)
  { input: '翻译英文', expected: 'translation_zh_en' },
  { input: '写论文', expected: 'research_academic' },
  { input: '营销方案', expected: 'marketing_plan' },
  { input: '商业计划', expected: 'business_plan' },
  { input: '法律咨询', expected: 'legal_consult' },
  { input: '健康建议', expected: 'health_advice' },
  
  // 生活类 (9)
  { input: '旅游计划', expected: 'travel_plan' },
  { input: '学习计划', expected: 'learning_plan' },
  { input: '职业规划', expected: 'career_advice' },
  { input: '理财', expected: 'financial_planning' },
  { input: '情感问题', expected: 'relationship_advice' },
  { input: '育儿', expected: 'parenting_guide' },
  { input: '菜谱', expected: 'cooking_recipe' },
  { input: '穿搭', expected: 'fashion_style' },
  { input: '装修', expected: 'interior_design' },
  
  // 管理类 (7)
  { input: '活动策划', expected: 'event_planning' },
  { input: '社交媒体', expected: 'social_media' },
  { input: 'SEO', expected: 'seo_optimization' },
  { input: '用户调研', expected: 'user_research' },
  { input: '产品设计', expected: 'product_design' },
  { input: '项目管理', expected: 'project_management' },
  { input: '会议', expected: 'meeting_management' },
  
  // 个人发展 (7)
  { input: '写邮件', expected: 'email_writing' },
  { input: '简历', expected: 'resume_writing' },
  { input: '面试', expected: 'interview_prep' },
  { input: '时间管理', expected: 'time_management' },
  { input: '习惯', expected: 'habit_building' },
  { input: '冥想', expected: 'mindfulness_meditation' },
  { input: '学英语', expected: 'language_learning' },
  
  // 其他 (11)
  { input: '备考', expected: 'exam_preparation' },
  { input: 'PPT', expected: 'presentation_design' },
  { input: '思维导图', expected: 'mind_mapping' },
  { input: '决策', expected: 'decision_making' },
  { input: '解决问题', expected: 'problem_solving' },
  { input: '创意', expected: 'creative_ideation' },
  { input: '起名', expected: 'brand_naming' },
  { input: '视频剪辑', expected: 'video_editing' },
  { input: '音频处理', expected: 'audio_processing' },
  { input: '游戏攻略', expected: 'game_strategy' },
  { input: '影评', expected: 'movie_analysis' },
  { input: '读书笔记', expected: 'book_summary' },
  { input: '新闻', expected: 'news_summary' },
  { input: '软件推荐', expected: 'software_recommendation' },
  { input: '购物建议', expected: 'shopping_advice' },
  { input: '技术支持', expected: 'tech_support' }
];

async function runUltraTests() {
  console.log('🧪 开始超级测试 - 100+ 任务类型验证\n');
  console.log('=' .repeat(80));
  
  let passed = 0;
  let failed = 0;
  const failedTests = [];
  const categoryStats = {};
  
  for (const test of ultraTests) {
    const result = analyzer.analyze(test.input);
    const success = result.category === test.expected;
    
    // 统计每个类别的表现
    if (!categoryStats[test.expected]) {
      categoryStats[test.expected] = { total: 0, passed: 0 };
    }
    categoryStats[test.expected].total++;
    
    if (success) {
      passed++;
      categoryStats[test.expected].passed++;
      console.log(`✅ ${test.input} → ${result.category} (${(result.confidence * 100).toFixed(0)}%)`);
    } else {
      failed++;
      console.log(`❌ ${test.input}`);
      console.log(`   期望：${test.expected}`);
      console.log(`   实际：${result.category} (${(result.confidence * 100).toFixed(0)}%)`);
      failedTests.push({ 
        input: test.input, 
        expected: test.expected, 
        actual: result.category,
        confidence: result.confidence
      });
    }
  }
  
  console.log('\n' + '='.repeat(80));
  console.log(`\n📊 测试结果:`);
  console.log(`   通过：${passed}/${ultraTests.length} (${(passed/ultraTests.length*100).toFixed(1)}%)`);
  console.log(`   失败：${failed}/${ultraTests.length}`);
  
  // 分类统计
  console.log(`\n📈 分类统计:`);
  for (const [category, stats] of Object.entries(categoryStats)) {
    const rate = (stats.passed / stats.total * 100).toFixed(0);
    const status = rate === '100' ? '✅' : rate >= '80' ? '🟡' : '❌';
    console.log(`   ${status} ${category}: ${stats.passed}/${stats.total} (${rate}%)`);
  }
  
  if (failedTests.length > 0) {
    console.log(`\n❌ 失败用例:`);
    failedTests.forEach(t => {
      console.log(`   - ${t.input}: 期望${t.expected}, 实际${t.actual}`);
    });
  }
  
  return { passed, failed, total: ultraTests.length, categoryStats };
}

// 运行测试
runUltraTests().then(stats => {
  console.log('\n✨ 测试完成！\n');
  process.exit(stats.failed > 0 ? 1 : 0);
}).catch(error => {
  console.error('测试执行失败:', error);
  process.exit(1);
});
