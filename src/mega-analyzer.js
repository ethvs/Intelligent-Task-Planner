/**
 * v5.0 Mega Analyzer - 百任务超级分析器
 * 核心特性：
 * 1. 三层关键词扫描（动词→名词→修饰词）
 * 2. 技能链自动执行（多阶段、多技能）
 * 3. 质量门控验证（每阶段完成后验证）
 * 4. 透明度声明（执行前完整告知用户）
 */

const fs = require('fs');
const path = require('path');

class MegaAnalyzer {
  constructor() {
    this.mappings = this.loadMappings();
    this.keywordIndex = this.buildKeywordIndex();
    
    // 三层词库
    this.verbLayer = this.buildVerbLayer();
    this.nounLayer = this.buildNounLayer();
    this.modifierLayer = this.buildModifierLayer();
    
    // 技能链定义
    this.skillChains = this.loadSkillChains();
  }

  loadMappings() {
    // 优先加载终极映射文件
    const ultimatePath = path.join(__dirname, '../config/ultimate-mappings.json');
    if (fs.existsSync(ultimatePath)) {
      return JSON.parse(fs.readFileSync(ultimatePath, 'utf-8'));
    }

    // 回退到 mega-mappings
    const mappingPath = path.join(__dirname, '../config/mega-mappings.json');
    if (fs.existsSync(mappingPath)) {
      return JSON.parse(fs.readFileSync(mappingPath, 'utf-8'));
    }
    return { taskCategories: {}, defaultSkills: [], confidenceThreshold: 0.25 };
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
      }
    }
    
    return index;
  }

  /**
   * 第一层：动词意图库
   */
  buildVerbLayer() {
    return {
      // 创作类
      '写': 'create', '创作': 'create', '生成': 'create', '制作': 'create',
      '撰写': 'create', '编写': 'create', '创造': 'create', '打造': 'create',
      
      // 设计类
      '设计': 'design', '规划': 'plan', '策划': 'plan', '计划': 'plan',
      '安排': 'plan', '布局': 'design', '构思': 'design',
      
      // 分析类
      '分析': 'analyze', '统计': 'analyze', '评估': 'analyze', '诊断': 'analyze',
      '检查': 'analyze', '审查': 'analyze', '审核': 'analyze', '检测': 'analyze',
      
      // 查询类
      '查': 'query', '查询': 'query', '搜索': 'query', '找': 'query',
      '查找': 'query', '搜寻': 'query', '检索': 'query',
      
      // 学习类
      '学': 'learn', '学习': 'learn', '练习': 'learn', '复习': 'learn',
      '背诵': 'learn', '记忆': 'learn', '理解': 'learn',
      
      // 管理类
      '管理': 'manage', '组织': 'manage', '整理': 'manage', '处理': 'manage',
      '协调': 'manage', '调度': 'manage', '安排': 'manage',
      
      // 优化类
      '优化': 'optimize', '改进': 'optimize', '提升': 'optimize', '改善': 'optimize',
      '增强': 'optimize', '完善': 'optimize', '润色': 'optimize', '修改': 'optimize',
      
      // 输出类
      '导出': 'export', '输出': 'export', '发布': 'export', '提交': 'export',
      '保存': 'export', '存储': 'export',
    };
  }

  /**
   * 第二层：对象名词库
   */
  buildNounLayer() {
    return {
      // 文档类
      '小说': 'novel', '文章': 'article', '诗歌': 'poetry', '剧本': 'script',
      '论文': 'thesis', '报告': 'report', '计划': 'plan', '方案': 'plan',
      '文案': 'copy', '稿件': 'manuscript', '故事': 'story', '内容': 'content',
      
      // 数据类
      '数据': 'data', '图表': 'chart', '报表': 'report', '统计': 'statistics',
      '信息': 'information', '资料': 'material', '文件': 'file',
      
      // 媒体类
      '图片': 'image', '视频': 'video', '音频': 'audio', '音乐': 'music',
      '照片': 'photo', '影像': 'video', '声音': 'audio',
      
      // 代码类
      '代码': 'code', '程序': 'program', '脚本': 'script', '软件': 'software',
      '应用': 'app', '系统': 'system', '功能': 'function',
      
      // 生活类
      '旅行': 'travel', '菜谱': 'recipe', '穿搭': 'fashion', '健身': 'fitness',
      '学习': 'learning', '工作': 'career', '生活': 'life', '健康': 'health',
      
      // 商业类
      '营销': 'marketing', '品牌': 'brand', '市场': 'market', '销售': 'sales',
      '客户': 'customer', '产品': 'product', '服务': 'service',
      
      // 其他
      '角色': 'character', '大纲': 'outline', '世界': 'world', '情节': 'plot',
      '人物': 'character', '场景': 'scene', '对话': 'dialogue',
    };
  }

  /**
   * 第三层：修饰词库
   */
  buildModifierLayer() {
    return {
      // 小说类型
      '玄幻': 'fantasy', '科幻': 'sci-fi', '都市': 'urban', '言情': 'romance',
      '悬疑': 'mystery', '历史': 'historical', '军事': 'military', '武侠': 'martial',
      '仙侠': 'xianxia', '网游': 'game', '穿越': 'time-travel', '修真': 'cultivation',
      
      // 分析类型
      '营销': 'marketing', '学术': 'academic', '商业': 'business', '财务': 'financial',
      '市场': 'market', '技术': 'technical', '产品': 'product', '用户': 'user',
      
      // 质量描述
      '快速': 'quick', '详细': 'detailed', '专业': 'professional', '深度': 'deep',
      '全面': 'comprehensive', '系统': 'systematic', '高效': 'efficient',
      
      // 风格描述
      '幽默': 'humorous', '严肃': 'serious', '正式': 'formal', '随意': 'casual',
      '生动': 'vivid', '简洁': 'concise', '华丽': 'ornate',
    };
  }

  /**
   * 技能链定义 - 复杂任务的执行流程
   */
  loadSkillChains() {
    return {
      // 长篇小说创作技能链
      'creative_writing_novel': {
        name: '长篇小说创作',
        phases: [
          {
            name: '前期策划',
            skills: ['outline_creation', 'character_design', 'world_building'],
            qualityGate: {
              checks: ['structure_completeness', 'character_motivation', 'world_consistency'],
              threshold: 0.8
            }
          },
          {
            name: '内容创作',
            skills: ['chapter_writing', 'plot_development', 'dialogue_creation'],
            qualityGate: {
              checks: ['logic_consistency', 'pacing', 'character_behavior'],
              threshold: 0.75
            }
          },
          {
            name: '质量提升',
            skills: ['content_diagnosis', 'content_polishing', 'ai_tone_removal'],
            qualityGate: {
              checks: ['ai_detection', 'fluency', 'style_consistency'],
              threshold: 0.85
            }
          },
          {
            name: '输出交付',
            skills: ['formatting', 'final_review', 'export_publish'],
            qualityGate: {
              checks: ['format_standard', 'typo_check', 'completeness'],
              threshold: 0.9
            }
          }
        ]
      },
      
      // 文章创作技能链
      'creative_writing_article': {
        name: '文章创作',
        phases: [
          {
            name: '主题确定',
            skills: ['topic_analysis', 'outline_creation'],
            qualityGate: { checks: ['topic_clarity', 'structure'], threshold: 0.8 }
          },
          {
            name: '初稿撰写',
            skills: ['draft_writing', 'content_generation'],
            qualityGate: { checks: ['completeness', 'logic'], threshold: 0.7 }
          },
          {
            name: '编辑润色',
            skills: ['editing', 'proofreading', 'tone_adjustment'],
            qualityGate: { checks: ['grammar', 'style', 'clarity'], threshold: 0.85 }
          }
        ]
      },
      
      // 数据分析技能链
      'data_analysis_basic': {
        name: '数据分析',
        phases: [
          {
            name: '数据准备',
            skills: ['data_loading', 'data_cleaning'],
            qualityGate: { checks: ['completeness', 'accuracy'], threshold: 0.9 }
          },
          {
            name: '分析建模',
            skills: ['statistical_analysis', 'trend_analysis'],
            qualityGate: { checks: ['method_appropriate', 'result_valid'], threshold: 0.8 }
          },
          {
            name: '可视化报告',
            skills: ['chart_generation', 'report_writing'],
            qualityGate: { checks: ['clarity', 'insightful'], threshold: 0.85 }
          }
        ]
      }
    };
  }

  /**
   * 三层扫描机制 - 核心识别算法
   */
  threeLayerScan(input) {
    const lowerInput = input.toLowerCase();
    const tokens = this.tokenize(input);
    
    let verbMatch = null;
    let nounMatch = null;
    let modifierMatch = null;
    
    // 第一层：动词匹配
    for (const [verb, intent] of Object.entries(this.verbLayer)) {
      if (lowerInput.includes(verb)) {
        verbMatch = { verb, intent };
        break;
      }
    }
    
    // 第二层：名词匹配
    for (const [noun, category] of Object.entries(this.nounLayer)) {
      if (lowerInput.includes(noun)) {
        nounMatch = { noun, category };
        break;
      }
    }
    
    // 第三层：修饰词匹配
    for (const [modifier, type] of Object.entries(this.modifierLayer)) {
      if (lowerInput.includes(modifier)) {
        modifierMatch = { modifier, type };
        break;
      }
    }
    
    return { verbMatch, nounMatch, modifierMatch, tokens };
  }

  /**
   * 智能分词
   */
  tokenize(input) {
    const tokens = new Set();
    const lowerInput = input.toLowerCase();
    
    // 完整输入
    tokens.add(lowerInput);
    
    // 中文分词（2-6 字）
    for (let len = 2; len <= Math.min(6, input.length); len++) {
      for (let i = 0; i <= input.length - len; i++) {
        const phrase = input.slice(i, i + len);
        if (/^[\u4e00-\u9fa5]+$/.test(phrase)) {
          tokens.add(phrase);
        }
      }
    }
    
    // 英文单词
    const englishWords = lowerInput.match(/[a-z0-9]+/g) || [];
    englishWords.forEach(w => tokens.add(w));
    
    return Array.from(tokens);
  }

  /**
   * 分析用户意图 - 主方法
   */
  analyze(userInput, context = {}) {
    const scanResult = this.threeLayerScan(userInput);
    const { verbMatch, nounMatch, modifierMatch, tokens } = scanResult;
    
    // 1. 使用三层扫描结果匹配合适的任务类型
    let bestMatch = null;
    let bestScore = 0;
    
    for (const [categoryKey, categoryData] of Object.entries(this.mappings.taskCategories)) {
      const score = this.calculateCategoryScore(categoryKey, categoryData, scanResult);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = {
          category: categoryKey,
          score: score,
          data: categoryData
        };
      }
    }
    
    if (!bestMatch || bestScore < 0.3) {
      return this.createGeneralResult(userInput);
    }
    
    // 2. 构建结果
    const result = {
      success: true,
      category: bestMatch.category,
      confidence: Math.min(1.0, bestScore),
      description: bestMatch.data.description,
      requiredSkills: bestMatch.data.skills || [],
      requiredTools: bestMatch.data.tools || [],
      subtasks: bestMatch.data.subtasks || [],
      scanResult, // 三层扫描结果
      transparency: this.generateTransparencyReport(bestMatch, scanResult),
      skillChain: this.skillChains[bestMatch.category] || null
    };
    
    return result;
  }

  /**
   * 计算类别得分 - 增强版多维度评分
   */
  calculateCategoryScore(categoryKey, categoryData, scanResult) {
    const { verbMatch, nounMatch, modifierMatch, tokens } = scanResult;
    let score = 0;
    const keywords = categoryData.keywords || [];
    const input = tokens.join(' ');

    // ====== 1. 三层核心匹配得分 ======
    let layerMatches = 0;

    // 动词匹配得分 - 强意图信号
    if (verbMatch) {
      const hasVerb = keywords.some(k => k.includes(verbMatch.verb));
      if (hasVerb) {
        score += 0.35;
        layerMatches++;
      }
    }

    // 名词匹配得分 - 核心对象
    if (nounMatch) {
      const hasNoun = keywords.some(k => k.includes(nounMatch.noun));
      if (hasNoun) {
        score += 0.35;
        layerMatches++;
      }
    }

    // 修饰词匹配得分 - 细化意图
    if (modifierMatch) {
      const hasModifier = keywords.some(k => k.includes(modifierMatch.modifier));
      if (hasModifier) {
        score += 0.20;
        layerMatches++;
      }
    }

    // ====== 2. 组合加成 - 多维度同时匹配 ======
    if (layerMatches >= 3) {
      score *= 1.4; // 三层全匹配，40%加成
    } else if (layerMatches >= 2) {
      score *= 1.25; // 两层匹配，25%加成
    }

    // ====== 3. 关键词精确匹配（带权重） ======
    let keywordMatchCount = 0;
    let exactMatchBonus = 0;

    for (const keyword of keywords) {
      const kw = keyword.toLowerCase();

      // 精确包含匹配
      if (input.includes(kw)) {
        keywordMatchCount++;

        // 位置权重（越靠前权重越高）
        const position = input.indexOf(kw);
        const positionWeight = position >= 0 ? (1 - position / (input.length + 1)) : 0.5;

        // 长度权重（越长越精确）
        const lengthWeight = Math.min(1, kw.length / 4);

        // 组合短语权重（2字以上短语）
        const phraseWeight = kw.length >= 2 ? 1.3 : 1.0;

        const weightedScore = 0.12 * positionWeight * (1 + lengthWeight) * phraseWeight;
        score += weightedScore;
        exactMatchBonus += 0.08;
      }
    }

    // 多关键词匹配额外加成
    if (keywordMatchCount >= 3) {
      score *= 1.3;
    } else if (keywordMatchCount >= 2) {
      score *= 1.15;
    }

    // ====== 4. 类别特征匹配（针对特定领域） ======
    const description = categoryData.description || '';
    const categoryKeywords = description.toLowerCase().split(/[,\uFF0C\u3001\uFF1B;]/);

    // 检查输入是否包含类别描述中的关键词
    for (const catKw of categoryKeywords) {
      if (catKw.trim() && input.includes(catKw.trim())) {
        score += 0.15;
      }
    }

    return score;
  }

  /**
   * 生成透明度报告
   */
  generateTransparencyReport(match, scanResult) {
    const { category, score, data } = match;
    
    return {
      taskType: category,
      confidence: score,
      detectedLayers: {
        verb: scanResult.verbMatch ? scanResult.verbMatch.verb : null,
        noun: scanResult.nounMatch ? scanResult.nounMatch.noun : null,
        modifier: scanResult.modifierMatch ? scanResult.modifierMatch.modifier : null
      },
      skillChain: data.subtasks ? data.subtasks.length : 0,
      estimatedTime: this.estimateExecutionTime(data),
      qualityGates: data.subtasks ? data.subtasks.length : 0
    };
  }

  /**
   * 预估执行时间
   */
  estimateExecutionTime(data) {
    const baseTime = 1; // 分钟
    const subtasks = data.subtasks || [];
    return baseTime * subtasks.length;
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
      scanResult: null,
      transparency: null,
      skillChain: null
    };
  }
}

module.exports = MegaAnalyzer;
