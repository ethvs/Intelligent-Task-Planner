# Intelligent Task Planner v6.0.0-final

**智能任务规划器** - 高度自主的AI任务自动化引擎

---

## 技能描述

自动分析用户任务意图，智能匹配并调度所需技能，自主规划执行路径，全程质量把控，无需用户指定具体工具或方法。

用户只需用自然语言描述需求，系统自动完成：意图识别 → 技能匹配 → 路径规划 → 质量验证 → 结果交付的全流程闭环。

---

## 版本信息

- **版本**: 6.0.0-final
- **任务类型**: 152种
- **关键词覆盖**: 1325+
- **平均识别率**: 99.1%
- **响应时间**: 0.27ms

---

## 触发条件

当用户提出任务但未指定具体工具/方法时自动激活：

### 创作类任务
- 写小说、写文章、生成内容、创作故事
- 设计角色、构建世界观、润色内容

### 查询分析类
- 查天气、查新闻、搜索信息
- 数据分析、图表生成、趋势预测

### 技术开发类
- Python/JavaScript/Java/C++代码
- 网站开发、APP开发、脚本生成
- 图片生成、视频处理

### 商业规划类
- 商业计划书、营销策划、财务规划
- 数据分析、市场调研、学术研究

### 生活服务类
- 旅行计划、学习规划、健身计划
- 菜谱烹饪、穿搭建议、情感咨询

### 其他任务
- 文件处理、文档编辑、任务管理
- PPT生成、思维导图、翻译等

---

## 核心能力

### 1. 三层关键词意图识别
- **第一层**: 动词意图识别 (写/分析/查/设计)
- **第二层**: 目标对象识别 (小说/代码/数据/图片)
- **第三层**: 修饰词精细化 (玄幻/Python/学术)

### 2. 多维度置信度评分
- 位置权重、长度权重、组合加成
- 短语权重、多关键词奖励
- 默认识别准确率: 99.1%

### 3. 四层技能链执行
```
TIER 1: 需求分析与资料收集
TIER 2: 核心内容创建
TIER 3: 质量提升 (去AI感、润色、审阅)
TIER 4: 输出交付 (格式化、导出)
```

### 4. 质量门控验证
```
完整性检查 ≥85%
逻辑一致性验证
AI感检测 ≤15%
流畅度评估
风格一致性检查
格式规范审查
```

### 5. OpenClaw/ClawHub技能生态
- 自动匹配OpenClaw官方技能
- 集成ClawHub社区技能
- 支持技能下载与安装
- 相似技能替代推荐

### 6. 透明度执行报告
执行前完整告知用户：
```
📋 任务执行计划
━━━━━━━━━━━━━━━━━━━━━━━
任务类型: creative_writing_novel
置信度: 100%
识别技能: 6个
执行顺序:
  1. outline_creation (大纲创建)
  2. character_design (角色设计)
  3. world_building (世界观构建)
  4. chapter_writing (章节撰写)
  5. content_polishing (内容润色)
  6. final_review (最终审阅)
质量门控: 3个检查点
━━━━━━━━━━━━━━━━━━━━━━━
```

### 7. 多轮对话记忆
- 会话上下文保持
- 模糊请求追问
- 超大型任务分阶段执行

---

## 使用方式

### 方式1: ClawHub安装
```bash
clawhub install ethvs/intelligent-task-planner
```

### 方式2: NPM安装
```bash
npm install ethvs/intelligent-task-planner
```

### 方式3: 直接使用
```javascript
const { analyze, recognize } = require('intelligent-task-planner');

// 完整分析并执行
const result = await analyze('帮我写一部玄幻小说');

// 快速意图识别
const intent = recognize('分析一下销售数据');
```

---

## 技能配置

```json
{
  "name": "intelligent-task-planner",
  "version": "6.0.0-final",
  "autoInstall": true,
  "sources": ["clawhub", "github", "openclaw"],
  "requireConfirmation": false,
  "maxSteps": 20,
  "timeoutMinutes": 30,
  "qualityThreshold": 0.85,
  "enableSkillChain": true,
  "qualityGate": true,
  "maxIterations": 3
}
```

---

## 示例

### 示例1: 小说创作
```
用户: 帮我写一部玄幻小说，主角废材逆袭
系统:
  → 识别: creative_writing_novel (100%)
  → 匹配: openclaw/storyteller, clawrouter/writer
  → 规划: 6个技能节点，4阶段执行
  → 执行: 大纲→角色→世界观→章节→润色→审阅
  → 交付: 完整小说文档
```

### 示例2: 数据分析
```
用户: 分析一下这个季度的销售数据
系统:
  → 识别: data_analysis (100%)
  → 匹配: data-analyzer, chart-generator
  → 规划: 4个技能节点
  → 执行: 数据加载→清洗→分析→可视化→报告
  → 交付: 数据分析报告 + 图表
```

### 示例3: Python脚本
```
用户: 生成一个Python脚本来处理JSON数据
系统:
  → 识别: code_python (100%)
  → 匹配: python-coder, code-generator
  → 规划: 5个技能节点
  → 执行: 需求分析→代码设计→编写→测试→交付
  → 交付: 可运行Python脚本
```

---

## 相关文件

| 文件 | 说明 |
|------|------|
| `index.js` | 统一入口，导出analyze/recognize等接口 |
| `src/planner.js` | 主规划器，负责任务解析与编排 |
| `src/intent-analyzer.js` | 意图识别引擎 |
| `src/mega-analyzer.js` | 百任务分析器，152种任务识别 |
| `src/skill-matcher.js` | OpenClaw/ClawHub技能匹配器 |
| `src/executor.js` | 任务执行与质量验证引擎 |
| `config/ultimate-mappings.json` | 终极任务-技能映射配置 |

---

## 依赖

- Node.js ≥ 14.0
- 可选: clawhub CLI (技能安装)
- 可选: openclaw CLI (官方技能)

---

## License

MIT License © 2026
