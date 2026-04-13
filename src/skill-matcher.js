/**
 * 技能匹配器 v3.0 - OpenClaw/ClawHub 增强版
 * 支持：已安装技能检查 → ClawHub 搜索 → 近似技能匹配 → OpenClaw 官方技能
 */
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

class SkillMatcher {
  constructor() {
    this.installedSkills = [];
    this.searchCache = new Map();

    // 技能相似度映射表（用于查找替代技能）
    this.skillSimilarityMap = {
      // 写作类
      'writer': ['writing', 'author', 'content', 'text', 'creative', 'claude-writer'],
      'clawrouter/writer': ['writer', 'creative-writer', 'content-writer', 'claude'],
      'openclaw/storyteller': ['storyteller', 'writer', 'creative-writer'],
      'storyteller': ['story', 'narrative', 'tale', 'fiction', 'writer'],
      'novel-writer': ['novel', 'fiction', 'story', 'book', 'writer'],
      'content-writer': ['content', 'article', 'blog', 'post', 'writer'],
      'creative-writer': ['creative', 'writer', 'story', 'content'],

      // 代码类
      'coder': ['code', 'programming', 'developer', 'dev-helper'],
      'python-coder': ['python', 'py', 'script', 'coder', 'code'],
      'code-generator': ['code', 'coder', 'programming', 'script'],
      'dev-helper': ['developer', 'code', 'coder', 'programming'],
      'js-coder': ['javascript', 'js', 'node', 'react', 'coder'],
      'code-review': ['review', 'code', 'check', 'audit'],
      'debug-helper': ['debug', 'fix', 'troubleshoot', 'repair'],

      // 分析类
      'analyzer': ['analyze', 'analysis', 'data', 'claude-analyzer'],
      'data-analyzer': ['data', 'statistics', 'chart', 'analyzer', 'claude'],
      'chart-generator': ['chart', 'graph', 'visualization', 'data'],

      // 图片类
      'imagegen': ['image', 'picture', 'draw', 'art', 'generator'],
      'image-generator': ['image', 'picture', 'generate', 'art', 'draw'],

      // 工具类
      'search': ['search', 'find', 'lookup', 'web-search'],
      'web-searcher': ['search', 'web', 'lookup', 'fetch'],
      'web-search': ['search', 'web', 'lookup'],
      'fetch': ['fetch', 'get', 'download', 'search'],
      'news-fetcher': ['news', 'fetch', 'search', 'web-search'],

      // 角色/设计类
      'character-designer': ['character', 'design', 'role', 'persona'],

      // 文件类
      'file-manager': ['file', 'folder', 'directory', 'storage'],
      'feishu-doc': ['feishu', 'lark', 'doc', 'document'],
      'feishu-create-doc': ['feishu', 'create', 'doc'],
      'feishu-update-doc': ['feishu', 'update', 'doc'],
      'feishu-fetch-doc': ['feishu', 'fetch', 'doc'],
      'feishu-task': ['feishu', 'task', 'todo'],
      'feishu-calendar-event': ['feishu', 'calendar', 'event'],
      'feishu-sheet': ['feishu', 'sheet', 'spreadsheet'],
      'feishu-bitable': ['feishu', 'bitable', 'base'],

      // 通用兜底
      'claude': ['writer', 'analyzer', 'coder', 'helper'],
      'helper': ['help', 'assist', 'support'],
      'tool': ['tool', 'utility', 'utility'],
      'utils': ['util', 'utility', 'tool'],
    };

    // OpenClaw 官方技能注册表
    this.openclawRegistry = {
      'openclaw/storyteller': { version: '1.0.0', description: '故事创作技能', category: 'creative' },
      'openclaw/analyzer': { version: '1.0.0', description: '数据分析技能', category: 'analysis' },
      'openclaw/coder': { version: '1.0.0', description: '编程辅助技能', category: 'coding' },
      'openclaw/searcher': { version: '1.0.0', description: '网络搜索技能', category: 'tool' },
      'openclaw/writer': { version: '1.0.0', description: '通用写作技能', category: 'creative' },
      'openclaw/designer': { version: '1.0.0', description: '设计辅助技能', category: 'design' },
    };

    // ClawHub 社区技能仓库
    this.clawhubRegistry = {
      'clawrouter/writer': { downloads: '10k+', rating: 4.8, category: 'creative', author: 'clawrouter' },
      'clawrouter/coder': { downloads: '5k+', rating: 4.7, category: 'coding', author: 'clawrouter' },
      'clawrouter/analyzer': { downloads: '3k+', rating: 4.6, category: 'analysis', author: 'clawrouter' },
      'clawrouter/designer': { downloads: '2k+', rating: 4.5, category: 'design', author: 'clawrouter' },
      'clawrouter/utils': { downloads: '1k+', rating: 4.4, category: 'tool', author: 'clawrouter' },
    };

    // 技能分类映射
    this.skillCategories = {
      'creative': ['writer', 'storyteller', 'content-writer', 'novel-writer', 'clawrouter/writer', 'openclaw/writer', 'openclaw/storyteller'],
      'coding': ['coder', 'python-coder', 'js-coder', 'code-generator', 'dev-helper', 'code-review', 'debug-helper', 'clawrouter/coder', 'openclaw/coder'],
      'analysis': ['analyzer', 'data-analyzer', 'chart-generator', 'clawrouter/analyzer', 'openclaw/analyzer'],
      'design': ['character-designer', 'imagegen', 'image-generator', 'clawrouter/designer', 'openclaw/designer'],
      'tool': ['search', 'web-searcher', 'web-search', 'fetch', 'news-fetcher', 'file-manager', 'clawrouter/utils', 'openclaw/searcher'],
      'document': ['feishu-doc', 'feishu-create-doc', 'feishu-update-doc', 'feishu-fetch-doc', 'feishu-task', 'feishu-calendar-event', 'feishu-sheet', 'feishu-bitable'],
    };
  }

