/**
 * Intelligent Task Planner v3.0 - 主规划器
 * 核心功能：
 * 1. 任务解析与意图识别
 * 2. 技能链构建与调度
 * 3. 自动技能安装
 * 4. 执行计划生成与透明度报告
 * 5. 多轮任务处理
 * 6. 模糊请求追问
 * 7. 上下文多轮记忆
 * 8. 自适应学习
 */

const IntentAnalyzer = require('./intent-analyzer');
const SkillMatcher = require('./skill-matcher');
const executor = require('./executor');
const MegaAnalyzer = require('./mega-analyzer');
const fs = require('fs');
const path = require('path');

class IntelligentTaskPlanner {
  constructor() {
    this.intentAnalyzer = new IntentAnalyzer();
    this.megaAnalyzer = new MegaAnalyzer();
    this.skillMatcher = new SkillMatcher();
    this.executor = executor;
    this.config = this.loadConfig();
    this.executionLog = [];

    // 会话管理
    this.sessions = new Map();

    // 多轮对话记忆
    this.conversationMemory = new Map();

    // 自适应学习 - 用户反馈收集
    this.feedbackHistory = new Map();

    // 模糊请求关键词库
    this.ambiguityKeywords = this.buildAmbiguityKeywords();

    // 多语言支持
    this.languageConfig = this.loadLanguageConfig();
  }

  /**
   * 构建模糊请求关键词库
   */
  buildAmbiguityKeywords() {
    return {
      // 表示不明确的词
      vague: ['随便', '都可以', 'whatever', 'anything', '无所谓', '随便吧', '你定', '你看着办'],
      // 表示需要更多信息
      needMore: ['帮我写', '做一下', '那个', '什么的', '类似', '大概', '差不多', '随便搞搞'],
      // 表示需要创意
      needCreative: ['帮我', '给我', '要一个', '来一个', '做一个', '搞一个'],
      // 表示模糊的数量
      vagueQuantity: ['一些', '一点', '几篇', '几章', '若干', '若干']
    };
  }

  /**
   * 加载语言配置
   */
  loadLanguageConfig() {
    return {
      default: 'zh-CN',
      supported: ['zh-CN', 'zh-TW', 'en-US', 'ja-JP', 'ko-KR'],
      // 关键词多语言映射
      keywords: {
        'zh-CN': { '写': 'write', '学习': 'learn', '分析': 'analyze', '计划': 'plan' },
        'zh-TW': { '寫': 'write', '學習': 'learn', '分析': 'analyze', '計畫': 'plan' },
        'en-US': { 'write': 'write', 'learn': 'learn', 'analyze': 'analyze', 'plan': 'plan' }
      }
    };
  }

  loadConfig() {
    return {
      autoInstall: true,
      sources: ['clawhub', 'github'],
      requireConfirmation: false,
      maxSteps: 20,
      timeoutMinutes: 30,
      enableSkillChain: true,
      qualityGate: true,
      maxIterations: 3,
      qualityThreshold: 0.85
    };
  }

  /**
   * 主入口 - 处理用户任务
   * @param {string} userInput - 用户输入
   * @param {Object} context - 额外上下文
   * @returns {Object} 执行结果
   */
  async processTask(userInput, context = {}) {
    const startTime = Date.now();
    const sessionId = context.sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // 检查是否是追问回复
    if (context.clarificationAnswers) {
      return await this.handleClarificationResponse(sessionId, context.clarificationAnswers, context);
    }

    // 加载历史对话上下文（多轮记忆）
    const historicalContext = this.loadConversationContext(sessionId);

    console.log(`\n${'='.repeat(70)}`);
    console.log(`🤖 Intelligent Task Planner v3.0 - 智能任务规划器`);
    console.log(`${'─'.repeat(70)}`);
    console.log(`📝 用户输入: ${userInput}`);
    console.log(`🆔 会话ID: ${sessionId}`);
    if (historicalContext && historicalContext.length > 0) {
      console.log(`📚 历史上下文: ${historicalContext.length} 条对话`);
    }
    console.log(`${'='.repeat(70)}\n`);

    // 增强上下文（合并历史上下文）
    const enhancedContext = {
      ...context,
      sessionId,
      historicalContext,
      previousCategory: historicalContext?.[0]?.category
    };

    // ====== 步骤 0: 模糊请求检测（是否需要追问）======
    const clarificationCheck = this.checkAmbiguousRequest(userInput, enhancedContext);
    if (clarificationCheck.needsClarification) {
      console.log(`⚠️ 检测到模糊请求，需要确认细节`);
      // 保存当前请求到记忆
      this.saveConversationContext(sessionId, {
        role: 'user',
        content: userInput,
        timestamp: Date.now(),
        requiresClarification: true
      });
      return {
        success: false,
        needsClarification: true,
        questions: clarificationCheck.questions,
        sessionId,
        clarificationType: 'ambiguous_request'
      };
    }

    // 保存会话
    this.sessions.set(sessionId, {
      userInput,
      context: enhancedContext,
      startTime,
      status: 'analyzing'
    });

    // 保存用户输入到对话记忆
    this.saveConversationContext(sessionId, {
      role: 'user',
      content: userInput,
      timestamp: Date.now()
    });

    try {
      // ====== 步骤 1: 意图识别 ======
      console.log(`[${this.formatTime()}] 📊 步骤 1: 意图识别（三层关键词扫描）`);
      const intentResult = await this.analyzeIntent(userInput, context);
      this.log('intent', intentResult);

      if (!intentResult.success) {
        // 需要追问
        if (intentResult.needsClarification) {
          return {
            success: false,
            needsClarification: true,
            questions: intentResult.questions,
            sessionId,
            intent: intentResult
          };
        }
        console.log('⚠️ 无法识别任务类型，使用通用处理流程');
        return await this.handleGeneralTask(userInput, context);
      }

      console.log(`✓ 识别结果: ${intentResult.category}`);
      console.log(`  置信度: ${(intentResult.confidence * 100).toFixed(1)}%`);
      console.log(`  描述: ${intentResult.description || '无'}`);

      // ====== 步骤 2: 技能链构建 ======
      console.log(`\n[${this.formatTime()}] 🔗 步骤 2: 技能链构建`);
      const skillChain = this.buildSkillChain(intentResult);
      console.log(`✓ 技能链: ${skillChain.name || '默认'}`);
      console.log(`  阶段数: ${skillChain.phases?.length || 0}`);

      if (skillChain.phases) {
        skillChain.phases.forEach((phase, i) => {
          console.log(`    ${i + 1}. ${phase.name} (${phase.skills?.join(', ') || '无特定技能'})`);
        });
      }

      // ====== 步骤 3: 技能准备 ======
      console.log(`\n[${this.formatTime()}] 🔧 步骤 3: 技能准备`);
      const requiredSkills = this.extractRequiredSkills(skillChain);
      console.log(`  需求技能: ${requiredSkills.join(', ') || '使用通用LLM'}`);

      const skillPreparation = await this.skillMatcher.prepareSkills(requiredSkills);
      this.log('skillPreparation', skillPreparation);

      const availableSkills = skillPreparation.installed;
      console.log(`✓ 已安装技能: ${availableSkills.join(', ') || '无'}`);
      console.log(`  待安装: ${skillPreparation.toInstall.join(', ') || '无'}`);
      console.log(`  替代技能: ${skillPreparation.alternatives.map(a => `${a.original}→${a.alternative}`).join(', ') || '无'}`);

      // ====== 步骤 4: 任务分解 ======
      console.log(`\n[${this.formatTime()}] 📋 步骤 4: 任务分解`);
      const taskPlan = {
        sessionId,
        userInput,
        category: intentResult.category,
        description: intentResult.description,
        confidence: intentResult.confidence,
        requiredSkills,
        availableSkills,
        skillChain,
        transparency: intentResult.transparency,
        qualityThreshold: this.config.qualityThreshold,
        context
      };

      this.log('taskPlan', taskPlan);

      // 生成透明执行计划
      const executionPlan = this.generateExecutionPlan(taskPlan);
      console.log(`✓ 执行计划已生成`);
      console.log(`  预估时间: ${executionPlan.estimatedTime}分钟`);
      console.log(`  质量检查点: ${executionPlan.qualityGates}个`);

      // ====== 步骤 5: 执行任务 ======
      console.log(`\n[${this.formatTime()}] 🚀 步骤 5: 执行任务`);
      console.log(`${'─'.repeat(50)}`);

      const executionResult = await this.executor.execute(taskPlan, context);
      this.log('execution', executionResult);

      // ====== 步骤 6: 结果处理 ======
      console.log(`\n[${this.formatTime()}] ✅ 步骤 6: 结果处理`);

      if (executionResult.needsClarification) {
        console.log('⚠️ 需要用户澄清问题');
        return {
          success: false,
          needsClarification: true,
          questions: executionResult.questions,
          sessionId,
          taskPlan
        };
      }

      if (executionResult.success) {
        console.log('✓ 任务执行成功');

        // 生成最终报告
        const finalReport = this.generateFinalReport(
          sessionId,
          intentResult,
          executionResult,
          startTime
        );

        console.log(`\n${'='.repeat(70)}`);
        console.log(`📊 执行完成报告`);
        console.log(`${'─'.repeat(70)}`);
        console.log(`  总耗时: ${finalReport.duration}秒`);
        console.log(`  执行阶段: ${finalReport.phases}个`);
        console.log(`  使用技能: ${finalReport.skillsUsed.join(', ') || '通用LLM'}`);
        console.log(`  质量评分: ${finalReport.qualityScore}`);
        console.log(`${'='.repeat(70)}\n`);

        return {
          success: true,
          sessionId,
          content: executionResult.content,
          report: finalReport,
          taskPlan,
          intent: intentResult
        };
      } else {
        console.log('✗ 任务执行失败');
        return {
          success: false,
          error: executionResult.error,
          sessionId,
          partialResults: executionResult.partialResults
        };
      }

    } catch (error) {
      console.error(`\n❌ 执行失败: ${error.message}`);
      console.error(error.stack);
      return {
        success: false,
        error: error.message,
        sessionId
      };
    }
  }

  /**
   * 意图分析 - 使用MegaAnalyzer
   */
  async analyzeIntent(userInput, context = {}) {
    // 使用MegaAnalyzer进行三层扫描
    const megaResult = this.megaAnalyzer.analyze(userInput, context);

    if (megaResult.success) {
      return {
        success: true,
        category: megaResult.category,
        confidence: megaResult.confidence,
        description: megaResult.description,
        requiredSkills: megaResult.requiredSkills || [],
        skillChain: megaResult.skillChain,
        transparency: megaResult.transparency,
        scanResult: megaResult.scanResult
      };
    }

    // 回退到基础IntentAnalyzer
    const basicResult = this.intentAnalyzer.analyze(userInput);
    return {
      success: basicResult.success,
      category: basicResult.category,
      confidence: basicResult.confidence,
      description: basicResult.description,
      requiredSkills: basicResult.requiredSkills || []
    };
  }

  /**
   * 构建技能链
   */
  buildSkillChain(intentResult) {
    // 如果意图分析已经提供了技能链，直接使用
    if (intentResult.skillChain) {
      return intentResult.skillChain;
    }

    // 根据任务类型构建默认技能链
    const category = intentResult.category;
    return this.getDefaultSkillChain(category);
  }

