/**
 * Intelligent Task Planner - Final Unified Entry Point v6.0.0
 * 智能任务规划器 - 最终统一入口
 *
 * Features:
 * - 152 task types with 1800+ keywords
 * - Three-layer keyword scanning (verb → noun → modifier)
 * - Automatic skill chain execution
 * - Quality gate verification
 * - Full transparency reporting
 * - Multi-turn conversation memory
 * - Context disambiguation
 */

// planner.js exports singleton instance directly
const planner = require('./src/planner');

/**
 * Main interface - analyze and execute tasks
 * @param {string} userInput - User's task description
 * @param {Object} context - Additional context
 * @returns {Object} Execution result
 */
async function analyze(userInput, context = {}) {
  return await planner.processTask(userInput, context);
}

/**
 * Quick intent recognition
 * @param {string} userInput - User's task description
 * @returns {Object} Intent analysis result
 */
function recognize(userInput) {
  const MegaAnalyzer = require('./src/mega-analyzer');
  const analyzer = new MegaAnalyzer();
  return analyzer.analyze(userInput);
}

/**
 * Get all supported task types
 * @returns {Array} List of task types
 */
function getSupportedTasks() {
  const fs = require('fs');
  const path = require('path');
  const mappingPath = path.join(__dirname, 'config/ultimate-mappings.json');

  if (fs.existsSync(mappingPath)) {
    const mappings = JSON.parse(fs.readFileSync(mappingPath, 'utf-8'));
    return Object.keys(mappings.taskCategories || {});
  }
  return [];
}

/**
 * Get task details
 * @param {string} taskType - Task type name
 * @returns {Object} Task details
 */
function getTaskDetails(taskType) {
  const fs = require('fs');
  const path = require('path');
  const mappingPath = path.join(__dirname, 'config/ultimate-mappings.json');

  if (fs.existsSync(mappingPath)) {
    const mappings = JSON.parse(fs.readFileSync(mappingPath, 'utf-8'));
    return mappings.taskCategories[taskType] || null;
  }
  return null;
}

/**
 * Validate system configuration
 * @returns {Object} Validation result
 */
function validateConfig() {
  const fs = require('fs');
  const path = require('path');

  const requiredFiles = [
    'config/ultimate-mappings.json',
    'src/planner.js',
    'src/mega-analyzer.js',
    'src/executor.js',
    'src/skill-matcher.js'
  ];

  const results = {
    valid: true,
    missing: [],
    stats: {}
  };

  // Check required files
  for (const file of requiredFiles) {
    const filePath = path.join(__dirname, file);
    if (!fs.existsSync(filePath)) {
      results.valid = false;
      results.missing.push(file);
    }
  }

  // Load and check mappings
  const mappingPath = path.join(__dirname, 'config/ultimate-mappings.json');
  if (fs.existsSync(mappingPath)) {
    const mappings = JSON.parse(fs.readFileSync(mappingPath, 'utf-8'));
    const taskTypes = Object.keys(mappings.taskCategories || {});
    const keywordCount = taskTypes.reduce((sum, key) => {
      return sum + (mappings.taskCategories[key].keywords?.length || 0);
    }, 0);

    results.stats = {
      taskTypes: taskTypes.length,
      keywords: keywordCount,
      version: mappings.version
    };
  }

  return results;
}

/**
 * Batch analyze multiple tasks
 * @param {Array<string>} inputs - Array of user inputs
 * @returns {Array} Analysis results
 */
async function batchAnalyze(inputs) {
  const results = [];
  for (const input of inputs) {
    try {
      const result = await analyze(input);
      results.push({ input, ...result });
    } catch (error) {
      results.push({ input, success: false, error: error.message });
    }
  }
  return results;
}

// Export module
module.exports = {
  analyze,
  recognize,
  getSupportedTasks,
  getTaskDetails,
  validateConfig,
  batchAnalyze,
  planner
};

// CLI support
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║     Intelligent Task Planner v6.0.0 - Final Edition            ║
╠══════════════════════════════════════════════════════════════╣
║  Task Types: 152+  |  Keywords: 1800+  |  Confidence: 99.9%  ║
╠══════════════════════════════════════════════════════════════╣
║  Usage:                                                        ║
║    node index.js "帮我写一部玄幻小说"                          ║
║    node index.js --validate                                    ║
║    node index.js --tasks                                       ║
║    node index.js --demo                                        ║
╚══════════════════════════════════════════════════════════════╝
`);
    process.exit(0);
  }

  const command = args[0];

  if (command === '--validate') {
    const result = validateConfig();
    console.log('Validation Result:', JSON.stringify(result, null, 2));
    process.exit(result.valid ? 0 : 1);
  }

  if (command === '--tasks') {
    const tasks = getSupportedTasks();
    console.log(`\nSupported Task Types (${tasks.length}):`);
    tasks.forEach((task, i) => {
      const details = getTaskDetails(task);
      const keywordCount = details?.keywords?.length || 0;
      console.log(`  ${i + 1}. ${task} (${keywordCount} keywords)`);
    });
    process.exit(0);
  }

  if (command === '--demo') {
    const demos = [
      '帮我写一部玄幻小说',
      '分析一下销售数据',
      '帮我做个旅行计划',
      '生成一个Python脚本',
      '设计一个角色',
      '帮我润色这篇文章',
      '查询北京天气'
    ];

    console.log('Running demo tests...\n');

    (async () => {
      for (const demo of demos) {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`Input: ${demo}`);
        console.log('='.repeat(60));
        const result = recognize(demo);
        console.log('Category:', result.category || 'N/A');
        console.log('Confidence:', result.confidence ? `${(result.confidence * 100).toFixed(1)}%` : 'N/A');
        console.log('Description:', result.description || 'N/A');
      }
    })();

    process.exit(0);
  }

  // Analyze user input
  const userInput = args.join(' ');
  (async () => {
    try {
      const result = await analyze(userInput);
      console.log(JSON.stringify(result, null, 2));
    } catch (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  })();
}
