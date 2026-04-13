/**
 * 意图分析引擎
 * 分析用户输入，识别任务类型和意图
 */

const fs = require('fs');
const path = require('path');

class IntentAnalyzer {
  constructor() {
    this.mappings = this.loadMappings();
  }

  loadMappings() {
    // 优先加载终极映射文件
    const ultimatePath = path.join(__dirname, '../config/ultimate-mappings.json');
    if (fs.existsSync(ultimatePath)) {
      return JSON.parse(fs.readFileSync(ultimatePath, 'utf-8'));
    }

    // 回退到原始映射
    const mappingPath = path.join(__dirname, '../config/mappings.json');
    if (fs.existsSync(mappingPath)) {
      return JSON.parse(fs.readFileSync(mappingPath, 'utf-8'));
    }
    return { taskCategories: {}, defaultSkills: [], confidenceThreshold: 0.6 };
  }

  /**
   * 分析用户意图
   * @param {string} userInput - 用户输入
   * @returns {Object} 分析结果 { category, confidence, matchedSkills, tools }
   */
  analyze(userInput) {
    const input = userInput.toLowerCase();
    const results = [];

    // 遍历所有任务类别进行匹配
    for (const [categoryKey, categoryData] of Object.entries(this.mappings.taskCategories)) {
      const score = this.calculateMatchScore(input, categoryData.keywords);
      
      if (score > 0) {
        results.push({
          category: categoryKey,
          confidence: score,
          description: categoryData.description,
          skills: categoryData.skills || [],
          tools: categoryData.tools || []
        });
      }
    }

    // 按置信度排序
    results.sort((a, b) => b.confidence - a.confidence);

    // 返回最佳匹配（如果超过阈值）
    const bestMatch = results[0];
    if (bestMatch && bestMatch.confidence >= this.mappings.confidenceThreshold) {
      return {
        success: true,
        category: bestMatch.category,
        confidence: bestMatch.confidence,
        description: bestMatch.description,
        requiredSkills: bestMatch.skills,
        requiredTools: bestMatch.tools,
        allMatches: results
      };
    }

    // 无明确匹配
    return {
      success: false,
      category: 'general',
      confidence: 0,
      description: '通用任务',
      requiredSkills: [],
      requiredTools: [],
      allMatches: results
    };
  }

  /**
   * 计算输入与关键词的匹配度
   * @param {string} input - 用户输入
   * @param {Array<string>} keywords - 关键词列表
   * @returns {number} 匹配置信度 0-1
   */
  calculateMatchScore(input, keywords) {
    if (!keywords || keywords.length === 0) return 0;

    let matchCount = 0;
    let maxScore = 0;
    
    for (const keyword of keywords) {
      const kw = keyword.toLowerCase();
      
      // 完全匹配
      if (input.includes(kw)) {
        matchCount++;
        // 根据关键词位置加权（越靠前权重越高）
        const position = input.indexOf(kw);
        const positionWeight = 1 - (position / input.length);
        // 关键词长度加权（越长权重越高）
        const lengthWeight = kw.length / Math.max(2, input.length);
        const score = positionWeight * (1 + lengthWeight);
        maxScore = Math.max(maxScore, score);
      }
    }

    // 多个关键词匹配时提高置信度
    if (matchCount > 1) {
      maxScore = Math.min(1.0, maxScore * (1 + (matchCount - 1) * 0.2));
    }

    return maxScore;
  }

  /**
   * 提取任务参数
   * @param {string} userInput - 用户输入
   * @returns {Object} 提取的参数
   */
  extractParameters(userInput) {
    const params = {};
    
    // 提取时间相关
    const timeMatch = userInput.match(/(今天 | 明天 | 后天 | 下周 | 下周 | 每月 | 每天|每周)/);
    if (timeMatch) {
      params.time = timeMatch[0];
    }

    // 提取地点相关
    const locationMatch = userInput.match(/(北京 | 上海 | 广州 | 深圳 | [a-zA-Z\s]+市)/);
    if (locationMatch) {
      params.location = locationMatch[0];
    }

    // 提取数字
    const numberMatch = userInput.match(/(\d+)/);
    if (numberMatch) {
      params.number = numberMatch[0];
    }

    return params;
  }
}

module.exports = IntentAnalyzer;
