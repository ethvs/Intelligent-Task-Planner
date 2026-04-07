/**
 * 终极意图分析引擎 v4.0
 * 引入：短词增强、跨类别消歧、上下文理解、自适应学习
 */

const fs = require('fs');
const path = require('path');

class UltimateIntentAnalyzer {
  constructor() {
    this.mappings = this.loadMappings();
    this.keywordIndex = this.buildKeywordIndex();
    this.contextHistory = [];
    this.maxContextLength = 10;
    this.userPreferences = {};
    this.errorLog = [];
    this.loadDisambiguationRules();
  }

  loadMappings() {
    const mappingPath = path.join(__dirname, '../config/ultra-mappings.json');
    if (fs.existsSync(mappingPath)) {
      return JSON.parse(fs.readFileSync(mappingPath, 'utf-8'));
    }
    return { taskCategories: {}, defaultSkills: [], confidenceThreshold: 0.25 };
  }

  /**
   * 加载消歧规则
   */
  loadDisambiguationRules() {
    this.disambiguationRules = {
      // "诊断" 的消歧
      '诊断': {
        'content': ['内容', '文章', '故事', '小说', '情节'],
        'health': ['健康', '身体', '疾病', '症状', '医院']
      },
      // "会议" 的消歧
      '会议': {
        'meeting_management': ['安排', '记录', '纪要', '日程', '时间'],
        'event_planning': ['活动', '策划', '大型', '组织', '筹备']
      },
      // "策划" 的消歧
      '策划': {
        'event_planning': ['活动', '会议', '聚会', '婚礼', '庆典'],
        'marketing_plan': ['营销', '推广', '品牌', '广告', '市场'],
        'creative_ideation': ['创意', '头脑风暴', '点子']
      },
      // "分析" 的消歧
      '分析': {
        'data_analysis_basic': ['数据', '统计', '图表', '报表', '趋势'],
        'content_diagnosis': ['内容', '文章', '逻辑', '问题'],
        'movie_analysis': ['电影', '剧情', '影评'],
        'financial_planning': ['财务', '投资', '股票', '基金']
      },
      // "创意" 的消歧
      '创意': {
        'creative_ideation': ['想法', '点子', '头脑风暴', '创新'],
        'creative_writing_article': ['文章', '写作', '文案'],
        'product_design': ['设计', '产品']
      }
    };

    // 短词增强映射（为短词添加隐含的完整意图）
    this.shortWordExpansions = {
      '冥想': ['mindfulness meditation', 'meditation practice', '静心 冥想', '正念 冥想'],
      '备考': ['exam preparation', 'exam review', '考试 备考', '复习 备考'],
      '创意': ['creative idea', 'brainstorming', '创新 想法', '构思 创意'],
      '会议': ['meeting schedule', 'meeting notes', '会议 安排', '会议 记录'],
      '简历': ['resume writing', 'resume optimization', '简历 制作', '简历 优化'],
      '面试': ['interview prep', 'interview skills', '面试 准备', '面试 技巧'],
      '诊断': ['content diagnosis', 'problem diagnosis', '问题 诊断', '内容 诊断'],
      '分析': ['data analysis', 'statistical analysis', '数据 分析', '统计 分析'],
      '策划': ['event planning', 'marketing planning', '活动 策划', '营销 策划'],
      '设计': ['product design', 'character design', '产品 设计', '角色 设计'],
      '图表': ['data chart', 'statistics chart', '数据 图表', '统计 图表'],
      '生成': ['generate image', 'generate content', '生成 图片', '生成 内容']
    };
    
    // 强制类别映射（某些词组强制映射到特定类别）
    this.forcedMappings = {
      '活动策划': 'event_planning',
      '营销 策划': 'marketing_plan',
      '冥想 练习': 'mindfulness_meditation',
      '冥想 静心': 'mindfulness_meditation',
      '备考 复习': 'exam_preparation',
      '备考 考试': 'exam_preparation',
      '生成 图表': 'data_analysis_basic',
      '数据 图表': 'data_analysis_basic',
      '统计 图表': 'data_analysis_basic'
    };
  }

