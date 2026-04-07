# Intelligent Task Planner 🧠

[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](https://github.com/openclaw/intelligent-task-planner)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](https://github.com/openclaw/intelligent-task-planner/blob/main/LICENSE)
[![OpenClaw](https://img.shields.io/badge/OpenClaw-Skill-orange.svg)](https://openclaw.ai)

**智能任务规划器** - 自动分析任务意图，智能匹配并安装所需技能，自主规划执行路径的 OpenClaw 技能。

## ✨ 特性亮点

- 🎯 **56 种任务类型** - 覆盖创作、查询、技术、生活等全场景
- 🔍 **800+ 关键词** - 精准匹配用户意图
- 🧩 **细粒度分解** - 复杂任务自动分解为可执行的子任务链
- 🤖 **完全自主** - 无需用户指定工具，AI 自主选择最佳技能组合
- 📦 **开箱即用** - 一键安装，自动配置

## 🚀 快速开始

### 安装

```bash
# 方式 1: 使用 clawhub
clawhub install intelligent-task-planner

# 方式 2: 克隆仓库
cd ~/.openclaw/workspace-daily/skills
git clone https://github.com/openclaw/intelligent-task-planner.git
```

### 使用

无需特殊命令，技能会自动激活：

**简单任务：**
```
用户：北京明天会下雨吗？
→ AI 自动识别为 weather_forecast，调用天气查询技能
```

**复杂任务：**
```
用户：帮我写一部玄幻小说
→ AI 自动识别为 creative_writing_novel
→ 分解为 6 个子任务：
   1. outline - 创建大纲
   2. character_design - 设计角色
   3. world_building - 构建世界观
   4. chapter_draft - 撰写章节
   5. review - 审查问题
   6. polish - 润色优化
→ 自动调用对应技能完成每个子任务
```

## 📊 支持的任务类型

### 创作写作类
- **creative_writing_novel** - 小说创作全流程
- **creative_writing_article** - 文章文案创作
- **character_design** - 角色设计与人物设定
- **outline_creation** - 大纲与结构设计
- **content_polishing** - 内容润色与精修
- **content_diagnosis** - 内容问题诊断
- **three_review** - 三路审阅机制
- **chapter_logic** - 章节逻辑与连贯性

### 查询分析类
- **weather_forecast** - 天气预报查询
- **data_analysis_basic** - 基础数据分析
- **news_summary** - 新闻摘要
- **book_summary** - 读书笔记与书评
- **movie_analysis** - 电影分析与影评
- **game_strategy** - 游戏攻略

### 技术开发类
- **code_python** - Python 代码开发
- **code_javascript** - JavaScript 代码开发
- **image_generation_art** - 艺术图片生成
- **video_editing** - 视频剪辑与制作
- **audio_processing** - 音频处理
- **tech_support** - 技术支持

### 专业服务类
- **translation_zh_en** - 中英文翻译
- **research_academic** - 学术研究与论文
- **marketing_plan** - 营销策划与推广
- **business_plan** - 商业计划书
- **legal_consult** - 法律咨询与分析
- **health_advice** - 健康咨询与建议

### 生活规划类
- **travel_plan** - 旅行规划
- **learning_plan** - 学习规划
- **career_advice** - 职业建议与规划
- **financial_planning** - 理财规划
- **relationship_advice** - 情感与关系建议
- **parenting_guide** - 育儿指导
- **cooking_recipe** - 菜谱与烹饪指导
- **fashion_style** - 时尚穿搭建议
- **interior_design** - 室内设计建议

### 活动管理类
- **event_planning** - 活动策划与组织
- **social_media** - 社交媒体运营
- **seo_optimization** - SEO 优化
- **user_research** - 用户调研
- **product_design** - 产品设计
- **project_management** - 项目管理
- **meeting_management** - 会议管理

### 个人发展类
- **email_writing** - 邮件撰写
- **resume_writing** - 简历撰写与优化
- **interview_prep** - 面试准备
- **time_management** - 时间管理
- **habit_building** - 习惯养成
- **mindfulness_meditation** - 冥想与正念

### 购物消费类
- **shopping_advice** - 购物建议
- **gadget_review** - 数码产品评测

### 学习成长类
- **language_learning** - 语言学习
- **exam_preparation** - 考试备考

### 展示表达类
- **presentation_design** - 演示文稿设计
- **mind_mapping** - 思维导图
- **creative_ideation** - 创意构思
- **decision_making** - 决策分析
- **problem_solving** - 问题解决
- **brand_naming** - 品牌起名

## 🔧 配置选项

在 `config/comprehensive-mappings.json` 中配置：

```json
{
  "autoInstall": true,
  "sources": ["clawhub", "github"],
  "requireConfirmation": false,
  "maxSteps": 10,
  "timeoutMinutes": 30,
  "confidenceThreshold": 0.3
}
```

## 📁 项目结构

```
intelligent-task-planner/
├── SKILL.md                          # 技能定义
├── README.md                         # 使用说明
├── FINAL_REPORT.md                   # 完整报告
├── package.json                      # 项目配置
├── config/
│   ├── mappings.json                 # 基础映射（10 类）
│   └── comprehensive-mappings.json   # 全面映射（56 类）
├── src/
│   ├── planner.js                    # 主规划器
│   ├── intent-analyzer.js            # 基础意图分析
│   ├── enhanced-analyzer.js          # 增强意图分析
│   ├── skill-matcher.js              # 技能匹配器
│   └── executor.js                   # 任务执行器
├── test/                             # 测试脚本
└── scripts/                          # 工具脚本
```

## 🧪 测试

```bash
# 运行基础测试
npm test

# 运行增强测试
npm run test:enhanced

# 查看演示
npm run demo
```

## 📈 性能指标

| 指标 | 数值 |
|------|------|
| 任务类型 | 56 种 |
| 关键词覆盖 | 800+ |
| 识别准确率 | 78.6% |
| 平均响应时间 | <100ms |

## 🛠️ 开发

### 添加新任务类型

编辑 `config/comprehensive-mappings.json`：

```json
{
  "my_new_task": {
    "keywords": ["关键词 1", "关键词 2", "关键词 3"],
    "skills": ["skill1", "skill2"],
    "tools": ["tool1", "tool2"],
    "subtasks": ["step1", "step2"],
    "description": "任务描述"
  }
}
```

### 上传到 GitHub

```bash
# 设置 GitHub 用户名
export GITHUB_USER=your-username

# 运行上传脚本
npm run upload:github
```

## 📝 更新日志

### v2.0.0 (2026-04-07)
- ✅ 新增 56 种任务类型
- ✅ 新增 800+ 关键词
- ✅ 支持细粒度任务分解
- ✅ 增强意图识别算法
- ✅ 添加 GitHub 上传功能

### v1.0.0 (2026-04-07)
- ✅ 初始版本
- ✅ 10 种基础任务类型
- ✅ 基础意图识别

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 👥 作者

OpenClaw Community

## 🔗 链接

- [OpenClaw 官网](https://openclaw.ai)
- [GitHub 仓库](https://github.com/openclaw/intelligent-task-planner)
- [问题反馈](https://github.com/openclaw/intelligent-task-planner/issues)

---

🦀 **Intelligent Task Planner - 让 AI 真正理解并自主完成任务！**
