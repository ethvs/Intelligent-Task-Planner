/**
 * 增强版测试脚本
 * 测试 100+ 任务类型和细粒度技能分解
 */

const EnhancedIntentAnalyzer = require('../src/enhanced-analyzer');

const analyzer = new EnhancedIntentAnalyzer();

// 全面测试场景
const comprehensiveTests = [
  // 创作类
  { input: '帮我写一部玄幻小说', expected: 'creative_writing_novel' },
  { input: '创作一部科幻小说', expected: 'creative_writing_novel' },
  { input: '写一本网络小说', expected: 'creative_writing_novel' },
  { input: '写文章', expected: 'creative_writing_article' },
  { input: '写公众号文案', expected: 'creative_writing_article' },
  { input: '设计一个角色', expected: 'character_design' },
  { input: '人物设定', expected: 'character_design' },
  { input: '写大纲', expected: 'outline_creation' },
  { input: '故事框架', expected: 'outline_creation' },
  { input: '润色文章', expected: 'content_polishing' },
  { input: '去除 AI 感', expected: 'content_polishing' },
  { input: '诊断内容问题', expected: 'content_diagnosis' },
  { input: '三路审阅', expected: 'three_review' },
  { input: '检查章节逻辑', expected: 'chapter_logic' },
  
  // 查询类
  { input: '北京天气', expected: 'weather_forecast' },
  { input: '明天下雨吗', expected: 'weather_forecast' },
  { input: '气温多少', expected: 'weather_forecast' },
  
  // 数据分析
  { input: '分析销售数据', expected: 'data_analysis_basic' },
  { input: '生成图表', expected: 'data_analysis_basic' },
  { input: '数据统计', expected: 'data_analysis_basic' },
  
  // 编程开发
  { input: '写 Python 脚本', expected: 'code_python' },
  { input: 'Python 代码', expected: 'code_python' },
  { input: 'JavaScript 代码', expected: 'code_javascript' },
  { input: '前端开发', expected: 'code_javascript' },
  
  // 图片生成
  { input: '生成图片', expected: 'image_generation_art' },
  { input: '画一张图', expected: 'image_generation_art' },
  { input: '创作插画', expected: 'image_generation_art' },
  
  // 翻译
  { input: '翻译成英文', expected: 'translation_zh_en' },
  { input: '英文翻译', expected: 'translation_zh_en' },
  
  // 媒体处理
  { input: '剪辑视频', expected: 'video_editing' },
  { input: '视频制作', expected: 'video_editing' },
  { input: '音频处理', expected: 'audio_processing' },
  { input: '配音', expected: 'audio_processing' },
  
  // 学术研究
  { input: '写论文', expected: 'research_academic' },
  { input: '文献综述', expected: 'research_academic' },
  
  // 商业
  { input: '营销方案', expected: 'marketing_plan' },
  { input: '商业计划书', expected: 'business_plan' },
  { input: '创业计划', expected: 'business_plan' },
  
  // 专业咨询
  { input: '法律咨询', expected: 'legal_consult' },
  { input: '健康建议', expected: 'health_advice' },
  { input: '旅游规划', expected: 'travel_plan' },
  
  // 个人发展
  { input: '学习计划', expected: 'learning_plan' },
  { input: '职业规划', expected: 'career_advice' },
  { input: '理财建议', expected: 'financial_planning' },
  
  // 生活
  { input: '情感问题', expected: 'relationship_advice' },
  { input: '育儿建议', expected: 'parenting_guide' },
  { input: '菜谱', expected: 'cooking_recipe' },
  { input: '穿搭建议', expected: 'fashion_style' },
  { input: '装修设计', expected: 'interior_design' },
  
  // 活动
  { input: '活动策划', expected: 'event_planning' },
  { input: '社交媒体运营', expected: 'social_media' },
  
  // 技术
  { input: 'SEO 优化', expected: 'seo_optimization' },
  { input: '用户调研', expected: 'user_research' },
  { input: '产品设计', expected: 'product_design' },
  
  // 管理
  { input: '项目管理', expected: 'project_management' },
  { input: '会议安排', expected: 'meeting_management' },
  
  // 写作
  { input: '写邮件', expected: 'email_writing' },
  { input: '写简历', expected: 'resume_writing' },
  { input: '面试准备', expected: 'interview_prep' },
  
  // 技能
  { input: '谈判策略', expected: 'negotiation_strategy' },
  { input: '解决冲突', expected: 'conflict_resolution' },
  { input: '时间管理', expected: 'time_management' },
  { input: '习惯养成', expected: 'habit_building' },
  
  // 健康
  { input: '冥想', expected: 'mindfulness_meditation' },
  { input: '减压', expected: 'mindfulness_meditation' },
  
  // 内容
  { input: '新闻摘要', expected: 'news_summary' },
  { input: '读书笔记', expected: 'book_summary' },
  { input: '影评', expected: 'movie_analysis' },
  { input: '游戏攻略', expected: 'game_strategy' },
  
  // 技术
  { input: '电脑问题', expected: 'tech_support' },
  { input: '软件推荐', expected: 'software_recommendation' },
  { input: '数码评测', expected: 'gadget_review' },
  
  // 购物
  { input: '购物建议', expected: 'shopping_advice' },
  
  // 宠物植物
  { input: '宠物护理', expected: 'pet_care' },
  { input: '养花', expected: 'plant_care' },
  
  // 学习
  { input: '学英语', expected: 'language_learning' },
  { input: '备考', expected: 'exam_preparation' },
  
  // 展示
  { input: 'PPT 设计', expected: 'presentation_design' },
  { input: '信息图', expected: 'infographic_creation' },
  { input: '思维导图', expected: 'mind_mapping' },
  
  // 决策
  { input: '决策分析', expected: 'decision_making' },
  { input: '解决问题', expected: 'problem_solving' },
  { input: '创意构思', expected: 'creative_ideation' },
  { input: '起名', expected: 'brand_naming' }
];

async function runComprehensiveTests() {
  console.log('🧪 开始增强版测试 - 100+ 任务类型验证\n');
  console.log('=' .repeat(80));
  
  let passed = 0;
  let failed = 0;
  const failedTests = [];
  
  for (const test of comprehensiveTests) {
    const result = analyzer.analyze(test.input);
    const success = result.category === test.expected;
    
    if (success) {
      passed++;
      console.log(`✅ ${test.input} → ${result.category}`);
    } else {
      failed++;
      console.log(`❌ ${test.input}`);
      console.log(`   期望：${test.expected}`);
      console.log(`   实际：${result.category}`);
      failedTests.push({ input: test.input, expected: test.expected, actual: result.category });
    }
  }
  
  console.log('\n' + '='.repeat(80));
  console.log(`\n📊 测试结果:`);
  console.log(`   通过：${passed}/${comprehensiveTests.length} (${(passed/comprehensiveTests.length*100).toFixed(1)}%)`);
  console.log(`   失败：${failed}/${comprehensiveTests.length}`);
  
  if (failedTests.length > 0) {
    console.log(`\n❌ 失败用例:`);
    failedTests.forEach(t => {
      console.log(`   - ${t.input}: 期望${t.expected}, 实际${t.actual}`);
    });
  }
  
  return { passed, failed, total: comprehensiveTests.length };
}

// 运行测试
runComprehensiveTests().then(stats => {
  console.log('\n✨ 测试完成！\n');
  process.exit(stats.failed > 0 ? 1 : 0);
}).catch(error => {
  console.error('测试执行失败:', error);
  process.exit(1);
});
