# Intelligent Task Planner - 智能任务规划器技能

## 技能描述
自动分析用户任务意图，智能匹配并安装所需技能，自主规划执行路径，无需用户指定具体工具或方法。

## 触发条件
当用户提出任务但未指定具体工具/方法时自动激活：
- 创作类任务（写小说、写文章、生成内容）
- 查询类任务（查天气、查新闻、搜索信息）
- 分析类任务（数据分析、图表生成）
- 工具类任务（文件处理、代码生成）
- 其他需要多步骤完成的任务

## 核心能力
1. **意图识别** - 分析用户真实需求
2. **技能匹配** - 从 ClawHub/GitHub 查找合适技能
3. **自主安装** - 自动安装缺失技能
4. **任务规划** - 分解任务为可执行步骤
5. **执行验证** - 确保任务完成质量

## 使用方式
用户只需描述任务，无需指定工具：
```
用户：帮我写一部科幻小说
AI：[自动识别需要写作技能，搜索并安装，然后执行]
```

## 技能配置
{
  "autoInstall": true,
  "sources": ["clawhub", "github"],
  "requireConfirmation": false,
  "maxSteps": 10,
  "timeoutMinutes": 30
}

## 相关文件
- `src/planner.js` - 主规划器逻辑
- `src/intent-analyzer.js` - 意图分析引擎
- `src/skill-matcher.js` - 技能匹配器
- `src/executor.js` - 任务执行器
- `config/mappings.json` - 任务 - 技能映射表
