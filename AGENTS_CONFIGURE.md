# OpenClaw Agents 配置指南 - 集成 Intelligent Task Planner

本指南教你如何为 OpenClaw 中的每个 Agent 配置 `agents.md`，确保 ITP 技能被强制触发和执行。

---

## 快速配置（拷贝即用）

将以下内容添加到每个 Agent 的 `agents.md` 文件末尾：

```markdown
## 技能配置

<!-- ITP 强制配置 -->

### 核心技能
- **intelligent-task-planner** (必须)
  - 优先级: 1000
  - 模式: 独占
  - 触发: 所有输入
  - 最小置信度: 0.85

### 执行技能（按需选择）
- openclaw/storyteller (写作)
- openclaw/analyzer (数据分析)
- openclaw/coder (编程)
- clawrouter/writer (写作增强)

### 执行规则
1. 所有用户输入必须经过 ITP 分析
2. 按 ITP 返回的 skill_chain 顺序执行
3. 质量检查不达标的任务自动迭代优化
```

---

## agents.md 完整模板

在你的 Agent 目录创建或修改 `agents.md`：

```markdown
---
name: 你的Agent名称
role: 你的Agent角色
---

## 系统提示词

你是一个由 Intelligent Task Planner 驱动的智能助手。

### 核心规则
- [强制] 所有用户输入必须先交给 ITP 分析意图
- [强制] 获取规划后严格按照 skill_chain 执行
- [强制] 每步执行后必须进行质量检查
- [禁止] 未经规划直接响应用户

### ITP 配置覆盖
- quality_threshold: 0.85
- max_steps: 20
- timeout_minutes: 30
- fallback_action: reject

---

## 技能依赖 (Skills)

### 主控技能
```yaml
intelligent-task-planner:
  status: required
  priority: 1000
  exclusive: true
  intercept_all: true
  trigger:
    pattern: ".*"
    confidence_min: 0.85
  execution:
    follow_plan: true
    allow_skip: false
    enforce_chain: true
```

### 执行技能（按需选择）
```yaml
# 写作类
openclaw/storyteller:
  trigger: after_itp_plan
  category: creative_writing

clawrouter/writer:
  trigger: after_itp_plan
  category: creative_writing

# 分析类
openclaw/analyzer:
  trigger: after_itp_plan
  category: data_analysis

# 编程类
openclaw/coder:
  trigger: after_itp_plan
  category: code_generation

# 图片类
imagegen:
  trigger: after_itp_plan
  category: image_generation
```

---

## 流程控制 (Flow)

### 输入处理流程

```mermaid
用户输入
  ↓
ITP 分析 (必须)
  ↓
[识别失败?] → 询问澄清 → 回到第一步
  ↓ 成功
获取 Task Plan
  ↓
按 skill_chain 顺序调用技能
  ↓
每步质量检查 (≥85%)
  ↓
[不达标?] → 自动迭代优化
  ↓ 达标
输出结果 + 执行报告
```

### 失败处理

| 失败场景 | 处理方式 |
|---------|---------|
| ITP 未识别 | 询问用户明确需求 |
| 置信度 < 0.85 | 要求澄清，不建议强制执行 |
| 质量不达标 | 自动触发内容诊断和润色 |
| 技能不存在 | 尝试安装替代技能 |
| 执行超时 | 返回部分结果 + 未完成说明 |

---

## 配置示例

### 示例1: 写作 Agent

```markdown
## 写作助手 Agent

### 系统提示词
你是写作助手，由 ITP 驱动。所有写作任务必须：
1. 先由 ITP 分析任务类型（小说/文章/诗歌等）
2. 按规划调用 outline_creation → chapter_writing → content_polishing
3. 输出前进行质量检查

### 技能配置
- intelligent-task-planner (required, priority: 1000)
- openclaw/storyteller

### 禁用行为
- [x] 不经过规划直接写作
- [x] 跳过质量检查验证
- [x] 自行决定文章结构
```

### 示例2: 数据分析 Agent

```markdown
## 数据分析师 Agent

### 系统提示词
你是数据分析助手，由 ITP 驱动。数据分析流程：
1. ITP 识别分析类型和范围
2. 执行数据加载 → 清洗 → 分析 → 可视化 → 报告
3. 每步验证数据准确性