  buildKeywordIndex() {
    const index = {};
    const categories = this.mappings.taskCategories || {};
    
    for (const [categoryKey, categoryData] of Object.entries(categories)) {
      const keywords = categoryData.keywords || [];
      for (const keyword of keywords) {
        const kw = keyword.toLowerCase();
        if (!index[kw]) index[kw] = [];
        index[kw].push({ category: categoryKey, exact: true });
        
        // 为长关键词建立子串索引
        if (kw.length > 2) {
          for (let len = 2; len <= Math.min(5, kw.length); len++) {
            const substr = kw.slice(0, len);
            if (!index[substr]) index[substr] = [];
            index[substr].push({ category: categoryKey, exact: false });
          }
        }
      }
    }
    
    return index;
  }

  /**
   * 增强版分词 - 支持短词扩展
   */
  tokenize(input) {
    const tokens = new Set();
    const lowerInput = input.toLowerCase();
    
    // 1. 完整输入
    tokens.add(lowerInput);
    
    // 2. 短词扩展（关键优化）
    const words = lowerInput.split(/[\s,，。！？!？]/);
    for (const word of words) {
      if (word.length <= 2 && this.shortWordExpansions[word]) {
        this.shortWordExpansions[word].forEach(expanded => {
          tokens.add(expanded);
          // 扩展词的分词
          expanded.split(' ').forEach(w => tokens.add(w));
        });
      }
      tokens.add(word);
    }
    
    // 3. 中文短语 (2-6 字)
    for (let len = 2; len <= Math.min(6, input.length); len++) {
      for (let i = 0; i <= input.length - len; i++) {
        const phrase = input.slice(i, i + len);
        if (/^[\u4e00-\u9fa5]+$/.test(phrase)) {
          tokens.add(phrase);
        }
      }
    }
    
    // 4. 英文单词
    const englishWords = lowerInput.match(/[a-z0-9]+/g) || [];
    englishWords.forEach(w => tokens.add(w));
    
    // 5. 同义词扩展
    const synonyms = {
      'ppt': ['演示文稿', '幻灯片'],
      'python': ['py', 'python 脚本'],
      'js': ['javascript', 'js 代码'],
      '小说': ['写书', '长篇'],
      '天气': ['气温', '预报'],
      '数据': ['分析', '统计', '图表'],
      '代码': ['编程', '开发'],
      '图片': ['图', '画图'],
      '学习': ['考试', '备考'],
      '工作': ['职业', '职场']
    };
    
    for (const [key, words] of Object.entries(synonyms)) {
      if (lowerInput.includes(key)) {
        words.forEach(w => tokens.add(w));
      }
    }
    
    return Array.from(tokens);
  }