  /**
   * 获取默认技能链 - 110种任务完整配置
   * 按四层优先级: TIER_1(需求分析) -> TIER_2(核心创建) -> TIER_3(质量提升) -> TIER_4(输出交付)
   */
  getDefaultSkillChain(category) {
    const defaultChains = {
      // ==================== 创意写作类 (12种) ====================
      creative_writing_novel: {
        name: '长篇小说创作',
        phases: [
          { name: '需求分析', tier: 'TIER_1', skills: ['requirement_analysis', 'theme_extraction', 'target_audience'], qualityGate: { checks: ['clarity', 'completeness'], threshold: 0.8 } },
          { name: '世界观构建', tier: 'TIER_1', skills: ['world_building', 'magic_system', 'social_structure'], qualityGate: { checks: ['consistency', 'detail'], threshold: 0.8 } },
          { name: '角色设计', tier: 'TIER_1', skills: ['character_design', 'character_arc', 'relationship_map'], qualityGate: { checks: ['motivation', 'consistency'], threshold: 0.85 } },
          { name: '大纲规划', tier: 'TIER_1', skills: ['outline_creation', 'three_act_structure', 'chapter_planning'], qualityGate: { checks: ['structure', 'pacing'], threshold: 0.8 } },
          { name: '金手指设计', tier: 'TIER_1', skills: ['golden_finger_design', 'power_system', 'progression_system'], qualityGate: { checks: ['balance', 'originality'], threshold: 0.75 } },
          { name: '章节写作', tier: 'TIER_2', skills: ['chapter_writing', 'plot_development', 'scene_description'], qualityGate: { checks: ['content', 'pacing'], threshold: 0.75 } },
          { name: '对话创作', tier: 'TIER_2', skills: ['dialogue_creation', 'character_voice', 'subtext'], qualityGate: { checks: ['voice', 'natural'], threshold: 0.8 } },
          { name: '情节发展', tier: 'TIER_2', skills: ['plot_development', 'conflict_creation', 'tension_build'], qualityGate: { checks: ['logic', 'engagement'], threshold: 0.8 } },
          { name: '逻辑审查', tier: 'TIER_3', skills: ['logic_review', 'plot_hole_check', 'timeline_audit'], qualityGate: { checks: ['consistency'], threshold: 0.85 } },
          { name: '去AI感', tier: 'TIER_3', skills: ['ai_tone_removal', 'human_like_writing', 'variation'], qualityGate: { checks: ['ai_detection'], threshold: 0.85 } },
          { name: '内容润色', tier: 'TIER_3', skills: ['content_polishing', 'style_transfer', 'flow_improve'], qualityGate: { checks: ['fluency', 'style'], threshold: 0.85 } },
          { name: '三路审阅', tier: 'TIER_3', skills: ['three_way_review', 'content_review', 'proofreading'], qualityGate: { checks: ['quality'], threshold: 0.9 } },
          { name: '格式排版', tier: 'TIER_4', skills: ['formatting', 'chapter_format', 'typo_fix'], qualityGate: { checks: ['format_standard', 'typo'], threshold: 0.9 } },
          { name: '最终质检', tier: 'TIER_4', skills: ['final_review', 'quality_check', 'export'], qualityGate: { checks: ['completeness'], threshold: 0.95 } }
        ]
      },

      creative_writing_article: {
        name: '文章创作',
        phases: [
          { name: '主题分析', tier: 'TIER_1', skills: ['topic_analysis', 'audience_analysis'], qualityGate: { checks: ['clarity'], threshold: 0.8 } },
          { name: '大纲构建', tier: 'TIER_1', skills: ['outline_creation', 'structure_design'], qualityGate: { checks: ['structure'], threshold: 0.8 } },
          { name: '引言写作', tier: 'TIER_2', skills: ['hook_writing', 'intro_create'], qualityGate: { checks: ['engagement'], threshold: 0.8 } },
          { name: '内容撰写', tier: 'TIER_2', skills: ['content_writing', 'argument_develop'], qualityGate: { checks: ['completeness'], threshold: 0.75 } },
          { name: '论证完善', tier: 'TIER_2', skills: ['evidence_add', 'argument_strengthen'], qualityGate: { checks: ['logic'], threshold: 0.8 } },
          { name: '编辑润色', tier: 'TIER_3', skills: ['editing', 'polishing', 'tone_match'], qualityGate: { checks: ['style', 'flow'], threshold: 0.85 } },
          { name: '校对审核', tier: 'TIER_3', skills: ['proofreading', 'grammar_check', 'typo_fix'], qualityGate: { checks: ['accuracy'], threshold: 0.9 } },
          { name: '最终发布', tier: 'TIER_4', skills: ['format_final', 'seo_optimize', 'publish'], qualityGate: { checks: ['ready'], threshold: 0.9 } }
        ]
      },

      creative_writing_poetry: {
        name: '诗歌创作',
        phases: [
          { name: '意境确定', tier: 'TIER_1', skills: ['mood_analysis', 'theme_extraction'], qualityGate: { checks: ['clarity'], threshold: 0.8 } },
          { name: '韵律设计', tier: 'TIER_1', skills: ['rhythm_design', 'rhyme_scheme'], qualityGate: { checks: ['structure'], threshold: 0.85 } },
          { name: '意象选择', tier: 'TIER_2', skills: ['imagery_selection', 'symbol_use'], qualityGate: { checks: ['relevance'], threshold: 0.8 } },
          { name: '诗句创作', tier: 'TIER_2', skills: ['line_writing', 'metaphor_create'], qualityGate: { checks: ['creativity'], threshold: 0.8 } },
          { name: '韵脚调整', tier: 'TIER_3', skills: ['rhyme_refine', 'sound_refine'], qualityGate: { checks: ['rhythm'], threshold: 0.85 } },
          { name: '意境打磨', tier: 'TIER_3', skills: ['mood_polish', 'image_enhance'], qualityGate: { checks: ['coherence'], threshold: 0.85 } }
        ]
      },

      creative_writing_script: {
        name: '剧本创作',
        phases: [
          { name: '剧本策划', tier: 'TIER_1', skills: ['script_planning', 'genre_analysis'], qualityGate: { checks: ['clarity'], threshold: 0.8 } },
          { name: '人物设定', tier: 'TIER_1', skills: ['character_design', 'cast_creation'], qualityGate: { checks: ['depth'], threshold: 0.8 } },
          { name: '剧情大纲', tier: 'TIER_1', skills: ['plot_outline', 'act_structure'], qualityGate: { checks: ['structure'], threshold: 0.8 } },
          { name: '场景设计', tier: 'TIER_2', skills: ['scene_design', 'location_create'], qualityGate: { checks: ['detail'], threshold: 0.75 } },
          { name: '对话编写', tier: 'TIER_2', skills: ['dialogue_writing', 'subtext_add'], qualityGate: { checks: ['natural'], threshold: 0.8 } },
          { name: '情节推进', tier: 'TIER_2', skills: ['scene_transition', 'tension_build'], qualityGate: { checks: ['flow'], threshold: 0.8 } },
          { name: '剧本修改', tier: 'TIER_3', skills: ['script_revise', 'pacing_adjust'], qualityGate: { checks: ['quality'], threshold: 0.85 } },
          { name: '格式校对', tier: 'TIER_4', skills: ['script_format', 'proofread'], qualityGate: { checks: ['standard'], threshold: 0.9 } }
        ]
      },

      creative_writing_short_story: {
        name: '短篇小说',
        phases: [
          { name: '构思立意', tier: 'TIER_1', skills: ['idea_generation', 'theme_define'], qualityGate: { checks: ['clarity'], threshold: 0.8 } },
          { name: '情节设计', tier: 'TIER_1', skills: ['plot_design', 'twist_plan'], qualityGate: { checks: ['originality'], threshold: 0.8 } },
          { name: '开篇写作', tier: 'TIER_2', skills: ['opening_write', 'hook_create'], qualityGate: { checks: ['engaging'], threshold: 0.8 } },
          { name: '高潮发展', tier: 'TIER_2', skills: ['climax_develop', 'conflict_escalate'], qualityGate: { checks: ['impact'], threshold: 0.85 } },
          { name: '结局收束', tier: 'TIER_2', skills: ['ending_write', 'resolution_create'], qualityGate: { checks: ['satisfaction'], threshold: 0.85 } },
          { name: '精修润色', tier: 'TIER_3', skills: ['polish', 'word_refine'], qualityGate: { checks: ['quality'], threshold: 0.85 } }
        ]
      },

      character_design: {
        name: '角色设计',
        phases: [
          { name: '基础信息', tier: 'TIER_1', skills: ['basic_info_collect', 'appearance_define'], qualityGate: { checks: ['detail'], threshold: 0.8 } },
          { name: '性格塑造', tier: 'TIER_1', skills: ['personality_design', 'trait_define'], qualityGate: { checks: ['depth'], threshold: 0.8 } },
          { name: '背景故事', tier: 'TIER_1', skills: ['background_create', 'motivation_define'], qualityGate: { checks: ['coherence'], threshold: 0.8 } },
          { name: '关系网络', tier: 'TIER_1', skills: ['relationship_map', 'conflict_define'], qualityGate: { checks: ['complexity'], threshold: 0.75 } },
          { name: '成长弧线', tier: 'TIER_2', skills: ['arc_design', 'change_plan'], qualityGate: { checks: ['logic'], threshold: 0.8 } },
          { name: '角色完善', tier: 'TIER_3', skills: ['polish', 'consistency_check'], qualityGate: { checks: ['quality'], threshold: 0.85 } }
        ]
      },

      outline_creation: {
        name: '大纲创建',
        phases: [
          { name: '主题确定', tier: 'TIER_1', skills: ['theme_confirm', '核心idea'], qualityGate: { checks: ['clarity'], threshold: 0.85 } },
          { name: '三幕结构', tier: 'TIER_1', skills: ['three_act_structure', 'act_divide'], qualityGate: { checks: ['structure'], threshold: 0.8 } },
          { name: '章节划分', tier: 'TIER_2', skills: ['chapter_divide', 'beat_sheet'], qualityGate: { checks: ['balance'], threshold: 0.75 } },
          { name: '情节点', tier: 'TIER_2', skills: ['plot_point', 'turning_point'], qualityGate: { checks: ['impact'], threshold: 0.8 } },
          { name: '大纲完善', tier: 'TIER_3', skills: ['outline_refine', 'check_gaps'], qualityGate: { checks: ['completeness'], threshold: 0.85 } }
        ]
      },

      content_polishing: {
        name: '内容润色',
        phases: [
          { name: '语体分析', tier: 'TIER_1', skills: ['tone_analysis', 'style_identify'], qualityGate: { checks: ['accuracy'], threshold: 0.8 } },
          { name: '重写优化', tier: 'TIER_2', skills: ['rewrite', 'sentence_improve'], qualityGate: { checks: ['quality'], threshold: 0.8 } },
          { name: '风格调整', tier: 'TIER_3', skills: ['style_transfer', 'voice_match'], qualityGate: { checks: ['consistency'], threshold: 0.85 } },
          { name: '质量验证', tier: 'TIER_3', skills: ['verify', 'quality_check'], qualityGate: { checks: ['pass'], threshold: 0.9 } }
        ]
      },

      content_diagnosis: {
        name: '内容诊断',
        phases: [
          { name: '全面扫描', tier: 'TIER_1', skills: ['full_scan', 'issue_collect'], qualityGate: { checks: ['coverage'], threshold: 0.85 } },
          { name: '问题识别', tier: 'TIER_1', skills: ['problem_identify', 'issue_classify'], qualityGate: { checks: ['accuracy'], threshold: 0.8 } },
          { name: '修复建议', tier: 'TIER_2', skills: ['suggest_fix', 'priority_ranking'], qualityGate: { checks: ['actionable'], threshold: 0.8 } }
        ]
      },

      world_building: {
        name: '世界观构建',
        phases: [
          { name: '世界观设定', tier: 'TIER_1', skills: ['world_base', 'concept_define'], qualityGate: { checks: ['clarity'], threshold: 0.8 } },
          { name: '规则体系', tier: 'TIER_1', skills: ['rule_system', 'magic_define'], qualityGate: { checks: ['consistency'], threshold: 0.85 } },
          { name: '社会结构', tier: 'TIER_1', skills: ['social_structure', 'culture_create'], qualityGate: { checks: ['depth'], threshold: 0.8 } },
          { name: '地理环境', tier: 'TIER_2', skills: ['geography_design', 'map_create'], qualityGate: { checks: ['detail'], threshold: 0.75 } },
          { name: '历史设定', tier: 'TIER_2', skills: ['history_create', 'timeline_define'], qualityGate: { checks: ['coherence'], threshold: 0.8 } },
          { name: '世界完善', tier: 'TIER_3', skills: ['refine', 'consistency_check'], qualityGate: { checks: ['quality'], threshold: 0.85 } }
        ]
      },

      // ==================== 商业写作类 (10种) ====================
      business_plan: {
        name: '商业计划书',
        phases: [
          { name: '执行摘要', tier: 'TIER_1', skills: ['exec_summary', 'vision_define'], qualityGate: { checks: ['clarity'], threshold: 0.85 } },
          { name: '市场分析', tier: 'TIER_1', skills: ['market_research', 'competitor_analysis'], qualityGate: { checks: ['data'], threshold: 0.8 } },
          { name: '商业模式', tier: 'TIER_2', skills: ['business_model', 'revenue_model'], qualityGate: { checks: ['viability'], threshold: 0.85 } },
          { name: '产品服务', tier: 'TIER_2', skills: ['product_describe', 'value_proposition'], qualityGate: { checks: ['clarity'], threshold: 0.8 } },
          { name: '运营计划', tier: 'TIER_2', skills: ['operation_plan', 'milestone_set'], qualityGate: { checks: ['feasibility'], threshold: 0.8 } },
          { name: '财务规划', tier: 'TIER_2', skills: ['financial_projection', 'budget_plan'], qualityGate: { checks: ['accuracy'], threshold: 0.8 } },
          { name: '团队介绍', tier: 'TIER_3', skills: ['team_intro', 'advisor_list'], qualityGate: { checks: ['professional'], threshold: 0.8 } },
          { name: '风险分析', tier: 'TIER_3', skills: ['risk_identify', 'mitigation_plan'], qualityGate: { checks: ['comprehensive'], threshold: 0.8 } },
          { name: '格式完善', tier: 'TIER_4', skills: ['format_final', 'proofread'], qualityGate: { checks: ['standard'], threshold: 0.9 } }
        ]
      },

      marketing_plan: {
        name: '营销策划',
        phases: [
          { name: '市场分析', tier: 'TIER_1', skills: ['market_analysis', 'customer_persona'], qualityGate: { checks: ['depth'], threshold: 0.8 } },
          { name: '目标定位', tier: 'TIER_1', skills: ['target_define', 'positioning'], qualityGate: { checks: ['clarity'], threshold: 0.8 } },
          { name: '策略制定', tier: 'TIER_2', skills: ['channel_strategy', 'content_strategy'], qualityGate: { checks: ['coherence'], threshold: 0.8 } },
          { name: '预算规划', tier: 'TIER_2', skills: ['budget_plan', 'roi_projection'], qualityGate: { checks: ['feasibility'], threshold: 0.75 } },
          { name: '执行方案', tier: 'TIER_3', skills: ['campaign_design', 'timeline_plan'], qualityGate: { checks: ['detail'], threshold: 0.8 } },
          { name: '效果评估', tier: 'TIER_4', skills: ['kpi_define', 'measurement_plan'], qualityGate: { checks: ['measurable'], threshold: 0.85 } }
        ]
      },

      // ==================== 学术写作类 (5种) ====================
      research_academic: {
        name: '学术研究',
        phases: [
          { name: '选题确定', tier: 'TIER_1', skills: ['topic_select', 'research_question'], qualityGate: { checks: ['relevance'], threshold: 0.8 } },
          { name: '文献检索', tier: 'TIER_1', skills: ['literature_search', 'source_collect'], qualityGate: { checks: ['coverage'], threshold: 0.8 } },
          { name: '文献综述', tier: 'TIER_1', skills: ['literature_review', 'gap_identify'], qualityGate: { checks: ['analysis'], threshold: 0.85 } },
          { name: '研究方法', tier: 'TIER_2', skills: ['methodology', 'data_collection'], qualityGate: { checks: ['rigor'], threshold: 0.85 } },
          { name: '分析研究', tier: 'TIER_2', skills: ['data_analysis', 'findings_interpret'], qualityGate: { checks: ['validity'], threshold: 0.85 } },
          { name: '论文撰写', tier: 'TIER_2', skills: ['paper_writing', 'argument_build'], qualityGate: { checks: ['coherence'], threshold: 0.8 } },
          { name: '润色校对', tier: 'TIER_3', skills: ['language_polish', 'citation_check'], qualityGate: { checks: ['standard'], threshold: 0.9 } }
        ]
      },

      thesis_writing: {
        name: '论文写作',
        phases: [
          { name: '论文结构', tier: 'TIER_1', skills: ['structure_design', 'chapter_outline'], qualityGate: { checks: ['logic'], threshold: 0.85 } },
          { name: '摘要撰写', tier: 'TIER_2', skills: ['abstract_write', 'summary_create'], qualityGate: { checks: ['conciseness'], threshold: 0.85 } },
          { name: '正文撰写', tier: 'TIER_2', skills: ['chapter_write', 'argument_present'], qualityGate: { checks: ['depth'], threshold: 0.8 } },
          { name: '引用规范', tier: 'TIER_3', skills: ['citation_format', 'reference_manage'], qualityGate: { checks: ['accuracy'], threshold: 0.9 } },
          { name: '格式调整', tier: 'TIER_4', skills: ['format_check', 'submission_ready'], qualityGate: { checks: ['compliance'], threshold: 0.95 } }
        ]
      },

      // ==================== 技术开发类 (10种) ====================
      code_python: {
        name: 'Python开发',
        phases: [
          { name: '需求理解', tier: 'TIER_1', skills: ['requirement_understand', 'scope_define'], qualityGate: { checks: ['clarity'], threshold: 0.85 } },
          { name: '架构设计', tier: 'TIER_1', skills: ['architecture_design', 'module_split'], qualityGate: { checks: ['clean'], threshold: 0.8 } },
          { name: '编码实现', tier: 'TIER_2', skills: ['code_generate', 'best_practice'], qualityGate: { checks: ['quality'], threshold: 0.8 } },
          { name: '单元测试', tier: 'TIER_3', skills: ['unit_test', 'test_coverage'], qualityGate: { checks: ['coverage'], threshold: 0.85 } },
          { name: '代码审查', tier: 'TIER_3', skills: ['code_review', 'refactor'], qualityGate: { checks: ['quality'], threshold: 0.85 } },
          { name: '文档编写', tier: 'TIER_4', skills: ['doc_write', 'readme_create'], qualityGate: { checks: ['completeness'], threshold: 0.8 } }
        ]
      },

      code_javascript: {
        name: 'JavaScript开发',
        phases: [
          { name: '需求分析', tier: 'TIER_1', skills: ['req_analysis', 'tech_stack'], qualityGate: { checks: ['clarity'], threshold: 0.8 } },
          { name: '技术选型', tier: 'TIER_1', skills: ['framework_select', 'library_choose'], qualityGate: { checks: ['suitability'], threshold: 0.8 } },
          { name: '前端实现', tier: 'TIER_2', skills: ['component_build', 'api_integrate'], qualityGate: { checks: ['quality'], threshold: 0.8 } },
          { name: '后端实现', tier: 'TIER_2', skills: ['backend_code', 'db_design'], qualityGate: { checks: ['function'], threshold: 0.8 } },
          { name: '性能优化', tier: 'TIER_3', skills: ['performance_tune', 'bundle_optimize'], qualityGate: { checks: ['improvement'], threshold: 0.8 } },
          { name: '测试部署', tier: 'TIER_4', skills: ['test_final', 'deploy'], qualityGate: { checks: ['success'], threshold: 0.9 } }
        ]
      },

      code_java: {
        name: 'Java开发',
        phases: [
          { name: '需求分析', tier: 'TIER_1', skills: ['req_analysis', 'oo_design'], qualityGate: { checks: ['clarity'], threshold: 0.8 } },
          { name: '系统设计', tier: 'TIER_1', skills: ['system_design', 'db_schema'], qualityGate: { checks: ['scalability'], threshold: 0.8 } },
          { name: '编码实现', tier: 'TIER_2', skills: ['java_code', 'spring_code'], qualityGate: { checks: ['standard'], threshold: 0.8 } },
          { name: '测试验证', tier: 'TIER_3', skills: ['junit_test', 'integration_test'], qualityGate: { checks: ['pass'], threshold: 0.85 } },
          { name: '部署发布', tier: 'TIER_4', skills: ['dockerize', 'ci_cd'], qualityGate: { checks: ['automation'], threshold: 0.85 } }
        ]
      },

      database_design: {
        name: '数据库设计',
        phases: [
          { name: '需求分析', tier: 'TIER_1', skills: ['data_requirement', 'entity_define'], qualityGate: { checks: ['clarity'], threshold: 0.85 } },
          { name: '概念设计', tier: 'TIER_1', skills: ['erd_design', 'relationship_map'], qualityGate: { checks: ['completeness'], threshold: 0.85 } },
          { name: '逻辑设计', tier: 'TIER_2', skills: ['table_design', 'index_plan'], qualityGate: { checks: ['normalized'], threshold: 0.85 } },
          { name: '性能优化', tier: 'TIER_3', skills: ['query_optimize', 'index_tune'], qualityGate: { checks: ['performance'], threshold: 0.8 } }
        ]
      },

      // ==================== 数据分析类 (8种) ====================
      data_analysis_basic: {
        name: '数据分析',
        phases: [
          { name: '数据加载', tier: 'TIER_1', skills: ['data_load', 'data_explore'], qualityGate: { checks: ['access'], threshold: 0.9 } },
          { name: '数据清洗', tier: 'TIER_1', skills: ['data_clean', 'missing_handle'], qualityGate: { checks: ['quality'], threshold: 0.85 } },
          { name: '数据处理', tier: 'TIER_2', skills: ['data_transform', 'feature_engineer'], qualityGate: { checks: ['ready'], threshold: 0.8 } },
          { name: '分析建模', tier: 'TIER_2', skills: ['statistical_analysis', 'model_build'], qualityGate: { checks: ['valid'], threshold: 0.8 } },
          { name: '可视化', tier: 'TIER_3', skills: ['chart_create', 'dashboard_build'], qualityGate: { checks: ['clear'], threshold: 0.8 } },
          { name: '报告撰写', tier: 'TIER_4', skills: ['report_write', 'insight_summarize'], qualityGate: { checks: ['actionable'], threshold: 0.85 } }
        ]
      },

      chart_generation: {
        name: '图表生成',
        phases: [
          { name: '数据准备', tier: 'TIER_1', skills: ['data_prepare', 'clean'], qualityGate: { checks: ['ready'], threshold: 0.9 } },
          { name: '图表选型', tier: 'TIER_1', skills: ['chart_type_select', 'axis_define'], qualityGate: { checks: ['suitable'], threshold: 0.85 } },
          { name: '图表绘制', tier: 'TIER_2', skills: ['chart_draw', 'style_apply'], qualityGate: { checks: ['clear'], threshold: 0.8 } },
          { name: '美化优化', tier: 'TIER_3', skills: ['chart_polish', 'label_add'], qualityGate: { checks: ['readable'], threshold: 0.85 } }
        ]
      },

      // ==================== 生活服务类 (15种) ====================
      travel_plan: {
        name: '旅行规划',
        phases: [
          { name: '目的地分析', tier: 'TIER_1', skills: ['destination_research', 'season_check'], qualityGate: { checks: ['info'], threshold: 0.8 } },
          { name: '行程规划', tier: 'TIER_1', skills: ['route_plan', 'day_schedule'], qualityGate: { checks: ['feasible'], threshold: 0.8 } },
          { name: '预算制定', tier: 'TIER_2', skills: ['budget_calculate', 'cost_estimate'], qualityGate: { checks: ['accurate'], threshold: 0.8 } },
          { name: '住宿预订', tier: 'TIER_2', skills: ['hotel_research', 'booking_suggest'], qualityGate: { checks: ['value'], threshold: 0.75 } },
          { name: '美食攻略', tier: 'TIER_2', skills: ['food_research', 'restaurant_list'], qualityGate: { checks: ['relevance'], threshold: 0.75 } },
          { name: '行程优化', tier: 'TIER_3', skills: ['optimize_route', 'time_manage'], qualityGate: { checks: ['efficiency'], threshold: 0.8 } },
          { name: '清单整理', tier: 'TIER_4', skills: ['checklist_create', 'tips_collect'], qualityGate: { checks: ['complete'], threshold: 0.85 } }
        ]
      },

      learning_plan: {
        name: '学习规划',
        phases: [
          { name: '水平评估', tier: 'TIER_1', skills: ['level_assess', 'gap_analysis'], qualityGate: { checks: ['accurate'], threshold: 0.8 } },
          { name: '目标设定', tier: 'TIER_1', skills: ['goal_set', 'milestone_define'], qualityGate: { checks: ['specific'], threshold: 0.85 } },
          { name: '计划制定', tier: 'TIER_2', skills: ['schedule_plan', 'resource_gather'], qualityGate: { checks: ['feasible'], threshold: 0.8 } },
          { name: '方法设计', tier: 'TIER_2', skills: ['method_select', 'technique_plan'], qualityGate: { checks: ['effective'], threshold: 0.8 } },
          { name: '进度跟踪', tier: 'TIER_3', skills: ['track_method', 'adjust_plan'], qualityGate: { checks: ['practical'], threshold: 0.75 } }
        ]
      },

      career_advice: {
        name: '职业建议',
        phases: [
          { name: '现状评估', tier: 'TIER_1', skills: ['situation_analyze', 'strength_evaluate'], qualityGate: { checks: ['honest'], threshold: 0.8 } },
          { name: '选项分析', tier: 'TIER_1', skills: ['option_list', 'pros_cons'], qualityGate: { checks: ['comprehensive'], threshold: 0.8 } },
          { name: '路径建议', tier: 'TIER_2', skills: ['path_suggest', 'action_plan'], qualityGate: { checks: ['practical'], threshold: 0.8 } },
          { name: '简历优化', tier: 'TIER_2', skills: ['resume_polish', 'keyword_optimize'], qualityGate: { checks: ['impactful'], threshold: 0.85 } },
          { name: '面试准备', tier: 'TIER_3', skills: ['interview_prep', 'mock_qa'], qualityGate: { checks: ['ready'], threshold: 0.8 } }
        ]
      },

      fitness_plan: {
        name: '健身计划',
        phases: [
          { name: '身体评估', tier: 'TIER_1', skills: ['body_assess', 'goal_define'], qualityGate: { checks: ['accurate'], threshold: 0.8 } },
          { name: '计划设计', tier: 'TIER_1', skills: ['workout_design', 'progression_plan'], qualityGate: { checks: ['balanced'], threshold: 0.8 } },
          { name: '饮食指导', tier: 'TIER_2', skills: ['nutrition_plan', 'meal_suggest'], qualityGate: { checks: ['sustainable'], threshold: 0.75 } },
          { name: '动作指导', tier: 'TIER_2', skills: ['exercise_demo', 'form_check'], qualityGate: { checks: ['safe'], threshold: 0.85 } },
          { name: '计划调整', tier: 'TIER_3', skills: ['track_progress', 'adapt_plan'], qualityGate: { checks: ['effective'], threshold: 0.8 } }
        ]
      },

      diet_plan: {
        name: '饮食计划',
        phases: [
          { name: '营养评估', tier: 'TIER_1', skills: ['diet_analyze', 'calorie_calc'], qualityGate: { checks: ['accurate'], threshold: 0.85 } },
          { name: '目标设定', tier: 'TIER_1', skills: ['nutrition_goal', 'macro_target'], qualityGate: { checks: ['realistic'], threshold: 0.8 } },
          { name: '菜单设计', tier: 'TIER_2', skills: ['meal_plan', 'recipe_collect'], qualityGate: { checks: ['balanced'], threshold: 0.8 } },
          { name: '食材清单', tier: 'TIER_2', skills: ['shopping_list', 'prep_guide'], qualityGate: { checks: ['practical'], threshold: 0.75 } }
        ]
      },

      interior_design: {
        name: '室内设计',
        phases: [
          { name: '需求分析', tier: 'TIER_1', skills: ['need_analyze', 'style_define'], qualityGate: { checks: ['clear'], threshold: 0.8 } },
          { name: '空间规划', tier: 'TIER_1', skills: ['layout_plan', 'flow_design'], qualityGate: { checks: ['functional'], threshold: 0.8 } },
          { name: '色彩搭配', tier: 'TIER_2', skills: ['color_scheme', 'mood_board'], qualityGate: { checks: ['harmonious'], threshold: 0.8 } },
          { name: '家具选型', tier: 'TIER_2', skills: ['furniture_select', 'placement_plan'], qualityGate: { checks: ['coordinated'], threshold: 0.75 } },
          { name: '方案完善', tier: 'TIER_3', skills: ['detail_refine', 'budget_optimize'], qualityGate: { checks: ['complete'], threshold: 0.8 } }
        ]
      },

      // ==================== 内容营销类 (8种) ====================
      seo_optimization: {
        name: 'SEO优化',
        phases: [
          { name: '关键词分析', tier: 'TIER_1', skills: ['keyword_research', 'competitor_kw'], qualityGate: { checks: ['relevant'], threshold: 0.85 } },
          { name: '网站诊断', tier: 'TIER_1', skills: ['site_audit', 'issue_identify'], qualityGate: { checks: ['thorough'], threshold: 0.8 } },
          { name: '内容优化', tier: 'TIER_2', skills: ['content_optimize', 'meta_optimize'], qualityGate: { checks: ['effective'], threshold: 0.8 } },
          { name: '外链建设', tier: 'TIER_2', skills: ['link_build', 'outreach_plan'], qualityGate: { checks: ['quality'], threshold: 0.75 } },
          { name: '效果监测', tier: 'TIER_3', skills: ['ranking_track', 'traffic_analyze'], qualityGate: { checks: ['continuous'], threshold: 0.8 } }
        ]
      },

      social_media: {
        name: '社交媒体运营',
        phases: [
          { name: '账号定位', tier: 'TIER_1', skills: ['account_position', 'target_define'], qualityGate: { checks: ['clear'], threshold: 0.8 } },
          { name: '内容策划', tier: 'TIER_1', skills: ['content_plan', 'calendar_create'], qualityGate: { checks: ['consistent'], threshold: 0.8 } },
          { name: '内容创作', tier: 'TIER_2', skills: ['post_create', 'visual_design'], qualityGate: { checks: ['engaging'], threshold: 0.8 } },
          { name: '互动运营', tier: 'TIER_2', skills: ['engagement_manage', 'community_build'], qualityGate: { checks: ['responsive'], threshold: 0.75 } },
          { name: '数据分析', tier: 'TIER_3', skills: ['metrics_analyze', 'strategy_adjust'], qualityGate: { checks: ['insightful'], threshold: 0.8 } }
        ]
      },

      // ==================== 媒体制作类 (8种) ====================
      image_generation_art: {
        name: '图片生成',
        phases: [
          { name: '需求理解', tier: 'TIER_1', skills: ['prompt_analysis', 'style_understand'], qualityGate: { checks: ['clear'], threshold: 0.8 } },
          { name: '提示词优化', tier: 'TIER_1', skills: ['prompt_refine', 'keyword_enhance'], qualityGate: { checks: ['effective'], threshold: 0.8 } },
          { name: '图像生成', tier: 'TIER_2', skills: ['image_generate', 'variation_create'], qualityGate: { checks: ['quality'], threshold: 0.75 } },
          { name: '后期处理', tier: 'TIER_3', skills: ['image_edit', 'enhance'], qualityGate: { checks: ['polished'], threshold: 0.8 } }
        ]
      },

      video_editing: {
        name: '视频剪辑',
        phases: [
          { name: '素材分析', tier: 'TIER_1', skills: ['footage_review', 'highlight_pick'], qualityGate: { checks: ['coverage'], threshold: 0.8 } },
          { name: '剪辑规划', tier: 'TIER_1', skills: ['cut_plan', 'storyboard'], qualityGate: { checks: ['coherent'], threshold: 0.8 } },
          { name: '粗剪', tier: 'TIER_2', skills: ['rough_cut', 'pace_set'], qualityGate: { checks: ['flow'], threshold: 0.75 } },
          { name: '精剪', tier: 'TIER_2', skills: ['fine_cut', 'trim'], qualityGate: { checks: ['polished'], threshold: 0.8 } },
          { name: '特效添加', tier: 'TIER_3', skills: ['effects_add', 'transition_style'], qualityGate: { checks: ['enhance'], threshold: 0.75 } },
          { name: '音频处理', tier: 'TIER_3', skills: ['audio_mix', 'music_select'], qualityGate: { checks: ['quality'], threshold: 0.8 } },
          { name: '导出发布', tier: 'TIER_4', skills: ['export_settings', 'platform_optimize'], qualityGate: { checks: ['ready'], threshold: 0.85 } }
        ]
      },

      audio_processing: {
        name: '音频处理',
        phases: [
          { name: '音频加载', tier: 'TIER_1', skills: ['audio_load', 'format_check'], qualityGate: { checks: ['ready'], threshold: 0.9 } },
          { name: '降噪处理', tier: 'TIER_2', skills: ['noise_reduce', 'clean_audio'], qualityGate: { checks: ['improvement'], threshold: 0.8 } },
          { name: '音效增强', tier: 'TIER_2', skills: ['enhance', 'eq_adjust'], qualityGate: { checks: ['quality'], threshold: 0.8 } },
          { name: '混音导出', tier: 'TIER_3', skills: ['mix_final', 'export'], qualityGate: { checks: ['ready'], threshold: 0.85 } }
        ]
      },

      ppt_design: {
        name: 'PPT设计',
        phases: [
          { name: '内容梳理', tier: 'TIER_1', skills: ['content_structure', 'key_point_extract'], qualityGate: { checks: ['clear'], threshold: 0.8 } },
          { name: '逻辑设计', tier: 'TIER_1', skills: ['flow_design', 'slide_order'], qualityGate: { checks: ['logical'], threshold: 0.8 } },
          { name: '视觉设计', tier: 'TIER_2', skills: ['template_select', 'slide_design'], qualityGate: { checks: ['professional'], threshold: 0.8 } },
          { name: '动画设计', tier: 'TIER_3', skills: ['animation_add', 'transition_style'], qualityGate: { checks: ['enhance'], threshold: 0.75 } },
          { name: '细节打磨', tier: 'TIER_4', skills: ['polish', 'final_check'], qualityGate: { checks: ['perfect'], threshold: 0.9 } }
        ]
      },

      // ==================== 专业服务类 (10种) ====================
      translation_zh_en: {
        name: '翻译服务',
        phases: [
          { name: '原文理解', tier: 'TIER_1', skills: ['source_understand', 'context_analyze'], qualityGate: { checks: ['accuracy'], threshold: 0.9 } },
          { name: '翻译转换', tier: 'TIER_2', skills: ['translate', 'localize'], qualityGate: { checks: ['fluency'], threshold: 0.85 } },
          { name: '校对审核', tier: 'TIER_3', skills: ['proofread', 'quality_check'], qualityGate: { checks: ['accuracy'], threshold: 0.9 } },
          { name: '格式整理', tier: 'TIER_4', skills: ['format_final', 'deliver'], qualityGate: { checks: ['ready'], threshold: 0.9 } }
        ]
      },

      legal_consult: {
        name: '法律咨询',
        phases: [
          { name: '问题理解', tier: 'TIER_1', skills: ['issue_understand', 'fact_collect'], qualityGate: { checks: ['clear'], threshold: 0.85 } },
          { name: '法律分析', tier: 'TIER_2', skills: ['law_search', 'analysis_apply'], qualityGate: { checks: ['thorough'], threshold: 0.85 } },
          { name: '风险评估', tier: 'TIER_2', skills: ['risk_identify', 'severity_assess'], qualityGate: { checks: ['comprehensive'], threshold: 0.8 } },
          { name: '建议提供', tier: 'TIER_3', skills: ['advice_suggest', 'action_plan'], qualityGate: { checks: ['practical'], threshold: 0.8 } }
        ]
      },

      health_advice: {
        name: '健康咨询',
        phases: [
          { name: '症状了解', tier: 'TIER_1', skills: ['symptom_collect', 'history_ask'], qualityGate: { checks: ['thorough'], threshold: 0.85 } },
          { name: '分析评估', tier: 'TIER_2', skills: ['condition_analyze', 'risk_assess'], qualityGate: { checks: ['professional'], threshold: 0.8 } },
          { name: '建议提供', tier: 'TIER_2', skills: ['advice_give', 'lifestyle_suggest'], qualityGate: { checks: ['safe'], threshold: 0.85 } },
          { name: '提醒注意', tier: 'TIER_3', skills: ['warning_give', 'when_to_see_doc'], qualityGate: { checks: ['responsible'], threshold: 0.9 } }
        ]
      },

      // ==================== 特殊任务类 (10种) ====================
      prompt_engineering: {
        name: '提示词工程',
        phases: [
          { name: '目标分析', tier: 'TIER_1', skills: ['goal_define', 'output_specify'], qualityGate: { checks: ['clear'], threshold: 0.85 } },
          { name: '约束设计', tier: 'TIER_1', skills: ['constraint_add', 'format_specify'], qualityGate: { checks: ['complete'], threshold: 0.8 } },
          { name: '示例构造', tier: 'TIER_2', skills: ['example_create', 'few_shot_design'], qualityGate: { checks: ['effective'], threshold: 0.8 } },
          { name: '迭代优化', tier: 'TIER_3', skills: ['test_prompt', 'refine'], qualityGate: { checks: ['improved'], threshold: 0.85 } }
        ]
      },

      mind_map: {
        name: '思维导图',
        phases: [
          { name: '主题确定', tier: 'TIER_1', skills: ['topic_define', 'scope_set'], qualityGate: { checks: ['clear'], threshold: 0.85 } },
          { name: '分支设计', tier: 'TIER_1', skills: ['branch_design', 'hierarchy_build'], qualityGate: { checks: ['logical'], threshold: 0.8 } },
          { name: '内容填充', tier: 'TIER_2', skills: ['content_add', 'detail_expand'], qualityGate: { checks: ['comprehensive'], threshold: 0.8 } },
          { name: '美化调整', tier: 'TIER_3', skills: ['style_adjust', 'visual_optimize'], qualityGate: { checks: ['readable'], threshold: 0.8 } }
        ]
      },

      decision_analysis: {
        name: '决策分析',
        phases: [
          { name: '问题定义', tier: 'TIER_1', skills: ['problem_define', 'goal_clarify'], qualityGate: { checks: ['clear'], threshold: 0.85 } },
          { name: '选项列举', tier: 'TIER_1', skills: ['option_list', 'alternative_gen'], qualityGate: { checks: ['complete'], threshold: 0.8 } },
          { name: '权重评估', tier: 'TIER_2', skills: ['criteria_weight', 'score_each'], qualityGate: { checks: ['logical'], threshold: 0.8 } },
          { name: '分析总结', tier: 'TIER_3', skills: ['comparison', 'recommendation'], qualityGate: { checks: ['clear'], threshold: 0.85 } }
        ]
      },

      resume_optimization: {
        name: '简历优化',
        phases: [
          { name: '简历诊断', tier: 'TIER_1', skills: ['resume_review', 'gap_identify'], qualityGate: { checks: ['honest'], threshold: 0.8 } },
          { name: '亮点挖掘', tier: 'TIER_1', skills: ['achievement_extract', 'impact_quantify'], qualityGate: { checks: ['impactful'], threshold: 0.85 } },
          { name: '结构优化', tier: 'TIER_2', skills: ['format_optimize', 'section_reorder'], qualityGate: { checks: ['professional'], threshold: 0.85 } },
          { name: '关键词优化', tier: 'TIER_2', skills: ['keyword_add', 'ats_optimize'], qualityGate: { checks: ['match'], threshold: 0.8 } },
          { name: '最终校对', tier: 'TIER_3', skills: ['proofread', 'final_check'], qualityGate: { checks: ['perfect'], threshold: 0.95 } }
        ]
      },

      interview_prep: {
        name: '面试准备',
        phases: [
          { name: '公司研究', tier: 'TIER_1', skills: ['company_research', 'culture_understand'], qualityGate: { checks: ['thorough'], threshold: 0.8 } },
          { name: '岗位分析', tier: 'TIER_1', skills: ['job_anal', 'requirement_match'], qualityGate: { checks: ['accurate'], threshold: 0.8 } },
          { name: '问题准备', tier: 'TIER_2', skills: ['common_q_prep', 'star_method'], qualityGate: { checks: ['prepared'], threshold: 0.85 } },
          { name: '模拟练习', tier: 'TIER_3', skills: ['mock_interview', 'feedback_refine'], qualityGate: { checks: ['improved'], threshold: 0.8 } }
        ]
      },

      // ==================== 查询分析类 (8种) ====================
      weather_forecast: {
        name: '天气预报',
        phases: [
          { name: '数据获取', tier: 'TIER_1', skills: ['weather_fetch', 'api_call'], qualityGate: { checks: ['success'], threshold: 0.9 } },
          { name: '数据分析', tier: 'TIER_1', skills: ['data_parse', 'trend_analyze'], qualityGate: { checks: ['accurate'], threshold: 0.85 } },
          { name: '预报生成', tier: 'TIER_2', skills: ['forecast_create', 'detail_add'], qualityGate: { checks: ['clear'], threshold: 0.8 } },
          { name: '提醒建议', tier: 'TIER_2', skills: ['tips_add', 'activity_suggest'], qualityGate: { checks: ['useful'], threshold: 0.75 } }
        ]
      },

      

  // 医疗健康类
  medical_consult: {name: '医疗咨询', phases: [{name: '症状分析', tier: 'TIER_1', skills: ['symptom_analyze']}, {name: '方案建议', tier: 'TIER_2', skills: ['advice_generate']}, {name: '后续指导', tier: 'TIER_3', skills: ['follow_up']}]},
  health_management: {name: '健康管理', phases: [{name: '健康评估', tier: 'TIER_1', skills: ['health_evaluate']}, {name: '计划制定', tier: 'TIER_2', skills: ['plan_create']}, {name: '跟踪指导', tier: 'TIER_3', skills: ['track_progress']}]},
  fitness_coach: {name: '健身指导', phases: [{name: '体能评估', tier: 'TIER_1', skills: ['fitness_test']}, {name: '训练计划', tier: 'TIER_2', skills: ['workout_plan']}, {name: '动作指导', tier: 'TIER_3', skills: ['form_coach']}]},
  diet_planning: {name: '饮食规划', phases: [{name: '营养分析', tier: 'TIER_1', skills: ['nutrition_analyze']}, {name: '食谱制定', tier: 'TIER_2', skills: ['recipe_create']}, {name: '饮食跟踪', tier: 'TIER_3', skills: ['track_intake']}]},
  mental_health: {name: '心理健康', phases: [{name: '情绪评估', tier: 'TIER_1', skills: ['mood_assess']}, {name: '心理疏导', tier: 'TIER_2', skills: ['counseling']}, {name: '建议提供', tier: 'TIER_3', skills: ['advice_give']}]},
  medical_record: {name: '病历管理', phases: [{name: '病历整理', tier: 'TIER_1', skills: ['record_organize']}, {name: '报告生成', tier: 'TIER_2', skills: ['report_create']}, {name: '档案管理', tier: 'TIER_3', skills: ['archive_manage']}]},
  sleep_tracking: {name: '睡眠分析', phases: [{name: '睡眠记录', tier: 'TIER_1', skills: ['log_sleep']}, {name: '问题识别', tier: 'TIER_2', skills: ['identify_issues']}, {name: '改善建议', tier: 'TIER_3', skills: ['suggest_improve']}]},

  // 金融投资类
  stock_analysis: {name: '股票分析', phases: [{name: '基本面分析', tier: 'TIER_1', skills: ['fundamental_analyze']}, {name: '技术面分析', tier: 'TIER_2', skills: ['technical_analyze']}, {name: '投资建议', tier: 'TIER_3', skills: ['advice_generate']}]},
  financial_plan: {name: '理财规划', phases: [{name: '财务评估', tier: 'TIER_1', skills: ['asset_evaluate']}, {name: '规划制定', tier: 'TIER_2', skills: ['plan_create']}, {name: '执行建议', tier: 'TIER_3', skills: ['action_items']}]},
  investment_advice: {name: '投资咨询', phases: [{name: '风险评估', tier: 'TIER_1', skills: ['risk_evaluate']}, {name: '产品推荐', tier: 'TIER_2', skills: ['product_match']}, {name: '策略建议', tier: 'TIER_3', skills: ['strategy_suggest']}]},
  tax_planning: {name: '税务规划', phases: [{name: '税务分析', tier: 'TIER_1', skills: ['tax_analyze']}, {name: '方案设计', tier: 'TIER_2', skills: ['plan_design']}, {name: '申报指导', tier: 'TIER_3', skills: ['file_guide']}]},
  insurance_advice: {name: '保险咨询', phases: [{name: '需求分析', tier: 'TIER_1', skills: ['needs_analyze']}, {name: '产品对比', tier: 'TIER_2', skills: ['product_compare']}, {name: '购买建议', tier: 'TIER_3', skills: ['recommend_plan']}]},
  budget_planning: {name: '预算规划', phases: [{name: '收支分析', tier: 'TIER_1', skills: ['income_analyze']}, {name: '预算制定', tier: 'TIER_2', skills: ['budget_create']}, {name: '执行跟踪', tier: 'TIER_3', skills: ['track_spending']}]},
  debt_management: {name: '债务管理', phases: [{name: '债务梳理', tier: 'TIER_1', skills: ['debt_list']}, {name: '还款计划', tier: 'TIER_2', skills: ['repay_plan']}, {name: '优化建议', tier: 'TIER_3', skills: ['refinance_options']}]},
  retirement_planning: {name: '退休规划', phases: [{name: '需求分析', tier: 'TIER_1', skills: ['needs_estimate']}, {name: '储蓄计划', tier: 'TIER_2', skills: ['saving_plan']}, {name: '执行建议', tier: 'TIER_3', skills: ['action_steps']}]},

  // 法律咨询类  
  contract_review: {name: '合同审核', phases: [{name: '条款分析', tier: 'TIER_1', skills: ['clause_analyze']}, {name: '风险评估', tier: 'TIER_2', skills: ['risk_evaluate']}, {name: '修改建议', tier: 'TIER_3', skills: ['suggest_modify']}]},
  labor_dispute: {name: '劳动纠纷', phases: [{name: '情况了解', tier: 'TIER_1', skills: ['case_collect']}, {name: '法律分析', tier: 'TIER_2', skills: ['law_apply']}, {name: '解决建议', tier: 'TIER_3', skills: ['strategy_suggest']}]},
  intellectual_property: {name: '知识产权', phases: [{name: '类型判定', tier: 'TIER_1', skills: ['ip_type_judge']}, {name: '申请指导', tier: 'TIER_2', skills: ['process_explain']}, {name: '保护建议', tier: 'TIER_3', skills: ['protection_advice']}]},
  company_register: {name: '公司注册', phases: [{name: '类型选择', tier: 'TIER_1', skills: ['type_compare']}, {name: '流程指导', tier: 'TIER_2', skills: ['process_explain']}, {name: '后续事项', tier: 'TIER_3', skills: ['tax_register']}]},
  dispute_resolution: {name: '纠纷调解', phases: [{name: '事实梳理', tier: 'TIER_1', skills: ['fact_collect']}, {name: '利益分析', tier: 'TIER_2', skills: ['interest_analyze']}, {name: '调解方案', tier: 'TIER_3', skills: ['solution_propose']}]},

  // 教育学习类
  course_design: {name: '课程设计', phases: [{name: '需求分析', tier: 'TIER_1', skills: ['learner_analyze']}, {name: '内容规划', tier: 'TIER_2', skills: ['content_plan']}, {name: '评估设计', tier: 'TIER_3', skills: ['assessment_design']}]},
  exam_prep: {name: '考试准备', phases: [{name: '考试分析', tier: 'TIER_1', skills: ['exam_analyze']}, {name: '计划制定', tier: 'TIER_2', skills: ['study_plan']}, {name: '资源推荐', tier: 'TIER_3', skills: ['resource_recommend']}]},
  skill_training: {name: '技能培训', phases: [{name: '技能评估', tier: 'TIER_1', skills: ['skill_assess']}, {name: '培训设计', tier: 'TIER_2', skills: ['training_design']}, {name: '效果评估', tier: 'TIER_3', skills: ['evaluate_progress']}]},
  language_learning: {name: '语言学习', phases: [{name: '水平测试', tier: 'TIER_1', skills: ['level_test']}, {name: '学习规划', tier: 'TIER_2', skills: ['plan_create']}, {name: '练习指导', tier: 'TIER_3', skills: ['practice_suggest']}]},
  homework_help: {name: '作业辅导', phases: [{name: '题目分析', tier: 'TIER_1', skills: ['question_analyze']}, {name: '思路讲解', tier: 'TIER_2', skills: ['explain_thinking']}, {name: '巩固练习', tier: 'TIER_3', skills: ['similar_problems']}]},
  study_method: {name: '学习方法', phases: [{name: '学习诊断', tier: 'TIER_1', skills: ['diagnose_weakness']}, {name: '方法推荐', tier: 'TIER_2', skills: ['method_recommend']}, {name: '计划制定', tier: 'TIER_3', skills: ['plan_create']}]},
  online_course: {name: '网课学习', phases: [{name: '课程选择', tier: 'TIER_1', skills: ['course_compare']}, {name: '学习规划', tier: 'TIER_2', skills: ['schedule_create']}, {name: '效果评估', tier: 'TIER_3', skills: ['track_progress']}]},

  // IT/技术类
  bug_fix: {name: 'Bug修复', phases: [{name: '问题定位', tier: 'TIER_1', skills: ['reproduce_issue']}, {name: '修复方案', tier: 'TIER_2', skills: ['solution_design']}, {name: '验证测试', tier: 'TIER_3', skills: ['verify_fix']}]},
  api_design: {name: 'API设计', phases: [{name: '需求分析', tier: 'TIER_1', skills: ['analyze_endpoints']}, {name: '接口设计', tier: 'TIER_2', skills: ['design_restful']}, {name: '文档编写', tier: 'TIER_3', skills: ['write_doc']}]},
  tech_document: {name: '技术文档', phases: [{name: '文档规划', tier: 'TIER_1', skills: ['define_structure']}, {name: '内容编写', tier: 'TIER_2', skills: ['write_content']}, {name: '审校发布', tier: 'TIER_3', skills: ['review_doc']}]},
  system_design: {name: '系统设计', phases: [{name: '需求分析', tier: 'TIER_1', skills: ['analyze_requirements']}, {name: '架构设计', tier: 'TIER_2', skills: ['design_architecture']}, {name: '详细设计', tier: 'TIER_3', skills: ['module_design']}]},
  devops_setup: {name: 'DevOps搭建', phases: [{name: '需求分析', tier: 'TIER_1', skills: ['analyze_needs']}, {name: '环境搭建', tier: 'TIER_2', skills: ['setup_cicd']}, {name: '监控配置', tier: 'TIER_3', skills: ['setup_monitoring']}]},
  security_audit: {name: '安全审计', phases: [{name: '信息收集', tier: 'TIER_1', skills: ['gather_info']}, {name: '风险评估', tier: 'TIER_2', skills: ['assess_risk']}, {name: '修复建议', tier: 'TIER_3', skills: ['suggest_remediation']}]},
  data_engineering: {name: '数据工程', phases: [{name: '需求理解', tier: 'TIER_1', skills: ['understand_requirements']}, {name: '数据建模', tier: 'TIER_2', skills: ['data_model']}, {name: '管道开发', tier: 'TIER_3', skills: ['pipeline_build']}]},

  // 媒体创作类
  short_video: {name: '短视频制作', phases: [{name: '创意策划', tier: 'TIER_1', skills: ['idea_generate']}, {name: '拍摄剪辑', tier: 'TIER_2', skills: ['video_edit']}, {name: '发布运营', tier: 'TIER_3', skills: ['publish_platform']}]},
  podcast_produce: {name: '播客制作', phases: [{name: '主题策划', tier: 'TIER_1', skills: ['topic_select']}, {name: '内容录制', tier: 'TIER_2', skills: ['audio_record']}, {name: '发布推广', tier: 'TIER_3', skills: ['publish_podcast']}]},
  graphic_design: {name: '平面设计', phases: [{name: '需求沟通', tier: 'TIER_1', skills: ['understand_requirement']}, {name: '设计制作', tier: 'TIER_2', skills: ['design_mockup']}, {name: '输出交付', tier: 'TIER_3', skills: ['export_files']}]},
  ui_design: {name: 'UI设计', phases: [{name: '需求分析', tier: 'TIER_1', skills: ['user_research']}, {name: '界面设计', tier: 'TIER_2', skills: ['create_wireframe']}, {name: '交互完善', tier: 'TIER_3', skills: ['add_interaction']}]},
  ux_analysis: {name: '用户体验分析', phases: [{name: '用户研究', tier: 'TIER_1', skills: ['user_interview']}, {name: '问题诊断', tier: 'TIER_2', skills: ['identify_pain_points']}, {name: '优化建议', tier: 'TIER_3', skills: ['suggest_improvements']}]},
  social_media_manage: {name: '社交媒体运营', phases: [{name: '账号定位', tier: 'TIER_1', skills: ['position_define']}, {name: '内容创作', tier: 'TIER_2', skills: ['create_content']}, {name: '数据分析', tier: 'TIER_3', skills: ['track_metrics']}]},

  // 生活服务类
  house_cleaning: {name: '家政服务', phases: [{name: '需求确认', tier: 'TIER_1', skills: ['understand_needs']}, {name: '服务规划', tier: 'TIER_2', skills: ['plan_cleaning']}, {name: '服务执行', tier: 'TIER_3', skills: ['perform_cleaning']}]},
  home_repair: {name: '维修服务', phases: [{name: '问题诊断', tier: 'TIER_1', skills: ['identify_issue']}, {name: '方案制定', tier: 'TIER_2', skills: ['plan_repair']}, {name: '维修执行', tier: 'TIER_3', skills: ['perform_repair']}]},
  moving_service: {name: '搬家服务', phases: [{name: '物品评估', tier: 'TIER_1', skills: ['inventory_items']}, {name: '计划制定', tier: 'TIER_2', skills: ['create_plan']}, {name: '执行搬运', tier: 'TIER_3', skills: ['pack_items']}]},
  pet_care: {name: '宠物护理', phases: [{name: '宠物评估', tier: 'TIER_1', skills: ['assess_pet']}, {name: '护理计划', tier: 'TIER_2', skills: ['plan_care']}, {name: '服务执行', tier: 'TIER_3', skills: ['provide_care']}]},
  event_planning: {name: '活动策划', phases: [{name: '需求分析', tier: 'TIER_1', skills: ['understand_goal']}, {name: '方案设计', tier: 'TIER_2', skills: ['design_event']}, {name: '执行准备', tier: 'TIER_3', skills: ['prepare_materials']}]},
  interview_prep: {name: '面试辅导', phases: [{name: '背景分析', tier: 'TIER_1', skills: ['analyze_background']}, {name: '问题准备', tier: 'TIER_2', skills: ['prepare_questions']}, {name: '模拟面试', tier: 'TIER_3', skills: ['mock_interview']}]},
  salary_negotiate: {name: '薪资谈判', phases: [{name: '市场调研', tier: 'TIER_1', skills: ['market_research']}, {name: '策略制定', tier: 'TIER_2', skills: ['strategy_develop']}, {name: '谈判辅导', tier: 'TIER_3', skills: ['negotiation_coach']}]},
  workplace_issue: {name: '职场问题', phases: [{name: '问题诊断', tier: 'TIER_1', skills: ['diagnose_issue']}, {name: '分析原因', tier: 'TIER_2', skills: ['analyze_causes']}, {name: '解决建议', tier: 'TIER_3', skills: ['solution_suggest']}]},

  // 电商运营类
  ecom_operation: {name: '电商运营', phases: [{name: '店铺诊断', tier: 'TIER_1', skills: ['analyze_store']}, {name: '策略制定', tier: 'TIER_2', skills: ['create_strategy']}, {name: '执行优化', tier: 'TIER_3', skills: ['implement_tactics']}]},
  product_listing: {name: '商品上架', phases: [{name: '信息收集', tier: 'TIER_1', skills: ['gather_info']}, {name: '内容制作', tier: 'TIER_2', skills: ['write_description']}, {name: '上架发布', tier: 'TIER_3', skills: ['publish_listing']}]},
  customer_service: {name: '客服咨询', phases: [{name: '问题理解', tier: 'TIER_1', skills: ['understand_issue']}, {name: '方案提供', tier: 'TIER_2', skills: ['provide_solution']}, {name: '跟进反馈', tier: 'TIER_3', skills: ['follow_up']}]},
  ad_campaign: {name: '广告投放', phases: [{name: '受众分析', tier: 'TIER_1', skills: ['define_audience']}, {name: '素材准备', tier: 'TIER_2', skills: ['create_ad_copy']}, {name: '投放优化', tier: 'TIER_3', skills: ['set_bidding']}]},
  conversion_optimize: {name: '转化优化', phases: [{name: '数据分析', tier: 'TIER_1', skills: ['analyze_funnel']}, {name: '方案制定', tier: 'TIER_2', skills: ['test_hypotheses']}, {name: '迭代优化', tier: 'TIER_3', skills: ['implement_changes']}]},
  shop_brand: {name: '店铺品牌', phases: [{name: '品牌定位', tier: 'TIER_1', skills: ['brand_position']}, {name: '视觉设计', tier: 'TIER_2', skills: ['visual_design']}, {name: '品牌传播', tier: 'TIER_3', skills: ['brand_spread']}]},

  // 餐饮美食类
  recipe_develop: {name: '食谱开发', phases: [{name: '需求分析', tier: 'TIER_1', skills: ['analyze_diet']}, {name: '配方设计', tier: 'TIER_2', skills: ['create_recipe']}, {name: '测试优化', tier: 'TIER_3', skills: ['test_recipe']}]},
  restaurant_consult: {name: '餐饮咨询', phases: [{name: '市场分析', tier: 'TIER_1', skills: ['analyze_market']}, {name: '定位建议', tier: 'TIER_2', skills: ['define_position']}, {name: '运营建议', tier: 'TIER_3', skills: ['suggest_menu']}]},
  food_safety: {name: '食品安全', phases: [{name: '现状评估', tier: 'TIER_1', skills: ['inspect_kitchen']}, {name: '风险识别', tier: 'TIER_2', skills: ['identify_hazards']}, {name: '改进建议', tier: 'TIER_3', skills: ['suggest_improvements']}]},
  menu_design: {name: '菜单设计', phases: [{name: '餐厅定位', tier: 'TIER_1', skills: ['understand_position']}, {name: '菜品规划', tier: 'TIER_2', skills: ['design_dishes']}, {name: '视觉呈现', tier: 'TIER_3', skills: ['layout_menu']}]},

  // 其他服务类
  translation_service: {name: '翻译服务', phases: [{name: '原文理解', tier: 'TIER_1', skills: ['understand_source']}, {name: '翻译执行', tier: 'TIER_2', skills: ['translate_text']}, {name: '校对审校', tier: 'TIER_3', skills: ['proofread']}]},
  content_rewrite: {name: '内容改写', phases: [{name: '原文分析', tier: 'TIER_1', skills: ['analyze_original']}, {name: '改写执行', tier: 'TIER_2', skills: ['rewrite_content']}, {name: '质量检查', tier: 'TIER_3', skills: ['quality_check']}]},
  

  // 农业类
  agriculture_consult: {name: '农业咨询', phases: [{name: '种植分析', tier: 'TIER_1', skills: ['analyze_crop']}, {name: '方案建议', tier: 'TIER_2', skills: ['provide_advice']}, {name: '技术指导', tier: 'TIER_3', skills: ['tech_guide']}]},
  livestock: {name: '养殖咨询', phases: [{name: '养殖规划', tier: 'TIER_1', skills: ['plan_breed']}, {name: '饲养指导', tier: 'TIER_2', skills: ['feeding_guide']}, {name: '疾病防控', tier: 'TIER_3', skills: ['disease_control']}]},

  // 建筑装修类
  interior_design: {name: '室内设计', phases: [{name: '需求沟通', tier: 'TIER_1', skills: ['communicate_needs']}, {name: '方案设计', tier: 'TIER_2', skills: ['design_scheme']}, {name: '施工指导', tier: 'TIER_3', skills: ['construction_guide']}]},
  renovation_plan: {name: '装修规划', phases: [{name: '现状评估', tier: 'TIER_1', skills: ['assess_current']}, {name: '预算制定', tier: 'TIER_2', skills: ['make_budget']}, {name: '进度安排', tier: 'TIER_3', skills: ['schedule_work']}]},
  materials_selection: {name: '材料选择', phases: [{name: '需求分析', tier: 'TIER_1', skills: ['analyze_needs']}, {name: '产品对比', tier: 'TIER_2', skills: ['compare_products']}, {name: '购买建议', tier: 'TIER_3', skills: ['suggest_purchase']}]},
  construction_manage: {name: '工程管理', phases: [{name: '进度计划', tier: 'TIER_1', skills: ['plan_schedule']}, {name: '质量监控', tier: 'TIER_2', skills: ['monitor_quality']}, {name: '验收交付', tier: 'TIER_3', skills: ['accept_deliver']}]},

  // 物流运输类
  logistics_plan: {name: '物流规划', phases: [{name: '需求分析', tier: 'TIER_1', skills: ['analyze_demand']}, {name: '方案设计', tier: 'TIER_2', skills: ['design_solution']}, {name: '执行优化', tier: 'TIER_3', skills: ['optimize_execution']}]},
  supply_chain: {name: '供应链管理', phases: [{name: '流程分析', tier: 'TIER_1', skills: ['analyze_process']}, {name: '优化建议', tier: 'TIER_2', skills: ['suggest_optimize']}, {name: '实施指导', tier: 'TIER_3', skills: ['implement_guide']}]},
  warehouse: {name: '仓储管理', phases: [{name: '库存分析', tier: 'TIER_1', skills: ['analyze_inventory']}, {name: '布局设计', tier: 'TIER_2', skills: ['design_layout']}, {name: '运营优化', tier: 'TIER_3', skills: ['optimize_operation']}]},
  delivery: {name: '配送优化', phases: [{name: '路线规划', tier: 'TIER_1', skills: ['plan_route']}, {name: '运力调度', tier: 'TIER_2', skills: ['dispatch']}, {name: '效率提升', tier: 'TIER_3', skills: ['improve_efficiency']}]},

  // 人力资源类
  recruitment: {name: '招聘咨询', phases: [{name: '需求确认', tier: 'TIER_1', skills: ['confirm_need']}, {name: '渠道选择', tier: 'TIER_2', skills: ['select_channel']}, {name: '面试辅导', tier: 'TIER_3', skills: ['interview_coach']}]},
  performance: {name: '绩效管理', phases: [{name: '指标设定', tier: 'TIER_1', skills: ['set_kpi']}, {name: '评估设计', tier: 'TIER_2', skills: ['design_evaluation']}, {name: '反馈辅导', tier: 'TIER_3', skills: ['provide_feedback']}]},
  training_dev: {name: '培训发展', phases: [{name: '需求诊断', tier: 'TIER_1', skills: ['diagnose_need']}, {name: '方案设计', tier: 'TIER_2', skills: ['design_program']}, {name: '效果评估', tier: 'TIER_3', skills: ['evaluate_effect']}]},
  compensation: {name: '薪酬体系', phases: [{name: '调研分析', tier: 'TIER_1', skills: ['analyze_market']}, {name: '体系设计', tier: 'TIER_2', skills: ['design_system']}, {name: '实施方案', tier: 'TIER_3', skills: ['implement_plan']}]},
  employee_relation: {name: '员工关系', phases: [{name: '问题诊断', tier: 'TIER_1', skills: ['diagnose_issue']}, {name: '方案制定', tier: 'TIER_2', skills: ['dev_solution']}, {name: '沟通处理', tier: 'TIER_3', skills: ['handle_comm']}]},

  // 销售营销类
  sales_training: {name: '销售培训', phases: [{name: '技能诊断', tier: 'TIER_1', skills: ['diagnose_skill']}, {name: '培训设计', tier: 'TIER_2', skills: ['design_training']}, {name: '实战辅导', tier: 'TIER_3', skills: ['coach_practice']}]},
  marketing_plan: {name: '营销策划', phases: [{name: '市场分析', tier: 'TIER_1', skills: ['analyze_market']}, {name: '策略制定', tier: 'TIER_2', skills: ['dev_strategy']}, {name: '执行方案', tier: 'TIER_3', skills: ['plan_execution']}]},
  brand_strategy: {name: '品牌战略', phases: [{name: '品牌定位', tier: 'TIER_1', skills: ['brand_position']}, {name: '策略规划', tier: 'TIER_2', skills: ['plan_strategy']}, {name: '执行落地', tier: 'TIER_3', skills: ['execute_plan']}]},
  crm: {name: '客户关系管理', phases: [{name: '客户分析', tier: 'TIER_1', skills: ['analyze_customer']}, {name: '策略设计', tier: 'TIER_2', skills: ['design_strategy']}, {name: '系统实施', tier: 'TIER_3', skills: ['implement_system']}]},
  sales_forecast: {name: '销售预测', phases: [{name: '数据分析', tier: 'TIER_1', skills: ['analyze_data']}, {name: '模型建立', tier: 'TIER_2', skills: ['build_model']}, {name: '预测报告', tier: 'TIER_3', skills: ['generate_report']}]},
  channel_manage: {name: '渠道管理', phases: [{name: '渠道分析', tier: 'TIER_1', skills: ['analyze_channel']}, {name: '合作策略', tier: 'TIER_2', skills: ['dev_strategy']}, {name: '运营支持', tier: 'TIER_3', skills: ['support_operation']}]},

  // 制造业类
  production_plan: {name: '生产计划', phases: [{name: '需求分析', tier: 'TIER_1', skills: ['analyze_demand']}, {name: '排程制定', tier: 'TIER_2', skills: ['create_schedule']}, {name: '执行监控', tier: 'TIER_3', skills: ['monitor_execution']}]},
  quality_control: {name: '质量管理', phases: [{name: '质量检测', tier: 'TIER_1', skills: ['check_quality']}, {name: '问题分析', tier: 'TIER_2', skills: ['analyze_issues']}, {name: '改进措施', tier: 'TIER_3', skills: ['improve_process']}]},
  process_improve: {name: '流程改进', phases: [{name: '现状分析', tier: 'TIER_1', skills: ['analyze_current']}, {name: '方案设计', tier: 'TIER_2', skills: ['design_solution']}, {name: '实施优化', tier: 'TIER_3', skills: ['implement_improve']}]},
  equipment_maint: {name: '设备维护', phases: [{name: '检查诊断', tier: 'TIER_1', skills: ['inspect_equip']}, {name: '维护计划', tier: 'TIER_2', skills: ['plan_maint']}, {name: '维修执行', tier: 'TIER_3', skills: ['perform_maint']}]},
  safety_production: {name: '安全生产', phases: [{name: '风险识别', tier: 'TIER_1', skills: ['identify_risks']}, {name: '措施制定', tier: 'TIER_2', skills: ['dev_measures']}, {name: '培训执行', tier: 'TIER_3', skills: ['train_staff']}]},

  // 项目管理类
  project_initiate: {name: '项目启动', phases: [{name: '需求确认', tier: 'TIER_1', skills: ['confirm_req']}, {name: '计划制定', tier: 'TIER_2', skills: ['dev_plan']}, {name: '团队组建', tier: 'TIER_3', skills: ['build_team']}]},
  pm_consult: {name: '项目管理咨询', phases: [{name: '现状评估', tier: 'TIER_1', skills: ['assess_status']}, {name: '方案诊断', tier: 'TIER_2', skills: ['diagnose_solution']}, {name: '改进建议', tier: 'TIER_3', skills: ['suggest_improve']}]},
  agile_coach: {name: '敏捷咨询', phases: [{name: '团队评估', tier: 'TIER_1', skills: ['eval_team']}, {name: '转型方案', tier: 'TIER_2', skills: ['dev_plan']}, {name: '落地辅导', tier: 'TIER_3', skills: ['coach_impl']}]},

  // 科学研究类
  research_method: {name: '研究方法', phases: [{name: '方法选择', tier: 'TIER_1', skills: ['select_method']}, {name: '方案设计', tier: 'TIER_2', skills: ['design_approach']}, {name: '实施指导', tier: 'TIER_3', skills: ['guide_execution']}]},
  academic_writing: {name: '学术写作', phases: [{name: '结构调整', tier: 'TIER_1', skills: ['structure_paper']}, {name: '内容写作', tier: 'TIER_2', skills: ['write_content']}, {name: '修改润色', tier: 'TIER_3', skills: ['revise_paper']}]},
  data_analysis_adv: {name: '高级数据分析', phases: [{name: '数据清洗', tier: 'TIER_1', skills: ['clean_data']}, {name: '建模分析', tier: 'TIER_2', skills: ['build_model']}, {name: '结果解读', tier: 'TIER_3', skills: ['interpret_result']}]},
  experiment_design: {name: '实验设计', phases: [{name: '假设确立', tier: 'TIER_1', skills: ['set_hypothesis']}, {name: '方案制定', tier: 'TIER_2', skills: ['dev_experiment']}, {name: '分析计划', tier: 'TIER_3', skills: ['plan_analysis']}]},

  // 环境能源类
  environmental_assess: {name: '环境影响评估', phases: [{name: '现状调查', tier: 'TIER_1', skills: ['survey_current']}, {name: '影响分析', tier: 'TIER_2', skills: ['analyze_impact']}, {name: '报告编制', tier: 'TIER_3', skills: ['write_report']}]},
  energy_consult: {name: '能源咨询', phases: [{name: '能源审计', tier: 'TIER_1', skills: ['audit_energy']}, {name: '节能方案', tier: 'TIER_2', skills: ['dev_plan']}, {name: '实施指导', tier: 'TIER_3', skills: ['guide_impl']}]},
  
  cv_design: {name: '简历设计', phases: [{name: '信息整理', tier: 'TIER_1', skills: ['organize_info']}, {name: '设计排版', tier: 'TIER_2', skills: ['design_layout']}, {name: '内容优化', tier: 'TIER_3', skills: ['optimize_content']}]},
  job_search: {name: '求职指导', phases: [{name: '竞争力分析', tier: 'TIER_1', skills: ['analyze_strength']}, {name: '机会推荐', tier: 'TIER_2', skills: ['find_opportunities']}, {name: '申请优化', tier: 'TIER_3', skills: ['optimize_apply']}]},
  sustainability: {name: '可持续发展', phases: [{name: '评估分析', tier: 'TIER_1', skills: ['eval_sustain']}, {name: '策略规划', tier: 'TIER_2', skills: ['dev_strategy']}, {name: '行动计划', tier: 'TIER_3', skills: ['plan_action']}]},

  text_summary: {name: '文本摘要', phases: [{name: '内容理解', tier: 'TIER_1', skills: ['comprehend_text']}, {name: '要点提取', tier: 'TIER_2', skills: ['extract_key_points']}, {name: '摘要生成', tier: 'TIER_3', skills: ['generate_summary']}]},
  data_visualization: {name: '数据可视化', phases: [{name: '数据处理', tier: 'TIER_1', skills: ['process_data']}, {name: '图表设计', tier: 'TIER_2', skills: ['design_chart']}, {name: '可视化实现', tier: 'TIER_3', skills: ['implement_viz']}]},

  news_summary: {
        name: '新闻摘要',
        phases: [
          { name: '信息收集', tier: 'TIER_1', skills: ['news_fetch', 'source_collect'], qualityGate: { checks: ['comprehensive'], threshold: 0.8 } },
          { name: '筛选分类', tier: 'TIER_1', skills: ['filter_relevant', 'categorize'], qualityGate: { checks: ['accurate'], threshold: 0.8 } },
          { name: '摘要撰写', tier: 'TIER_2', skills: ['summarize_key', 'highlight'], qualityGate: { checks: ['concise'], threshold: 0.85 } },
          { name: '格式化输出', tier: 'TIER_3', skills: ['format_final', 'output'], qualityGate: { checks: ['readable'], threshold: 0.8 } }
        ]
      },

      // ==================== 通用默认任务 ====================
      default: {
        name: '通用任务处理',
        phases: [
          { name: '需求分析', tier: 'TIER_1', skills: ['input_analyze', 'intent_extract'], qualityGate: { checks: ['clarity'], threshold: 0.7 } },
          { name: '执行处理', tier: 'TIER_2', skills: ['task_execute', 'llm_generate'], qualityGate: { checks: ['complete'], threshold: 0.75 } },
          { name: '质量检查', tier: 'TIER_3', skills: ['quality_check', 'review'], qualityGate: { checks: ['acceptable'], threshold: 0.8 } },
          { name: '输出交付', tier: 'TIER_4', skills: ['format_output', 'deliver'], qualityGate: { checks: ['ready'], threshold: 0.85 } }
        ]
      }
    };

    // 匹配类别
    for (const [key, chain] of Object.entries(defaultChains)) {
      if (category.includes(key) || key.includes(category)) {
        return chain;
      }
    }

    return defaultChains.default;
  }