  /**
   * 获取已安装的技能列表（从 lockfile）
   */
  async getInstalledSkills() {
    if (this.installedSkills.length > 0) {
      return this.installedSkills;
    }

    try {
      // 从 clawhub-lock.json 读取已安装的技能
      const lockfilePath = path.join(process.cwd(), 'clawhub-lock.json');
      if (fs.existsSync(lockfilePath)) {
        const lockData = JSON.parse(fs.readFileSync(lockfilePath, 'utf-8'));
        this.installedSkills = lockData.skills?.map(s => s.name) || [];
      }

      // 如果没有 lockfile，尝试用 clawhub list
      if (this.installedSkills.length === 0) {
        try {
          const result = execSync('clawhub list 2>/dev/null', {
            encoding: 'utf-8',
            stdio: ['pipe', 'pipe', 'ignore']
          });
          const lines = result.split('\n').filter(line => line.trim());
          this.installedSkills = lines
            .slice(1)
            .map(line => line.split(/\s+/).filter(Boolean)[0])
            .filter(name => name && !name.startsWith('─'));
        } catch (e) {
          // Silent fail - clawhub not available
        }
      }

      return this.installedSkills;
    } catch (error) {
      return [];
    }
  }

  /**
   * 检查技能是否已安装（支持命名空间匹配）
   */
  isSkillInstalled(skillName) {
    const installed = this.installedSkills;

    // 完全匹配
    if (installed.some(s => s === skillName)) return true;

    // 解析命名空间 (e.g., "clawrouter/writer")
    const [namespace, name] = skillName.includes('/') ? skillName.split('/') : [null, skillName];

    return installed.some(s => {
      // 完全匹配
      if (s === skillName) return true;

      // 包含匹配
      if (s.includes(skillName) || skillName.includes(s)) return true;

      // 去掉连字符后匹配
      const normalized = s.replace(/-/g, '').toLowerCase();
      const normalizedTarget = skillName.replace(/-/g, '').toLowerCase();
      if (normalized === normalizedTarget) return true;

      // 仅名称部分匹配（忽略命名空间）
      const sName = s.includes('/') ? s.split('/')[1] : s;
      if (sName === name) return true;

      return false;
    });
  }