### 技能配置
- intelligent-task-planner (required, priority: 1000)
- openclaw/analyzer
- chart-generator

### 数据安全
- [x] 敏感数据先脱敏
- [x] 分析结果需验证
```

### 示例3: 通用全能 Agent

```markdown
## 通用智能助手

### 系统提示词
你是通用智能助手，能处理各类任务：
- 写作、分析、编程、查询、规划
- 所有任务由 ITP 智能分派和协调
- 复杂任务自动分解为子任务链

### 技能配置
- intelligent-task-planner (required, priority: 1000)
- openclaw/storyteller (写作)
- openclaw/analyzer (分析)
- openclaw/coder (编程)
- openclaw/searcher (搜索)

### 任务路由
ITP 识别任务类型后自动路由到：
- creative_writing → storyteller
- data_analysis → analyzer
- code_generation → coder
- web_search → searcher
```

---

## 配置片段速查

### 片段1: 强制 ITP 优先

```markdown
## 技能优先级
1. intelligent-task-planner (priority: 1000, exclusive: true)
2. 其他技能 (priority: 100)
```

### 片段2: ITP 参数覆盖

```markdown
## ITP 参数
```yaml
itp_config:
  quality_threshold: 0.85
  max_steps: 20
  timeout_minutes: 30
  auto_install: true
  fallback_action: reject
```
```

### 片段3: 执行规则声明

```markdown
## 执行规则
- [必须] 执行前必须经过 ITP 规划
- [必须] 按 plan.skill_chain 顺序调用技能
- [必须] 每步执行后执行质量检查
- [禁止] 直接响应未经规划的请求
```

### 片段4: 失败处理规则

```markdown
## 失败处理
on_itp_fail: ask_for_clarification
on_low_confidence: reject_with_explanation
on_quality_fail: auto_polish_and_retry
on_timeout: return_partial_result
```

---

## 验证配置

### 测试步骤

1. **安装 ITP 技能**
   ```bash
   openclaw skill install intelligent-task-planner
   ```

2. **验证 Agent 配置**
   ```bash
   openclaw agent validate agents.md
   ```

3. **测试触发**
   ```bash
   openclaw agent test --agent your-agent-name
   # 输入: "帮我写一部玄幻小说"
   # 预期: 显示 ITP 规划和技能调用流程
   ```

4. **检查日志**
   ```bash
   openclaw agent logs --agent your-agent-name --tail 50
   # 应包含: itp-analysis, skill-chain, quality-gate 等关键字
   ```

### 测试用例

| 输入 | 预期 ITP 识别 | 预期技能链 |
|------|--------------|-----------|
| "帮我写部玄幻小说" | creative_writing_novel | storyteller → content_polish |
| "分析一下销售数据" | data_analysis | analyzer → chart_generator |
| "生成Python脚本" | code_python | coder → code_review |

---

## 故障排除

### 问题1: ITP 不触发

**检查列表**:
- [ ] 确认 ITP 技能已安装: `openclaw skill list | grep intelligent-task-planner`
- [ ] 确认 agents.md 包含: `- intelligent-task-planner`
- [ ] 确认 **ITP 在其他技能之前**列出
- [ ] 检查优先级: `priority: 1000` 已设置
- [ ] 检查独占模式: `exclusive: true` 已设置

**修复**: 重新安装技能并配置
```bash
openclaw skill install intelligent-task-planner --force
openclaw agent reload your-agent-name
```

### 问题2: 触发但不规划

**检查列表**:
- [ ] 确认 follow_plan: true
- [ ] 确认 allow_skip_planning: false
- [ ] 检查执行日志是否有 "skip planning" 警告

**修复**: 在 agents.md 添加强制规则
```markdown
## 执行规则
- follow_itp_plan: required
- allow_skip: false
```

### 问题3: 规划但不执行技能链

**检查列表**:
- [ ] 确认 required_skills 都在 `skills` 中列明
- [ ] 检查技能是否已安装
- [ ] 检查 skill_chain 中的技能名称是否正确

**修复**: 安装缺失技能
```bash
openclaw skill install <missing-skill>
```

### 问题4: 执行但不进行质量检查

**检查列表**:
- [ ] 确认 quality_gate: true
- [ ] 确认心在 itp_config 中 quality_threshold 已设置

**修复**: 覆盖质量检查参数
```markdown
## 质量门控
enabled: true
threshold: 0.85
auto_iterate: true
```

---

## 完整示例文件

文件路径: `/path/to/your/agent/agents.md`

```markdown
---
name: smart-assistant
role: 通用智能助手
description: 由 ITP 驱动的全能助手
version: 1.0.0
---