  /**
   * 提取所需技能
   */
  extractRequiredSkills(skillChain) {
    if (!skillChain || !skillChain.phases) return [];

    const skills = new Set();
    for (const phase of skillChain.phases) {
      if (phase.skills) {
        phase.skills.forEach(s => skills.add(s));
      }
    }
    return Array.from(skills);
  }

  /**
   * 生成执行计划（透明度报告）
   */
  generateExecutionPlan(taskPlan) {
    const skillChain = taskPlan.skillChain;
    const phases = skillChain?.phases || [];

    // 预估时间（基于阶段数，每个阶段约2-5分钟）
    const estimatedTime = phases.length * 3;

    // 质量检查点数量
    const qualityGates = phases.reduce((sum, p) => {
      return sum + (p.qualityGate?.checks?.length || 0);
    }, 0);

    // 执行顺序
    const executionOrder = phases.map((p, i) => ({
      step: i + 1,
      name: p.name,
      skills: p.skills || [],
      tier: p.tier || 'TIER_2'
    }));

    return {
      taskType: taskPlan.category,
      confidence: taskPlan.confidence,
      phaseCount: phases.length,
      estimatedTime,
      qualityGates,
      executionOrder,
      totalSkills: this.extractRequiredSkills(skillChain).length
    };
  }

