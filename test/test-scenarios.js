/**
 * 测试场景脚本
 * 验证 Intelligent Task Planner 的各种场景
 */

const planner = require('../src/planner');

const testScenarios = [
  {
    name: '创作写作任务',
    input: '帮我写一部关于时间旅行的科幻小说',
    expected: {
      category: 'creative_writing',
      minConfidence: 0.6
    }
  },
  {
    name: '天气查询任务',
    input: '北京今天天气怎么样',
    expected: {
      category: 'weather_query',
      minConfidence: 0.6
    }
  },
  {
    name: '数据分析任务',
    input: '帮我分析这个销售数据并生成图表',
    expected: {
      category: 'data_analysis',
      minConfidence: 0.6
    }
  },
  {
    name: '代码生成任务',
    input: '写一个 Python 脚本处理 Excel 文件',
    expected: {
      category: 'code_generation',
      minConfidence: 0.6
    }
  },
  {
    name: '图片生成任务',
    input: '生成一张日出的图片',
    expected: {
      category: 'image_generation',
      minConfidence: 0.6
    }
  },
  {
    name: '文档操作任务',
    input: '帮我创建一个飞书文档',
    expected: {
      category: 'document_operation',
      minConfidence: 0.6
    }
  },
  {
    name: '任务管理',
    input: '提醒我明天下午三点开会',
    expected: {
      category: 'task_management',
      minConfidence: 0.6
    }
  },
  {
    name: '模糊任务',
    input: '随便聊聊天',
    expected: {
      category: 'general',
      minConfidence: 0
    }
  }
];

async function runTests() {
  console.log('🧪 开始测试 Intelligent Task Planner\n');
  console.log('=' .repeat(60));

  let passed = 0;
  let failed = 0;

  for (const scenario of testScenarios) {
    console.log(`\n📝 测试：${scenario.name}`);
    console.log(`输入：${scenario.input}`);
    
    try {
      const result = await planner.processTask(scenario.input);
      
      if (result.intent) {
        console.log(`识别类别：${result.intent.category}`);
        console.log(`置信度：${result.intent.confidence.toFixed(2)}`);
        console.log(`描述：${result.intent.description}`);
        
        // 验证结果
        const categoryMatch = result.intent.category === scenario.expected.category;
        const confidenceOk = result.intent.confidence >= scenario.expected.minConfidence;
        
        if (categoryMatch && confidenceOk) {
          console.log('✅ 通过');
          passed++;
        } else {
          console.log('❌ 失败');
          console.log(`  期望类别：${scenario.expected.category}`);
          console.log(`  实际类别：${result.intent.category}`);
          failed++;
        }
      } else {
        console.log('❌ 失败：无识别结果');
        failed++;
      }
    } catch (error) {
      console.log(`❌ 失败：${error.message}`);
      failed++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`\n📊 测试结果：${passed} 通过，${failed} 失败`);
  console.log(`成功率：${((passed / testScenarios.length) * 100).toFixed(1)}%`);

  return { passed, failed, total: testScenarios.length };
}

// 运行测试
runTests().then(stats => {
  console.log('\n测试完成！');
  process.exit(stats.failed > 0 ? 1 : 0);
}).catch(error => {
  console.error('测试执行失败:', error);
  process.exit(1);
});