  /**
   * 终极分析 - 包含消歧逻辑
   */
  analyze(userInput, context = {}) {
    const input = userInput.toLowerCase();
    const tokens = this.tokenize(input);
    const categoryScores = {};
    const matchDetails = {};
    
    // 0. 强制映射检查（最高优先级）
    for (const [phrase, category] of Object.entries(this.forcedMappings || {})) {
      if (input.includes(phrase.toLowerCase()) || userInput.includes(phrase)) {
        if (!categoryScores[category]) {
          categoryScores[category] = 0;
          matchDetails[category] = [];
        }
        categoryScores[category] += 5.0;
      }
    }
    
    // 1. 基础匹配
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
    
    // 2. 模糊匹配
    for (const [categoryKey, categoryData] of Object.entries(this.mappings.taskCategories)) {
      const fuzzyScore = this.fuzzyMatch(input, categoryData.keywords || []);
      if (fuzzyScore > 0) {
        if (!categoryScores[categoryKey]) {
          categoryScores[categoryKey] = 0;
          matchDetails[categoryKey] = [];
        }
        categoryScores[categoryKey] += fuzzyScore * 0.8;
        matchDetails[categoryKey].push({ type: 'fuzzy', score: fuzzyScore * 0.8 });
      }
    }
    
    // 3. 短词消歧（关键优化）
    this.applyDisambiguation(input, categoryScores, matchDetails);
    
    // 4. 上下文增强
    if (context.history && context.history.length > 0) {
      const contextBoost = this.analyzeContext(context.history);
      for (const [category, boost] of Object.entries(contextBoost)) {
        if (categoryScores[category]) {
          categoryScores[category] += boost;
        }
      }
    }
    
    // 5. 用户偏好加成
    for (const [category, preference] of Object.entries(this.userPreferences)) {
      if (categoryScores[category]) {
        categoryScores[category] *= (1 + preference * 0.1);
      }
    }
    
    // 6. 排序并返回
    const sorted = Object.entries(categoryScores)
      .filter(([_, score]) => score > 0.3)
      .sort((a, b) => b[1] - a[1]);
    
    if (sorted.length === 0) {
      return this.createGeneralResult(input);
    }
    
    const [bestCategory, bestScore] = sorted[0];
    const categoryData = this.mappings.taskCategories[bestCategory];
    
    const maxPossibleScore = Math.max(...Object.values(categoryScores)) * 1.5;
    const confidence = Math.min(1.0, bestScore / maxPossibleScore);
    
    const result = {
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
    
    // 更新上下文
    this.updateContext(result);
    
    return result;
  }

  /**
   * 应用消歧规则
   */
  applyDisambiguation(input, categoryScores, matchDetails) {
    const inputLower = input.toLowerCase();
    
    for (const [triggerWord, rules] of Object.entries(this.disambiguationRules)) {
      if (inputLower.includes(triggerWord)) {
        // 检查上下文词，决定归属
        for (const [targetCategory, contextWords] of Object.entries(rules)) {
          const hasContext = contextWords.some(word => inputLower.includes(word));
          if (hasContext) {
            // 加强目标类别
            if (categoryScores[targetCategory]) {
              categoryScores[targetCategory] *= 1.5;
            } else {
              categoryScores[targetCategory] = 0.5;
            }
          }
        }
      }
    }
  }

  calculateTokenScore(token, input) {
    const position = input.indexOf(token);
    if (position === -1) return 0;
    
    const positionWeight = 1 - (position / input.length);
    const lengthWeight = Math.log(token.length + 1) / Math.log(input.length + 1);
    const exactMatch = input === token ? 2.0 : 1.0;
    
    return positionWeight * (1 + lengthWeight) * exactMatch;
  }

  fuzzyMatch(input, keywords) {
    let maxScore = 0;
    for (const keyword of keywords) {
      const kw = keyword.toLowerCase();
      const distance = this.levenshteinDistance(input, kw);
      const maxLength = Math.max(input.length, kw.length);
      if (maxLength === 0) continue;
      
      const similarity = 1 - (distance / maxLength);
      if (similarity > 0.6) {
        maxScore = Math.max(maxScore, similarity);
      }
    }
    return maxScore;
  }

  levenshteinDistance(str1, str2) {
    const m = str1.length, n = str2.length;
    const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
    
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (str1[i - 1] === str2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + 1);
        }
      }
    }
    return dp[m][n];
  }

  analyzeContext(history) {
    const boost = {};
    const recentCategories = history.slice(-3).map(h => h.category).filter(Boolean);
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

  updateContext(result) {
    this.contextHistory.push(result);
    if (this.contextHistory.length > this.maxContextLength) {
      this.contextHistory.shift();
    }
  }

  /**
   * 记录错误用于后续学习
   */
  logError(input, expected, actual) {
    this.errorLog.push({
      timestamp: Date.now(),
      input,
      expected,
      actual
    });
    
    // 保留最近 100 条错误
    if (this.errorLog.length > 100) {
      this.errorLog.shift();
    }
  }

  /**
   * 用户反馈学习
   */
  learnFromFeedback(input, correctCategory) {
    // 简单实现：增加正确类别的权重
    if (!this.userPreferences[correctCategory]) {
      this.userPreferences[correctCategory] = 0;
    }
    this.userPreferences[correctCategory] = Math.min(5, this.userPreferences[correctCategory] + 0.5);
  }
}

module.exports = UltimateIntentAnalyzer;
