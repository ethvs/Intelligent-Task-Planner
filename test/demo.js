/**
 * 演示脚本
 * 展示 Intelligent Task Planner 的实际使用效果
 */

const IntentAnalyzer = require('../src/intent-analyzer');

const analyzer = new IntentAnalyzer();

const demos = [
  '帮我写一部科幻小说',
  '北京明天会下雨吗',
  '分析销售数据并生成图表',
  '写一个 Python 脚本处理 Excel',
  '生成一张日出的图片',
  '创建飞书文档记录会议纪要',
  '提醒我下午三点开会',
  '搜索最新的 AI 新闻'
];

console.log('\n🤖 Intelligent Task Planner - 演示\n');
console.log('=' .repeat(70));

for (const input of demos) {
  console.log(`\n📥 用户输入：${input}`);
  
  const result = analyzer.analyze(input);
  
  if (result.success) {
    console.log(`✅ 识别成功:`);
    console.log(`   类别：${result.category}`);
    console.log(`   描述：${result.description}`);
    console.log(`   置信度：${(result.confidence * 100).toFixed(1)}%`);
    console.log(`   需要技能：${result.requiredSkills.join(', ') || '无'}`);
    console.log(`   需要工具：${result.requiredTools.join(', ') || '无'}`);
  } else {
    console.log(`⚠️  识别失败，使用通用处理`);
  }
  
  console.log('-'.repeat(70));
}

console.log('\n✨ 演示完成！\n');