## 系统提示词

你是一个高度自主的智能助手，由 **Intelligent Task Planner v6.0.0-final** 驱动。

### 行为准则
1. **分析优先**: 所有用户输入必须先经过 ITP 意图分析
2. **规划执行**: 严格按照 ITP 生成的 skill_chain 顺序执行任务
3. **质量闭环**: 每个步骤完成后进行质量检查，不达标自动优化
4. **透明报告**: 向用户展示执行计划和进度

### 禁止行为
- [禁止] 不经过规划直接执行用户请求
- [禁止] 跳过质量检查步骤
- [禁止] 偏离 ITP 生成的执行计划

---

## 技能配置

### 核心技能 (必须)
```yaml
intelligent-task-planner:
  status: required
  priority: 1000
  exclusive: true
  intercept_all: true
  trigger:
    pattern: ".*"
    confidence_min: 0.85
  execution:
    follow_plan: required
    allow_skip: false
    enforce_chain: true
    override_system_prompt: true
  config:
    quality_threshold: 0.85
    max_steps: 20
    timeout_minutes: 30
    auto_install: true
    fallback_action: reject
```

### 执行技能
```yaml
# 写作
- name: openclaw/storyteller
  trigger: after_itp_plan
  when: task_type == "creative_writing*"

- name: clawrouter/writer
  trigger: after_itp_plan
  when: task_type == "creative_writing*"

# 分析
- name: openclaw/analyzer
  trigger: after_itp_plan
  when: task_type == "data_analysis*"

# 编程
- name: openclaw/coder
  trigger: after_itp_plan
  when: task_type == "code_*"

# 搜索
- name: openclaw/searcher
  trigger: after_itp_plan
  when: task_type == "*_search" or task_type == "*_query"
```

---

## 执行流程

```
1. 接收用户输入
2. ITP 分析意图 → Task Plan
3. 按 skill_chain 顺序调用技能
4. 每步后: 质量检查
5. 全部完成: 最终验证
6. 输出结果 + 完成报告
```

## 质量门控

```yaml
quality_gates:
  enabled: true
  threshold: 0.85
  checks:
    - completeness
    - logic_consistency
    - ai_detection (<15%)
    - grammar
    - format
  auto_iterate:
    enabled: true
    max_iterations: 3
  on_fail: retry_with_feedback
```

---

## 使用示例

**用户**: "帮我写一部玄幻小说"

**ITP 执行**:
1. 识别: creative_writing_novel (置信度: 100%)
2. 技能链: [storyteller, content_polisher]
3. 执行: storyteller 创作大纲和章节
4. 检查: 质量评分 92%
5. 执行: content_polisher 润色优化
6. 检查: 质量评分 96%
7. 交付: 完整小说 + 执行报告

---

## 故障日志

```
# 查看 ITP 日志
openclaw agent logs --agent smart-assistant --filter "intelligent-task-planner"

# 查看执行链日志
openclaw agent logs --agent smart-assistant --filter "skill-chain"

# 查看质量检查日志
openclaw agent logs --agent smart-assistant --filter "quality-gate"
```
```

---

## 总结

要让 ITP 在 OpenClaw 的 Agent 中被**强制触发和执行**，关键配置：

1. **ITP 放在第一位** - skills 列表首位
2. **_priority: 1000** - 最高优先级
3. **exclusive: true** - 独占模式
4. **follow_plan: required** - 必须按规划执行
5. **allow_skip: false** - 不允许跳过规划

**一句话**: ITP 必须在 skills 的**第一位**，并设置 `exclusive: true` 和 `follow_plan: required`。
