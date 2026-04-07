/**
 * 增强版意图分析引擎
 * 支持 100+ 任务类型和 1000+ 关键词
 * 实现细粒度技能分解和精准匹配
 */

const fs = require('fs');
const path = require('path');

class EnhancedIntentAnalyzer {
  constructor() {
    this.mappings = this.loadMappings();
    this.keywordIndex = this.buildKeywordIndex();
  }

  loadMappings() {
    const mappingPath = path.join(__dirname, '../config/comprehensive-mappings.json');
    if (fs.existsSync(mappingPath)) {
      return JSON.parse(fs.readFileSync(mappingPath, 'utf-8'));
    }
    return { taskCategories: {} };
  }

  /**
   * 构建关键词倒排索引，加速匹配
   */
  buildKeywordIndex() {
    const index = {};
    const categories = this.mappings.taskCategories || {};
    
    for (const [categoryKey, categoryData] of Object.entries(categories)) {
      const keywords = categoryData.keywords || [];
      for (const keyword of keywords) {
        const kw = keyword.toLowerCase();
        if (!index[kw]) {
          index[kw] = [];
        }
        index[kw].push(categoryKey);
      }
    }
    
    return index;
  }

  /**
   * 分析用户意图 - 主方法
   * @param {string} userInput - 用户输入
   * @returns {Object} 分析结果
   */
  analyze(userInput) {
    const input = userInput.toLowerCase();
    const words = this.tokenize(input);
    const categoryScores = {};
    
    // 方法 1: 基于索引的快速匹配
    for (const word of words) {
      if (this.keywordIndex[word]) {
        for (const category of this.keywordIndex[word]) {
          if (!categoryScores[category]) {
            categoryScores[category] = 0;
          }
          categoryScores[category] += this.calculateWordScore(word, input);
        }
      }
    }
    
    // 方法 2: 完整关键词匹配
    for (const [categoryKey, categoryData] of Object.entries(this.mappings.taskCategories)) {
      const keywordScore = this.detailedMatch(input, categoryData.keywords);
      if (keywordScore > 0) {
        if (!categoryScores[categoryKey]) {
          categoryScores[categoryKey] = 0;
        }
        categoryScores[categoryKey] += keywordScore * 2; // 详细匹配权重更高
      }
    }
    
    // 排序并返回结果
    const sorted = Object.entries(categoryScores)
      .filter(([_, score]) => score > 0)
      .sort((a, b) => b[1] - a[1]);
    
    if (sorted.length === 0) {
      return this.createGeneralResult();
    }
    
    const [bestCategory, bestScore] = sorted[0];
    const categoryData = this.mappings.taskCategories[bestCategory];
    
    return {
      success: true,
      category: bestCategory,
      confidence: Math.min(1.0, bestScore / 10),
      description: categoryData.description,
      requiredSkills: categoryData.skills || [],
      requiredTools: categoryData.tools || [],
      subtasks: categoryData.subtasks || [],
      allMatches: sorted.map(([catKey, score]) => ({
        category: catKey,
        confidence: score,
        description: this.mappings.taskCategories[catKey]?.description || ''
      }))
    };
  }

  /**
   * 分词
   */
  tokenize(input) {
    // 中文分词：按字符和常用词长切分
    const tokens = [];
    
    // 单字
    for (let i = 0; i < input.length; i++) {
      tokens.push(input[i]);
    }
    
    // 双字词
    for (let i = 0; i < input.length - 1; i++) {
      tokens.push(input.slice(i, i + 2));
    }
    
    // 三字词
    for (let i = 0; i < input.length - 2; i++) {
      tokens.push(input.slice(i, i + 3));
    }
    
    // 英文单词
    const englishWords = input.match(/[a-z0-9]+/g) || [];
    tokens.push(...englishWords);
    
    return tokens;
  }

  /**
   * 计算单词得分
   */
  calculateWordScore(word, input) {
    const position = input.indexOf(word);
    if (position === -1) return 0;
    
    // 位置权重：越靠前越高
    const positionWeight = 1 - (position / input.length);
    
    // 长度权重：越长越重要
    const lengthWeight = word.length / Math.max(2, input.length);
    
    // 完整性权重：是否完整匹配
    const exactMatch = input === word ? 2 : 1;
    
    return positionWeight * (1 + lengthWeight) * exactMatch;
  }

  /**
   * 详细关键词匹配
   */
  detailedMatch(input, keywords) {
    if (!keywords || keywords.length === 0) return 0;
    
    let maxScore = 0;
    for (const keyword of keywords) {
      const kw = keyword.toLowerCase();
      if (input.includes(kw)) {
        const position = input.indexOf(kw);
        const positionWeight = 1 - (position / input.length);
        const lengthWeight = kw.length / 10; // 假设平均关键词长度为 10
        const score = positionWeight * (1 + lengthWeight);
        maxScore = Math.max(maxScore, score);
      }
    }
    
    return maxScore;
  }

  createGeneralResult() {
    return {
      success: false,
      category: 'general',
      confidence: 0,
      description: '通用任务',
      requiredSkills: [],
      requiredTools: [],
      subtasks: [],
      allMatches: []
    };
  }

  /**
   * 分解复杂任务为子任务链
   */
  decomposeComplexTask(intent, userInput) {
    if (!intent.success || !intent.subtasks || intent.subtasks.length === 0) {
      return [];
    }
    
    const subtaskChain = [];
    for (const subtask of intent.subtasks) {
      subtaskChain.push({
        name: subtask,
        skills: this.getSubtaskSkills(subtask, intent.category),
        description: this.getSubtaskDescription(subtask, intent.category)
      });
    }
    
    return subtaskChain;
  }

  getSubtaskSkills(subtask, category) {
    // 根据子任务类型返回对应技能
    const skillMap = {
      'outline': ['outline-generator', 'structure-builder'],
      'character_design': ['character-profile', 'personality-trait'],
      'draft': ['draft-writing', 'content-generator'],
      'review': ['content-analyzer', 'logic-checker'],
      'polish': ['ai-tone-removal', 'style-transfer'],
      'fetch': ['data-fetcher'],
      'analyze': ['data-analyzer'],
      'visualize': ['chart-generator'],
      'format': ['formatter'],
      'verify': ['validator']
    };
    
    return skillMap[subtask] || ['general-processor'];
  }

  getSubtaskDescription(subtask, category) {
    const descriptions = {
      'outline': '创建大纲结构',
      'character_design': '设计角色人物',
      'draft': '撰写初稿内容',
      'review': '审查内容问题',
      'polish': '润色优化文字',
      'fetch': '获取数据',
      'analyze': '分析数据',
      'visualize': '生成可视化',
      'format': '格式化输出',
      'verify': '验证结果'
    };
    
    return descriptions[subtask] || `执行${subtask}`;
  }
}

module.exports = EnhancedIntentAnalyzer;
