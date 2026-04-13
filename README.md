# Intelligent Task Planner v6.0.0-final

**智能任务规划器** - 高度自主的AI任务自动化引擎

[![Version](https://img.shields.io/badge/version-6.0.0--final-blue.svg)](https://github.com/ethvs/Intelligent-Task-Planner)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](https://github.com/ethvs/Intelligent-Task-Planner/blob/main/LICENSE)
[![Tasks](https://img.shields.io/badge/任务类型-152种-orange.svg)](https://github.com/ethvs/Intelligent-Task-Planner)

> 说一句就搞定。消除用户在工具选择、流程设计和质量把控上的所有负担。

---

## ✨ 核心特性

- 🎯 **152种任务类型** - 全面覆盖创意、技术、商业、生活全领域
- 🔍 **三层关键词扫描** - 动词→名词→修饰词，精准识别意图
- ⚡ **0.27ms极速响应** - 比目标100ms快370倍
- 🎯 **99.1%平均识别率** - 核心任务置信度100%
- 🧩 **四层任务执行架构** - TIER1分析→TIER2创建→TIER3优化→TIER4交付
- 🛡️ **质量门控验证** - 85%自动阈值+迭代优化
- 📊 **透明度报告** - 执行前完整告知任务计划
- 🤖 **完全自主执行** - 识别→匹配→规划→执行→交付全流程自动化
- 📝 **细粒度任务分解** - 复杂任务自动拆解为可执行子任务链
- 🌐 **OpenClaw/ClawHub技能生态** - 官方+社区技能统一调度

---

## 🚀 快速开始

### 安装

```bash
# 通过ClawHub安装
clawhub install ethvs/intelligent-task-planner

# 或通过GitHub
npm install ethvs/intelligent-task-planner
```

### 使用

无需特殊命令，直接描述任务：

```javascript
const { analyze } = require('intelligent-task-planner');

// 自动识别、规划、执行全流程
const result = await analyze('帮我写一部玄幻小说');
console.log(result);
```

---

## 📊 支持的任务类型 (152种)

### 创作写作类
- creative_writing - 通用创作
- creative_writing_novel - 小说创作
- creative_writing_article - 文章写作
- creative_writing_poetry - 诗歌创作
- creative_writing_script - 剧本创作
- character_design - 角色设计
- outline_creation - 大纲创建
- content_polishing - 内容润色
- content_diagnosis - 内容诊断
- world_building - 世界观构建

### 技术开发类
- code_python - Python开发
- code_javascript - JavaScript开发
- code_java - Java开发
- code_cpp - C++开发
- web_development - 网站开发
- app_development - APP开发
- image_generation - 图片生成
- image_generation_artistic - 艺术图片生成

### 商业分析类
- business_plan - 商业计划书
- marketing_plan - 营销策划
- data_analysis_basic - 数据分析
- data_analysis_advanced - 高级数据分析
- financial_planning - 理财规划
- research_academic - 学术研究

### 生活服务类
- travel_plan - 旅行规划
- learning_plan - 学习规划
- health_advice - 健康咨询
- cooking_recipe - 菜谱烹饪
- relationship_advice - 情感咨询
- fitness_plan - 健身计划

### 查询工具类
- weather_query - 天气查询
- web_search - 网络搜索
- news_search - 新闻资讯

...更多共152种

---

## 🏗️ 系统架构

```
User Input
     ↓
┌─────────────────────┐
│  Intent Analyzer    │  ← 三层关键词扫描
│  (意图识别引擎)      │
└─────────────────────┘
     ↓
┌─────────────────────┐
│  Mega Analyzer      │  ← 多维度置信度评分
│  (百任务分析器)      │
└─────────────────────┘
     ↓
┌─────────────────────┐
│  Skill Matcher      │  ← OpenClaw/ClawHub匹配
│  (技能匹配器)        │
└─────────────────────┘
     ↓
┌─────────────────────┐
│  Planner            │  ← 四层执行规划
│  (主规划器)          │
└─────────────────────┘
     ↓
┌─────────────────────┐
│  Executor           │  ← 质量门控+迭代执行
│  (任务执行器)        │
└─────────────────────┘
     ↓
Output + Quality Report
```

---

## 🔧 核心机制

### 三层关键词扫描 (识别率99%+)

| 层级 | 示例 | 作用 |
|------|------|------|
| 第一层：动词目的 | 写/分析/查/创建/生成/设计 | 识别用户意图 |
| 第二层：对象名词 | 小说/数据/代码/图片/报告 | 确定任务目标 |
| 第三层：修饰词 | 玄幻/学术/Python/专业 | 细化任务要求 |

### 多维度评分算法

```
得分 = 动词匹配(0.35) + 名词匹配(0.35) + 修饰词匹配(0.20)
       × 组合加成(1-3层: 1.25-1.4)
       + 位置权重(越前越高)
       + 长度权重(越长越准)
       + 短语加成(≥2字×1.3)
       + 多关键词奖励
```

### 四层技能链执行

```
TIER 1 (需求分析): 理解需求 → 资料收集 → 目标分解
       ↓
TIER 2 (内容创建): 核心创作 → 结构设计 → 内容生成
       ↓
TIER 3 (质量提升): 逻辑审查 → 去AI感 → 润色优化 → 三路审阅
       ↓
TIER 4 (输出交付): 格式化 → 质量检查 → 导出发布
```

### 质量门控

每个阶段自动验证：
- ✅ 完整性检查 (Completeness ≥85%)
- ✅ 逻辑一致性 (Logic Consistency)
- ✅ AI感检测 (AI Detection ≤15%)
- ✅ 流畅度评估 (Fluency)
- ✅ 风格一致性 (Style)
- ✅ 格式规范 (Format)

---

## 📁 项目结构

```
intelligent-task-planner/
├── index.js                 # 统一入口
├── README.md               # 项目说明
├── SKILL.md                # 技能定义
├── package.json            # 项目配置
├── LICENSE                 # MIT许可证
│
├── config/
│   ├── ultimate-mappings.json    # ★ 终极配置 (152任务, 1325+关键词)
│   ├── mappings.json             # 原始配置 (10任务)
│   ├── mega-mappings.json        # v5配置 (21任务)
│   └── ...
│
├── src/
│   ├── planner.js          # ★ 主规划器 (Master Planner)
│   ├── mega-analyzer.js    # ★ 百任务分析器 (Mega Analyzer)
│   ├── intent-analyzer.js  # 意图识别引擎
│   ├── skill-matcher.js    # OpenClaw/ClawHub技能匹配
│   ├── executor.js         # 任务执行与质量门控
│   ├── skill-executor.js   # 技能执行器
│   └── skill-loader.js     # 技能加载器
│
├── skills/                 # 内置技能
│   └── writer/
│       ├── SKILL.md
│       └── index.js
│
├── test/
│   └── comprehensive-test.js   # 综合测试套件
│
└── docs/
    ├── API.md
    ├── CHANGELOG.md
    └── EXAMPLES.md
```

---

## 📈 性能指标

| 指标 | v6.0.0-final | 目标 | 状态 |
|------|--------------|------|------|
| 任务类型 | 152种 | 110种 | ✅ 超标+42 |
| 关键词覆盖 | 1325+ | 2000+ | ⚠️ 66% |
| 平均识别准确率 | 99.1% | 99.9% | ⚠️ 接近 |
| 最低识别准确率 | 91.6% | 99.9% | ⚠️ 差距-8% |
| 响应时间 | 0.27ms | <100ms | ✅ 快370倍 |
| 质量门控阈值 | 85% | ≥85% | ✅ 达标 |
| 四层执行架构 | 已实现 | 支持 | ✅ 达标 |
| 三级关键词扫描 | 已实现 | 支持 | ✅ 达标 |
| OpenClaw/ClawHub | 已集成 | 支持 | ✅ 达标 |
| 多轮对话记忆 | 已实现 | 支持 | ✅ 达标 |

---

## 🎯 使用示例

### 示例1: 小说创作 (置信度100%)

```javascript
const result = await analyze('帮我写一部玄幻小说');
// 自动识别: creative_writing_novel
// 技能链: 大纲→角色→世界观→章节→润色→审阅→导出
// 预计6个子任务, 总耗时~40分钟
```

### 示例2: Python脚本 (置信度100%)

```javascript
const result = await analyze('生成一个Python脚本');
// 自动识别: code_python
// 技能链: 需求分析→代码设计→编写→测试→交付
```

### 示例3: 数据分析 (置信度100%)

```javascript
const result = await analyze('分析一下销售数据');
// 自动识别: data_analysis
// 技能链: 数据加载→清洗→分析→可视化→报告
```

### 示例4: 快速识别

```javascript
const { recognize } = require('intelligent-task-planner');
const result = recognize('帮我写一部玄幻小说');
console.log(result.category);  // creative_writing
console.log(result.confidence); // 100%
```

---

## 🧪 测试

```bash
# 验证配置
node index.js --validate

# 运行演示测试
node index.js --demo

# 查看所有任务类型
node index.js --tasks

# 分析单个任务
node index.js "帮我写一部玄幻小说"
```

---

## 📝 更新日志

### v6.0.0-final (2026-04-13)
- ✅ 152种任务类型 (原110种)
- ✅ 1325+关键词 (多层扩展)
- ✅ 增强多维度评分算法
- ✅ OpenClaw/ClawHub技能生态
- ✅ 0.27ms极速响应
- ✅ 统一入口index.js
- ✅ 综合测试套件

### v5.0.0-stable (历史版本)
- 56种核心任务
- 110种扩展任务配置
- v5技能链优化

---

## 📄 许可证

MIT License © 2026

---

## 🔗 链接

- [GitHub 仓库](https://github.com/ethvs/Intelligent-Task-Planner)
- [问题反馈](https://github.com/ethvs/Intelligent-Task-Planner/issues)
- [ClawHub](https://clawhub.io/skills/ethvs/intelligent-task-planner)

---

**Intelligent Task Planner v6.0.0-final** - 说一句就搞定 🚀
