/**
 * 超级意图分析引擎 v3.0
 * 支持 100+ 任务类型，1200+ 关键词
 * 引入智能分词、上下文理解、模糊匹配
 */

const fs = require('fs');
const path = require('path');

class UltraIntentAnalyzer {
  constructor() {
    this.mappings = this.loadMappings();
    this.keywordIndex = this.buildKeywordIndex();
    this.contextHistory = [];
    this.maxContextLength = 5;
  }

  loadMappings() {
    const mappingPath = path.join(__dirname, '../config/ultra-mappings.json');
    if (fs.existsSync(mappingPath)) {
      return JSON.parse(fs.readFileSync(mappingPath, 'utf-8'));
    }
    return { taskCategories: {}, defaultSkills: [], confidenceThreshold: 0.25 };
  }

  /**
   * 构建多层索引
   */
  buildKeywordIndex() {
    const index = {};
    const categories = this.mappings.taskCategories || {};
    
    for (const [categoryKey, categoryData] of Object.entries(categories)) {
      const keywords = categoryData.keywords || [];
      for (const keyword of keywords) {
        const kw = keyword.toLowerCase();
        
        // 完整关键词索引
        if (!index[kw]) {
          index[kw] = [];
        }
        index[kw].push({ category: categoryKey, exact: true });
        
        // 子串索引（用于模糊匹配）
        if (kw.length > 2) {
          for (let len = 3; len <= kw.length; len++) {
            const substr = kw.slice(0, len);
            if (!index[substr]) {
              index[substr] = [];
            }
            index[substr].push({ category: categoryKey, exact: false });
          }
        }
      }
    }
    
    return index;
  }

  /**
   * 智能分词 - 支持中文分词和英文单词
   */
  tokenize(input) {
    const tokens = new Set();
    
    // 1. 完整输入作为一个 token
    tokens.add(input.toLowerCase());
    
    // 2. 中文分词：2-6 字短语
    for (let len = 2; len <= Math.min(6, input.length); len++) {
      for (let i = 0; i <= input.length - len; i++) {
        const phrase = input.slice(i, i + len);
        if (/^[\u4e00-\u9fa5]+$/.test(phrase)) {
          tokens.add(phrase);
        }
      }
    }
    
    // 3. 英文单词和数字
    const englishWords = input.toLowerCase().match(/[a-z0-9]+/g) || [];
    englishWords.forEach(w => tokens.add(w));
    
    // 4. 常见缩写和同义词
    const synonyms = {
      'ppt': ['演示文稿', '幻灯片', '汇报'],
      'excel': ['表格', '电子表格', '数据表'],
      'word': ['文档', '文字处理'],
      'pdf': ['pdf 文档', 'pdf 文件'],
      'ai': ['人工智能', 'AI 技术'],
      'python': ['py', 'python 脚本'],
      'js': ['javascript', 'js 代码'],
      '小说': ['写书', '长篇', '故事'],
      '天气': ['气温', '预报', '下雨', '晴天'],
      '数据': ['分析', '统计', '图表'],
      '代码': ['编程', '开发', '脚本'],
      '图片': ['图', '画图', '生成'],
      '视频': ['剪辑', '制作', '短视频'],
      '音乐': ['歌曲', '音频', '配乐'],
      '学习': ['考试', '备考', '复习'],
      '工作': ['职业', '职场', '上班'],
      '生活': ['日常', '生活'],
      '健康': ['医疗', '疾病', '养生'],
      '美食': ['菜', '烹饪', '做饭'],
      '旅游': ['旅行', '出游', '玩'],
      '购物': ['买', '购买', '选购'],
      '社交': ['聊天', '交友', '沟通']
    };
    
    for (const [key, words] of Object.entries(synonyms)) {
      if (input.includes(key)) {
        words.forEach(w => tokens.add(w));
      }
      if (words.some(w => input.includes(w))) {
        tokens.add(key);
      }
    }
    
    return Array.from(tokens);
  }

