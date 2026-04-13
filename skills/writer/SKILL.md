---
name: Writer
version: 1.0.0
description: 专业写作助手，支持大纲生成、草稿撰写、内容审阅和润色优化
category: content-creation
author: OpenClaw Community
tags: [write, content, article, outline, draft, review, polish]
execute:
  module: index.js
  methods:
    - writeOutline
    - writeDraft
    - review
    - polish
---

# Writer Skill

专业写作助手技能，支持多种写作场景和内容类型。

## 功能特性

- **writeOutline**: 根据主题和意图生成结构化大纲
- **writeDraft**: 基于大纲撰写完整内容草稿
- **review**: 审阅内容并提供改进建议
- **polish**: 润色和优化已有内容

## 使用示例

```javascript
// 生成大纲
await executor.execute('writer', {
  method: 'writeOutline',
  topic: '人工智能的未来发展',
  contentType: 'article'
});

// 撰写草稿
await executor.execute('writer', {
  method: 'writeDraft',
  outline: [...],
  tone: 'professional'
});
```

## 支持的文体

- article: 文章/博客
- story: 小说/故事
- technical: 技术文档
- summary: 摘要/总结
