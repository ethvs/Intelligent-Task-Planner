/**
 * Intelligent Task Planner - 主规划器
 * 智能任务规划与执行引擎
 */

const IntentAnalyzer = require('./intent-analyzer');
const SkillMatcher = require('./skill-matcher');
const TaskExecutor = require('./executor');

class IntelligentTaskPlanner {
  constructor() {
    this.intentAnalyzer = new IntentAnalyzer();
    this.skillMatcher = new SkillMatcher();
    this.executor = new TaskExecutor();
    this.config = this.loadConfig();
  }

  loadConfig() {
    return {
      autoInstall: true,
      sources: ['clawhub', 'github'],
      requireConfirmation: false,
      maxSteps: 10,
      timeoutMinutes: 30
    };
  }

  /**
   * 处理用户任务 - 主入口
   * @param {string} userInput - 用户输入
   * @param {Object} context - 上下文信息
   * @returns {Promise<Object>} 执行结果
   */
  async processTask(userInput, context = {}) {
    console.log(`\n🤖 开始处理任务：${userInput}`);

    // 步骤 1: 意图识别
    console.log('\n📊 步骤 1: 意图识别');
    const intent = this.intentAnalyzer.analyze(userInput);
    console.log(`识别结果：${intent.category} (置信度：${intent.confidence.toFixed(2)})`);

    if (!intent.success) {
      console.log('⚠️  无法识别任务类型，使用通用处理流程');
      return await this.handleGeneralTask(userInput, context);
    }

    // 步骤 2: 技能匹配与准备
    console.log('\n🔧 步骤 2: 技能匹配');
    const skillPlan = await this.prepareSkills(intent);
    console.log(`需要技能：${skillPlan.join(', ') || '无需额外技能'}`);

    // 步骤 3: 任务分解
    console.log('\n📋 步骤 3: 任务分解');
    const steps = this.executor.decomposeTask(userInput, intent);
    console.log(`分解为 ${steps.length} 个步骤`);
    steps.forEach((step, i) => console.log(`  ${i + 1}. ${step.description}`));

    // 步骤 4: 执行任务
    console.log('\n🚀 步骤 4: 执行任务');
    const executionContext = {
      userInput,
      intent,
      steps,
      ...context
    };
    
    const result = await this.executePlan(steps, executionContext);

    // 步骤 5: 结果验证
    console.log('\n✅ 步骤 5: 结果验证');
    const verification = this.executor.verifyResult(result, { category: intent.category });
    
    return {
      success: result.success,
      intent,
      steps,
      result,
      verification
    };
  }

  /**
   * 准备所需技能
   * @param {Object} intent - 意图分析结果
   * @returns {Promise<Array>} 准备好的技能列表
   */
  async prepareSkills(intent) {
    const requiredSkills = intent.requiredSkills || [];
    const installedSkills = await this.getInstalledSkills();
    const missingSkills = requiredSkills.filter(s => !installedSkills.includes(s));

    if (missingSkills.length > 0) {
      console.log(`发现缺失技能：${missingSkills.join(', ')}`);
      
      if (this.config.autoInstall) {
        console.log('开始自动安装...');
        for (const skill of missingSkills) {
          const installed = await this.skillMatcher.installSkill(skill);
          if (installed) {
            console.log(`✓ 已安装：${skill}`);
          } else {
            console.log(`✗ 安装失败：${skill}`);
          }
        }
      } else {
        console.log('自动安装已禁用，跳过安装步骤');
      }
    }

    return requiredSkills;
  }

  /**
   * 获取已安装的技能列表
   * @returns {Promise<Array>} 技能列表
   */
  async getInstalledSkills() {
    try {
      const { execSync } = require('child_process');
      const result = execSync('clawhub list --json', { encoding: 'utf-8' });
      const skills = JSON.parse(result);
      return skills.map(s => s.name);
    } catch (error) {
      console.log('获取已安装技能列表失败，返回空列表');
      return [];
    }
  }

  /**
   * 执行计划
   * @param {Array} steps - 步骤列表
   * @param {Object} context - 上下文
   * @returns {Promise<Object>} 执行结果
   */
  async executePlan(steps, context) {
    const results = [];
    
    for (const step of steps) {
      console.log(`\n执行步骤：${step.description}`);
      const result = await this.executor.executeStep(step, context);
      results.push({ step, result });
      
      if (!result.success) {
        console.log(`步骤失败：${step.description}`);
        // 根据配置决定是否继续
        if (!this.config.continueOnError) {
          return { success: false, error: `步骤失败：${step.description}`, partialResults: results };
        }
      }
    }

    return { success: true, results };
  }

  /**
   * 处理通用任务
   */
  async handleGeneralTask(userInput, context) {
    console.log('使用通用任务处理流程');
    // 简单回显
    return {
      success: true,
      message: `已接收任务：${userInput}`,
      suggestion: '请提供更多详细信息以便更好地完成任务'
    };
  }
}

// 导出单例
module.exports = new IntelligentTaskPlanner();