  /**
   * 分析用户意图 - 增强版
   */
  analyze(userInput, context = {}) {
    const input = userInput.toLowerCase();
    const tokens = this.tokenize(input);
    const categoryScores = {};
    const matchDetails = {};
    
    // 1. 精确匹配（高权重）
    for (const token of tokens) {
      if (this.keywordIndex[token]) {
        for (const { category, exact } of this.keywordIndex[token]) {
          const weight = exact ? 3.0 : 1.5;
          const tokenScore = this.calculateTokenScore(token, input);
          
          if (!categoryScores[category]) {
            categoryScores[category] = 0;
            matchDetails[category] = [];
          }
          categoryScores[category] += tokenScore * weight;
          matchDetails[category].push({ token, score: tokenScore * weight, exact });
        }
      }
    }
    
    // 2. 模糊匹配（编辑距离）
    for (const [categoryKey, categoryData] of Object.entries(this.mappings.taskCategories)) {
      const fuzzyScore = this.fuzzyMatch(input, categoryData.keywords || []);
      if (fuzzyScore > 0) {
        if (!categoryScores[categoryKey]) {
          categoryScores[categoryKey] = 0;
          matchDetails[categoryKey] = [];
        }
        categoryScores[categoryKey] += fuzzyScore * 0.8; // 模糊匹配权重较低
        matchDetails[categoryKey].push({ type: 'fuzzy', score: fuzzyScore * 0.8 });
      }
    }
    
    // 3. 上下文增强
    if (context.history && context.history.length > 0) {
      const contextBoost = this.analyzeContext(context.history);
      for (const [category, boost] of Object.entries(contextBoost)) {
        if (categoryScores[category]) {
          categoryScores[category] += boost;
        }
      }
    }
    
    // 4. 排序并返回结果
    const sorted = Object.entries(categoryScores)
      .filter(([_, score]) => score > 0.5)
      .sort((a, b) => b[1] - a[1]);
    
    if (sorted.length === 0) {
      return this.createGeneralResult(input);
    }
    
    const [bestCategory, bestScore] = sorted[0];
    const categoryData = this.mappings.taskCategories[bestCategory];
    
    // 计算置信度（归一化到 0-1）
    const maxPossibleScore = Math.max(...Object.values(categoryScores)) * 1.5;
    const confidence = Math.min(1.0, bestScore / maxPossibleScore);
    
    return {
      success: confidence >= (this.mappings.confidenceThreshold || 0.25),
      category: bestCategory,
      confidence: confidence,
      description: categoryData.description || '',
      requiredSkills: categoryData.skills || [],
      requiredTools: categoryData.tools || [],
      subtasks: categoryData.subtasks || [],
      matchDetails: matchDetails[bestCategory] || [],
      allMatches: sorted.map(([catKey, score]) => ({
        category: catKey,
        score: score,
        description: this.mappings.taskCategories[catKey]?.description || ''
      }))
    };
  }

  /**
   * 计算 token 得分
   */
  calculateTokenScore(token, input) {
    const position = input.indexOf(token);
    if (position === -1) return 0;
    
    // 位置权重
    const positionWeight = 1 - (position / input.length);
    
    // 长度权重（长 token 更重要）
    const lengthWeight = Math.log(token.length + 1) / Math.log(input.length + 1);
    
    // 完整性权重
    const exactMatch = input === token ? 2.0 : 1.0;
    
    // 词频权重（在关键词列表中的出现次数）
    const keywordCount = (this.mappings.taskCategories || {});
    let frequencyBonus = 0;
    for (const cat of Object.values(keywordCount)) {
      if ((cat.keywords || []).some(k => k.toLowerCase() === token)) {
        frequencyBonus += 0.1;
      }
    }
    
    return positionWeight * (1 + lengthWeight) * exactMatch * (1 + Math.min(frequencyBonus, 0.5));
  }

  /**
   * 模糊匹配（基于编辑距离）
   */
  fuzzyMatch(input, keywords) {
    let maxScore = 0;
    
    for (const keyword of keywords) {
      const kw = keyword.toLowerCase();
      const distance = this.levenshteinDistance(input, kw);
      const maxLength = Math.max(input.length, kw.length);
      
      if (maxLength === 0) continue;
      
      const similarity = 1 - (distance / maxLength);
      
      // 只考虑相似度>0.6 的匹配
      if (similarity > 0.6) {
        maxScore = Math.max(maxScore, similarity);
      }
    }
    
    return maxScore;
  }

  /**
   * 编辑距离计算
   */
  levenshteinDistance(str1, str2) {
    const m = str1.length;
    const n = str2.length;
    const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
    
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (str1[i - 1] === str2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          dp[i][j] = Math.min(
            dp[i - 1][j] + 1,     // 删除
            dp[i][j - 1] + 1,     // 插入
            dp[i - 1][j - 1] + 1  // 替换
          );
        }
      }
    }
    
    return dp[m][n];
  }

  /**
   * 上下文分析
   */
  analyzeContext(history) {
    const boost = {};
    const recentCategories = history.slice(-3).map(h => h.category).filter(Boolean);
    
    // 最近提到的类别给予加成
    for (const category of recentCategories) {
      if (!boost[category]) boost[category] = 0;
      boost[category] += 0.3;
    }
    
    return boost;
  }

  createGeneralResult(input) {
    return {
      success: false,
      category: 'general',
      confidence: 0,
      description: '通用任务',
      requiredSkills: [],
      requiredTools: [],
      subtasks: [],
      matchDetails: [],
      allMatches: []
    };
  }

  /**
   * 更新上下文历史
   */
  updateContext(result) {
    this.contextHistory.push(result);
    if (this.contextHistory.length > this.maxContextLength) {
      this.contextHistory.shift();
    }
  }
}

module.exports = UltraIntentAnalyzer;