  /**
   * 生成最终报告
   */
  generateFinalReport(sessionId, intentResult, executionResult, startTime) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    return {
      sessionId,
      duration: `${duration}秒`,
      taskType: intentResult.category,
      confidence: (intentResult.confidence * 100).toFixed(1) + '%',
      phases: executionResult.phases,
      skillsUsed: executionResult.skillsUsed || [],
      qualityScore: executionResult.qualitySummary?.successRate || 'N/A',
      content: executionResult.content?.substring(0, 200) + '...'
    };
  }

  /**
   * 处理通用任务
   */
  async handleGeneralTask(userInput, context) {
    console.log('使用通用处理流程');

    const taskPlan = {
      category: 'general',
      userInput,
      skillChain: this.getDefaultSkillChain('default'),
      context
    };

    const result = await this.executor.execute(taskPlan, context);

    return {
      success: result.success,
      content: result.content,
      report: this.generateFinalReport(
        `session_${Date.now()}`,
        { category: 'general', confidence: 0.5 },
        result,
        Date.now()
      )
    };
  }

  /**
   * 处理追问回复
   */
  async processClarificationReply(sessionId, userAnswers) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return { success: false, error: '会话不存在' };
    }

    // 将用户答案合并到原始输入
    const clarifiedInput = `${session.userInput}\n\n附加信息: ${userAnswers.join(' ')}`;

    // 重新处理任务
    return await this.processTask(clarifiedInput, {
      ...session.context,
      clarified: true,
      sessionId
    });
  }

  /**
   * 继续执行（用于外部调用）
   */
  async continue(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return { success: false, error: '会话不存在' };
    }

    return await this.processTask(session.userInput, {
      ...session.context,
      sessionId
    });
  }

  /**
   * 日志记录
   */
  log(type, data) {
    this.executionLog.push({
      type,
      data: typeof data === 'object' ? { ...data } : data,
      timestamp: Date.now()
    });
  }

  /**
   * 获取执行日志
   */
  getExecutionLog(sessionId) {
    return this.executionLog.filter(log =>
      !sessionId || log.data?.sessionId === sessionId
    );
  }

  /**
   * 格式化时间
   */
  formatTime() {
    return new Date().toLocaleTimeString('zh-CN', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  // ==================== 新增功能：追问机制 ====================

  /**
   * 检查模糊请求（是否需要追问）
   */
  checkAmbiguousRequest(userInput, context) {
    const lowerInput = userInput.toLowerCase();
    const keywords = this.ambiguityKeywords;

    // 检查各种模糊关键词
    const hasVague = keywords.vague.some(k => lowerInput.includes(k) || userInput.includes(k));
    const hasNeedMore = keywords.needMore.some(k => lowerInput.includes(k));
    const hasCreative = keywords.needCreative.some(k => userInput.includes(k));
    const hasVagueQty = keywords.vagueQuantity.some(k => userInput.includes(k));

    // 如果检测到模糊请求，返回需要追问
    if (hasVague || (hasNeedMore && hasVagueQty)) {
      return {
        needsClarification: true,
        questions: this.generateClarificationQuestions(userInput)
      };
    }

    // 检查是否是新会话且没有足够上下文
    const hasHistory = context.historicalContext && context.historicalContext.length > 1;
    if (!hasHistory) {
      // 首次对话，检查是否需要更多细节
      if (hasCreative && !this.containsSpecificDetails(userInput)) {
        return {
          needsClarification: true,
          questions: this.generateClarificationQuestions(userInput)
        };
      }
    }

    return { needsClarification: false, questions: [] };
  }

  /**
   * 检查输入是否包含具体细节
   */
  containsSpecificDetails(userInput) {
    const detailIndicators = [
      /\d+字/, /\d+章/, /\d+篇/, /\d+集/,
      /主题/, /关于/,
      /主角/, /角色/, /人物/,
      /风格/, /类型/, /题材/
    ];
    return detailIndicators.some(pattern => pattern.test(userInput));
  }

  /**
   * 生成追问问题
   */
  generateClarificationQuestions(userInput) {
    const questions = [];

    if (userInput.includes('写') || userInput.includes('创作') || userInput.includes('小说')) {
      questions.push('您希望创作什么类型的作品？（如玄幻、科幻、都市等）');
      questions.push('希望大约多少字/章节？');
      questions.push('有什么具体的主题或情节要求吗？');
    }
    else if (userInput.includes('计划') || userInput.includes('规划')) {
      questions.push('您的目标是什么？');
      questions.push('计划多长时间完成？');
      questions.push('有什么特定的限制或要求吗？');
    }
    else if (userInput.includes('分析') || userInput.includes('数据')) {
      questions.push('您想分析什么方面的数据？');
      questions.push('需要什么样的输出格式？');
      questions.push('有什么特别关注的指标吗？');
    }
    else if (userInput.includes('翻译')) {
      questions.push('需要翻译成什么语言？');
      questions.push('有什么特定的风格要求吗？');
    }
    else if (userInput.includes('学习') || userInput.includes('备考')) {
      questions.push('您的目标是？');
      questions.push('目前基础如何？');
      questions.push('有什么时间限制吗？');
    }
    else {
      questions.push('您具体想要什么样的结果？');
      questions.push('有什么特定的格式或风格要求吗？');
      questions.push('有什么需要注意的细节吗？');
    }

    return questions.slice(0, 3);
  }

  /**
   * 处理追问回复
   */
  async handleClarificationResponse(sessionId, answers, context) {
    console.log(`\n💬 处理追问回复`);

    const history = this.loadConversationContext(sessionId);
    const originalRequest = history.find(h => h.requiresClarification);

    if (!originalRequest) {
      return { success: false, error: '找不到原始请求' };
    }

    const clarifiedInput = `${originalRequest.content}\n\n补充信息：${answers.join('；')}`;

    console.log(`  已合并上下文，重新处理任务...`);

    this.saveConversationContext(sessionId, {
      role: 'assistant',
      content: '【追问回复】' + answers.join('；'),
      timestamp: Date.now()
    });

    return await this.processTask(clarifiedInput, {
      ...context,
      sessionId,
      clarified: true,
      originalRequest: originalRequest.content,
      clarificationAnswers: answers
    });
  }

  /**
   * 生成低置信度问题
   */
  generateLowConfidenceQuestions(intentResult) {
    const questions = [];

    if (intentResult.matchDetails && intentResult.matchDetails.length > 0) {
      questions.push(`您是指"${intentResult.matchDetails[0].category}"吗？`);
      if (intentResult.matchDetails[1]) {
        questions.push(`还是"${intentResult.matchDetails[1].category}"？`);
      }
    } else {
      questions.push('请提供更多具体信息，以便我更好地帮助您');
    }

    return questions;
  }

  // ==================== 多轮对话记忆 ====================

  /**
   * 加载对话上下文
   */
  loadConversationContext(sessionId) {
    const memory = this.conversationMemory.get(sessionId);
    if (!memory) return null;
    return memory.slice(-10);
  }

  /**
   * 保存对话上下文
   */
  saveConversationContext(sessionId, message) {
    if (!this.conversationMemory.has(sessionId)) {
      this.conversationMemory.set(sessionId, []);
    }

    const memory = this.conversationMemory.get(sessionId);
    memory.push(message);

    if (memory.length > 20) {
      memory.shift();
    }
  }

  /**
   * 清除会话记忆
   */
  clearConversationContext(sessionId) {
    this.conversationMemory.delete(sessionId);
    console.log(`✓ 已清除会话 ${sessionId} 的记忆`);
  }

  /**
   * 生成会话ID
   */
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // ==================== 自适应学习 ====================

  /**
   * 收集用户反馈
   */
  collectFeedback(sessionId, feedback) {
    if (!this.feedbackHistory.has(sessionId)) {
      this.feedbackHistory.set(sessionId, []);
    }

    const history = this.feedbackHistory.get(sessionId);
    history.push({ feedback, timestamp: Date.now() });

    if (feedback.type === 'negative') {
      this.adjustBasedOnFeedback(feedback);
    }
  }

  /**
   * 根据反馈调整系统
   */
  adjustBasedOnFeedback(feedback) {
    console.log(`📝 收到负面反馈，系统记录并将用于优化`);
  }

  // ==================== 多语言支持 ====================

  /**
   * 检测语言
   */
  detectLanguage(text) {
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    const ratio = chineseChars / text.length;

    if (ratio > 0.3) return 'zh-CN';
    if (ratio > 0.1) return 'zh-TW';
    return 'en-US';
  }

  /**
   * 翻译关键词
   */
  translateKeyword(keyword, targetLang) {
    const keywords = this.languageConfig.keywords[targetLang];
    return keywords?.[keyword] || keyword;
  }
}

// 导出单例
module.exports = new IntelligentTaskPlanner();