  /**
   * 获取技能的 OpenClaw/ClawHub 元数据
   */
  getSkillMetadata(skillName) {
    // 检查 OpenClaw 官方技能
    if (this.openclawRegistry[skillName]) {
      return {
        ...this.openclawRegistry[skillName],
        source: 'openclaw',
        isOfficial: true
      };
    }

    // 检查 ClawHub 社区技能
    if (this.clawhubRegistry[skillName]) {
      return {
        ...this.clawhubRegistry[skillName],
        source: 'clawhub',
        isOfficial: false
      };
    }

    // 推测来源
    if (skillName.startsWith('openclaw/')) {
      return { source: 'openclaw', isOfficial: true, inferred: true };
    } else if (skillName.startsWith('clawrouter/')) {
      return { source: 'clawhub', isOfficial: false, inferred: true };
    }

    return { source: 'unknown', isOfficial: false };
  }

  /**
   * 按类别查找技能
   */
  findSkillsByCategory(category) {
    const skills = this.skillCategories[category] || [];
    return skills.map(name => ({
      name,
      ...this.getSkillMetadata(name)
    }));
  }

  /**
   * 从 ClawHub 搜索技能
   */
  async searchClawHub(query) {
    if (this.searchCache.has(query)) {
      return this.searchCache.get(query);
    }

    try {
      const result = execSync(`clawhub search ${query} 2>/dev/null`, {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'ignore'],
        timeout: 10000
      });

      const skills = this.parseClawHubOutput(result, query);
      this.searchCache.set(query, skills);
      return skills;
    } catch (error) {
      return [];
    }
  }

  /**
   * 解析 ClawHub 输出
   */
  parseClawHubOutput(output, query) {
    const skills = [];
    const lines = output.split('\n').filter(line => line.trim());

    for (const line of lines) {
      if (line.includes('──') || line.includes('名称') || line.trim().startsWith('○')) {
        continue;
      }

      const parts = line.split(/\s{2,}/).map(p => p.trim()).filter(Boolean);
      if (parts.length > 0) {
        const name = parts[0]?.replace(/^[●○]/, '').trim();
        const desc = parts.slice(1).join(' ').trim();

        if (name && name.length < 50) {
          skills.push({
            name,
            description: desc || '',
            source: 'clawhub',
            score: this.calculateRelevanceScore(name, query)
          });
        }
      }
    }

    return skills;
  }

  /**
   * 计算技能与查询的相关性分数
   */
  calculateRelevanceScore(skillName, query) {
    const skill = skillName.toLowerCase();
    const q = query.toLowerCase();

    // 完全匹配
    if (skill === q) return 100;

    // 包含关系
    if (skill.includes(q) || q.includes(skill)) return 80;

    // OpenClaw 官方技能加分
    if (skill.startsWith('openclaw/') && q.includes(skill.split('/')[1])) return 90;

    // 部分匹配
    const skillWords = skill.split(/[-_\s/]/);
    const queryWords = q.split(/[-_\s/]/);

    const matchCount = skillWords.filter(w =>
      queryWords.some(qw => w.includes(qw) || qw.includes(w))
    ).length;

    return Math.round((matchCount / Math.max(skillWords.length, queryWords.length)) * 60);
  }

  /**
   * 查找近似技能（增强版，支持 OpenClaw/ClawHub 分层查找）
   */
  async findSimilarSkills(requiredSkill, allSkills) {
    // 1. 首先检查 OpenClaw 官方技能
    const openclawSkill = `openclaw/${requiredSkill.replace(/-/g, '')}`;
    if (this.openclawRegistry[openclawSkill]) {
      return { name: openclawSkill, source: 'openclaw', confidence: 0.9 };
    }

    // 2. 从相似度映射查找
    const similarKeywords = this.skillSimilarityMap[requiredSkill] || [];

    // 3. 从已安装技能中找
    const installed = await this.getInstalledSkills();
    for (const installedSkill of installed) {
      for (const keyword of similarKeywords) {
        if (installedSkill.toLowerCase().includes(keyword)) {
          return { name: installedSkill, source: 'installed', confidence: 0.85 };
        }
      }
    }

    // 4. 检查 ClawHub 注册表
    for (const [name, meta] of Object.entries(this.clawhubRegistry)) {
      if (meta.category && this.getCategoryFromSkill(requiredSkill) === meta.category) {
        return { name, source: 'clawhub', ...meta, confidence: 0.75 };
      }
    }

    // 5. 从 ClawHub 搜索
    for (const keyword of similarKeywords.slice(0, 3)) {
      const results = await this.searchClawHub(keyword);
      if (results.length > 0) {
        const best = results[0];
        return { name: best.name, source: 'clawhub-search', confidence: best.score / 100 };
      }
    }

    // 6. 通用兜底
    const generalSkills = ['writer', 'helper', 'tool', 'utils', 'claude'];
    for (const general of generalSkills) {
      if (requiredSkill.includes(general)) {
        return { name: general, source: 'fallback', confidence: 0.5 };
      }
    }

    return null;
  }

  /**
   * 根据技能名称推断类别
   */
  getCategoryFromSkill(skillName) {
    const name = skillName.toLowerCase();
    for (const [category, skills] of Object.entries(this.skillCategories)) {
      if (skills.some(s => name.includes(s) || s.includes(name))) {
        return category;
      }
    }
    return 'tool';
  }

  /**
   * 主方法：准备技能（增强版）
   */
  async prepareSkills(requiredSkills) {
    const result = {
      installed: [],
      toInstall: [],
      alternatives: [],
      missing: [],
      fromOpenClaw: [],
      fromClawHub: []
    };

    // 获取已安装技能
    await this.getInstalledSkills();

    for (const skill of requiredSkills) {
      // 1. 检查是否已安装
      if (this.isSkillInstalled(skill)) {
        const metadata = this.getSkillMetadata(skill);
        result.installed.push({ name: skill, ...metadata });
        if (metadata.source === 'openclaw') result.fromOpenClaw.push(skill);
        if (metadata.source === 'clawhub') result.fromClawHub.push(skill);
        continue;
      }

      // 2. 查找 OpenClaw 官方技能
      const openclawName = skill.startsWith('openclaw/') ? skill : `openclaw/${skill}`;
      if (this.openclawRegistry[openclawName]) {
        result.toInstall.push(openclawName);
        result.fromOpenClaw.push(openclawName);
        continue;
      }

      // 3. 查找 ClawHub 社区技能
      const clawhubName = skill.startsWith('clawrouter/') ? skill : `clawrouter/${skill}`;
      if (this.clawhubRegistry[clawhubName]) {
        result.toInstall.push(clawhubName);
        result.fromClawHub.push(clawhubName);
        continue;
      }

      // 4. 查找近似技能
      const similar = await this.findSimilarSkills(skill, this.installedSkills);
      if (similar) {
        result.alternatives.push({
          original: skill,
          alternative: similar.name,
          confidence: similar.confidence,
          source: similar.source
        });
        if (!this.isSkillInstalled(similar.name)) {
          result.toInstall.push(similar.name);
        }
        continue;
      }

      // 5. 实在找不到
      result.missing.push(skill);
    }

    return result;
  }

  /**
   * 安装技能（支持 OpenClaw/ClawHub）
   */
  async installSkill(skillName) {
    try {
      // OpenClaw 技能使用 openclaw install
      if (skillName.startsWith('openclaw/')) {
        execSync(`openclaw install ${skillName}`, {
          stdio: 'inherit',
          timeout: 60000
        });
      } else {
        // ClawHub 技能使用 clawhub install
        execSync(`clawhub install ${skillName}`, {
          stdio: 'inherit',
          timeout: 60000
        });
      }
      this.installedSkills.push(skillName);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 全局调用已安装技能
   */
  async invokeInstalledSkills(skillNames, context = {}) {
    const results = [];

    for (const skillName of skillNames) {
      if (this.isSkillInstalled(skillName)) {
        const metadata = this.getSkillMetadata(skillName);
        results.push({
          skill: skillName,
          invoked: true,
          source: metadata.source,
          context
        });
      }
    }

    return results;
  }

  /**
   * 生成技能使用报告
   */
  generateSkillReport(result) {
    return {
      summary: {
        total: result.installed.length + result.toInstall.length + result.missing.length,
        installed: result.installed.length,
        toInstall: result.toInstall.length,
        fromOpenClaw: result.fromOpenClaw?.length || 0,
        fromClawHub: result.fromClawHub?.length || 0,
        alternatives: result.alternatives.length,
        missing: result.missing.length
      },
      details: result
    };
  }
}

module.exports = SkillMatcher;
