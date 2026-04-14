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

    // OpenClaw/ClawHub 技能注册表 - 运行时动态发现
    this.skillRegistry = new Map();
    this.clawhubRegistry = new Map();

    // 技能分类映射 - 不含命名空间前缀的通用技能名
    this.skillCategories = {
      'creative': ['writer', 'storyteller', 'content-writer', 'novel-writer'],
      'coding': ['coder', 'python-coder', 'js-coder', 'code-generator', 'dev-helper', 'code-review', 'debug-helper'],
      'analysis': ['analyzer', 'data-analyzer', 'chart-generator'],
      'design': ['character-designer', 'imagegen', 'image-generator'],
      'tool': ['search', 'web-searcher', 'web-search', 'fetch', 'news-fetcher', 'file-manager'],
      'document': ['feishu-doc', 'feishu-create-doc', 'feishu-update-doc', 'feishu-fetch-doc', 'feishu-task', 'feishu-calendar-event', 'feishu-sheet', 'feishu-bitable'],
    };
  }

  /**
   * 获取已安装的技能列表
   * 优先顺序：全局 .openclaw/skills → clawhub-lock.json → clawhub list
   */
  async getInstalledSkills() {
    if (this.installedSkills.length > 0) {
      return this.installedSkills;
    }

    const skills = new Set();

    try {
      // 1. 从全局 .openclaw/skills 目录读取
      const globalSkillsDir = path.join(process.env.HOME || process.env.USERPROFILE || '', '.openclaw', 'skills');
      if (fs.existsSync(globalSkillsDir)) {
        const entries = fs.readdirSync(globalSkillsDir, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isDirectory()) {
            // 检查是否是有效技能目录（包含 index.js 或 skill.yaml）
            const skillPath = path.join(globalSkillsDir, entry.name);
            const hasIndex = fs.existsSync(path.join(skillPath, 'index.js'));
            const hasSkillYaml = fs.existsSync(path.join(skillPath, 'skill.yaml')) ||
                                fs.existsSync(path.join(skillPath, 'skill.yml'));
            if (hasIndex || hasSkillYaml) {
              skills.add(entry.name);
            }
          }
        }
      }

      // 2. 从 clawhub-lock.json 读取
      const lockfilePath = path.join(process.cwd(), 'clawhub-lock.json');
      if (fs.existsSync(lockfilePath)) {
        const lockData = JSON.parse(fs.readFileSync(lockfilePath, 'utf-8'));
        const lockSkills = lockData.skills?.map(s => s.name) || [];
        lockSkills.forEach(s => skills.add(s));
      }

      // 3. 尝试用 clawhub list
      try {
        const result = execSync('clawhub list 2>/dev/null', {
          encoding: 'utf-8',
          stdio: ['pipe', 'pipe', 'ignore']
        });
        const lines = result.split('\n').filter(line => line.trim());
        const cliSkills = lines
          .slice(1)
          .map(line => line.split(/\s+/).filter(Boolean)[0])
          .filter(name => name && !name.startsWith('─') && !name.startsWith('NAME'));
        cliSkills.forEach(s => skills.add(s));
      } catch (e) {
        // Silent fail - clawhub not available
      }

      this.installedSkills = Array.from(skills);
      return this.installedSkills;
    } catch (error) {
      return Array.from(skills);
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
   * 获取技能的元数据
   */
  getSkillMetadata(skillName) {
    // 从已安装的技能元数据中查找
    const installedMeta = this.skillRegistry.get(skillName);
    if (installedMeta) {
      return installedMeta;
    }

    // 推测来源
    if (skillName.startsWith('openclaw/')) {
      return { source: 'openclaw', isOfficial: true, inferred: true };
    } else if (skillName.includes('/')) {
      return { source: 'clawhub', isOfficial: false, inferred: true };
    }

    return { source: 'global', isOfficial: false, inferred: true };
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
   * 返回 0-100 的分数，用于优先级排序
   */
  calculateRelevanceScore(skillName, query, category = null) {
    const skill = skillName.toLowerCase();
    const q = query.toLowerCase();
    const qCategory = category ? category.toLowerCase() : null;

    // 最佳匹配 (90-100): 完全匹配
    if (skill === q) return 100;

    // 忽略命名空间的名称匹配
    const skillBaseName = skill.includes('/') ? skill.split('/')[1] : skill;
    const queryBaseName = q.includes('/') ? q.split('/')[1] : q;
    if (skillBaseName === queryBaseName) return 98;

    // 非常高匹配 (80-89): 包含关系
    if (skillBaseName.includes(queryBaseName) || queryBaseName.includes(skillBaseName)) return 85;

    // 高匹配 (70-79): 类别匹配 + 关键词匹配
    if (qCategory) {
      const categorySkills = this.skillCategories[qCategory] || [];
      if (categorySkills.some(cs => skill.includes(cs) || cs.includes(skill))) {
        return 75;
      }
    }

    // 中等匹配 (50-69): 相似度映射表匹配
    const similarKeywords = this.skillSimilarityMap[queryBaseName] || [];
    for (const keyword of similarKeywords) {
      if (skill.includes(keyword) || keyword.includes(skill)) {
        return 60;
      }
    }

    // 部分匹配 (30-49): 词级别匹配
    const skillWords = skill.split(/[-_\s/]/);
    const queryWords = q.split(/[-_\s/]/);
    const matchCount = skillWords.filter(w =>
      queryWords.some(qw => w.includes(qw) || qw.includes(w))
    ).length;

    if (matchCount > 0) {
      return Math.round(30 + (matchCount / Math.max(skillWords.length, queryWords.length)) * 20);
    }

    // 低匹配 (0-29): 无直接关联
    return 10;
  }

  /**
   * 获取技能详细元数据（用于排序）
   */
  async getSkillDetailedMetadata(skillName) {
    const metadata = {
      name: skillName,
      source: 'unknown',
      tags: [],
      category: null,
      rating: null,
      downloads: null
    };

    // 检查是否是已安装技能
    if (this.isSkillInstalled(skillName)) {
      metadata.source = 'installed';
      metadata.installed = true;
      // 尝试读取技能的 SKILL.md 获取更多信息
      try {
        const skillPath = this.getSkillPath(skillName);
        if (skillPath) {
          const readmePath = path.join(skillPath, 'SKILL.md');
          if (fs.existsSync(readmePath)) {
            const content = fs.readFileSync(readmePath, 'utf-8');
            // 解析 YAML frontmatter
            const yamlMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
            if (yamlMatch) {
              const yaml = yamlMatch[1];
              const categoryMatch = yaml.match(/category:\s*(.+)/);
              const tagsMatch = yaml.match(/tags:\s*\n((?:\s*-\s*.+\n)*)/);
              if (categoryMatch) metadata.category = categoryMatch[1].trim();
              if (tagsMatch) {
                metadata.tags = tagsMatch[1].match(/-\s*(.+)/g)?.map(t => t.replace(/-\s*/, '')) || [];
              }
            }
          }
        }
      } catch (e) {
        // 忽略解析错误
      }
    } else {
      metadata.source = 'clawhub';
    }

    // 推断类别
    if (!metadata.category) {
      metadata.category = this.getCategoryFromSkill(skillName);
    }

    return metadata;
  }

  /**
   * 获取技能的全局安装路径
   */
  getSkillPath(skillName) {
    // 检查全局 .openclaw/skills
    const globalPath = path.join(process.env.HOME || '', '.openclaw', 'skills', skillName);
    if (fs.existsSync(globalPath)) return globalPath;

    // 检查项目本地
    const localPath = path.join(process.cwd(), 'skills', skillName);
    if (fs.existsSync(localPath)) return localPath;

    // 检查 node_modules（如果是 npm 包）
    const npmPath = path.join(process.cwd(), 'node_modules', skillName);
    if (fs.existsSync(npmPath)) return npmPath;

    return null;
  }

  /**
   * 查找近似技能（全新流程：优先已安装 → ClawHub搜索 → 兜底）
   */
  async findSimilarSkills(requiredSkill, allSkills) {
    // 1. 从已安装技能中查找匹配的技能
    const installed = await this.getInstalledSkills();
    const similarKeywords = this.skillSimilarityMap[requiredSkill] || [];
    const requiredLower = requiredSkill.toLowerCase();

    // 1.1 优先完全匹配或包含匹配
    for (const installedSkill of installed) {
      const installedLower = installedSkill.toLowerCase();
      // 完全匹配
      if (installedLower === requiredLower) {
        return { name: installedSkill, source: 'installed', confidence: 1.0 };
      }
      // 名称部分匹配（忽略命名空间）
      const sName = installedSkill.includes('/') ? installedSkill.split('/')[1] : installedSkill;
      const rName = requiredSkill.includes('/') ? requiredSkill.split('/')[1] : requiredSkill;
      if (sName.toLowerCase() === rName.toLowerCase()) {
        return { name: installedSkill, source: 'installed', confidence: 0.95 };
      }
    }

    // 1.2 关键词模糊匹配
    for (const installedSkill of installed) {
      const installedLower = installedSkill.toLowerCase();
      for (const keyword of similarKeywords) {
        if (installedLower.includes(keyword) || keyword.includes(installedLower)) {
          return { name: installedSkill, source: 'installed', confidence: 0.85 };
        }
      }
    }

    // 2. 从 ClawHub 搜索匹配的技能
    const searchTerms = [requiredSkill, ...similarKeywords.slice(0, 3)];
    for (const term of searchTerms) {
      const results = await this.searchClawHub(term);
      if (results.length > 0) {
        const best = results[0];
        if (best.score >= 60) {
          return { name: best.name, source: 'clawhub-search', confidence: best.score / 100, shouldInstall: true };
        }
      }
    }

    // 3. 通用兜底
    const generalSkills = ['writer', 'helper', 'tool', 'utils'];
    for (const general of generalSkills) {
      if (requiredLower.includes(general)) {
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
   * 主方法：准备技能（优先级：最佳匹配 → 高相关 → 近似 → 兜底）
   *
   * 流程：
   * 1. 先检查全局已安装的技能中是否有最佳匹配（匹配度 >= 0.9）
   * 2. 如未找到最佳匹配，在 ClawHub 搜索并按匹配度排序
   * 3. 安装最佳匹配技能到 ~/.openclaw/skills（全局目录）
   * 4. 从全局目录调用执行
   * 5. 如仍无最佳匹配，按优先级使用高相关/近似/兜底技能
   */
  async prepareSkills(requiredSkills) {
    const result = {
      installed: [],
      toInstall: [],
      alternatives: [],
      missing: [],
      fromGlobal: [],
      fromClawHub: []
    };

    // 获取已安装技能列表
    await this.getInstalledSkills();

    for (const skill of requiredSkills) {
      const category = this.getCategoryFromSkill(skill);

      // STEP 1: 在全局已安装技能中查找最佳匹配（匹配度 >= 0.9）
      const bestMatch = await this.findBestMatchInInstalled(skill, category);
      if (bestMatch && bestMatch.score >= 90) {
        const metadata = await this.getSkillDetailedMetadata(bestMatch.name);
        result.installed.push({
          name: bestMatch.name,
          ...metadata,
          matchScore: bestMatch.score
        });
        result.fromGlobal.push(bestMatch.name);
        continue;
      }

      // STEP 2: 在全局已安装技能中查找高相关匹配（匹配度 0.7-0.9）
      if (bestMatch && bestMatch.score >= 70) {
        result.installed.push({
          name: bestMatch.name,
          matchScore: bestMatch.score,
          source: 'installed'
        });
        result.fromGlobal.push(bestMatch.name);
        continue;
      }

      // STEP 3: 从 ClawHub 搜索最佳匹配技能
      const clawhubBestMatch = await this.searchClawHubForBest(skill, category);
      if (clawhubBestMatch && clawhubBestMatch.score >= 90) {
        // 安装到全局 ~/.openclaw/skills 目录
        const installedGlobally = await this.installSkillToGlobal(clawhubBestMatch.name);
        if (installedGlobally) {
          result.installed.push({
            name: clawhubBestMatch.name,
            matchScore: clawhubBestMatch.score,
            source: 'clawhub',
            installedGlobally: true
          });
          this.installedSkills.push(clawhubBestMatch.name);
          result.fromClawHub.push(clawhubBestMatch.name);
          continue;
        } else {
          // 安装失败，但仍然添加到待安装列表
          result.toInstall.push(clawhubBestMatch.name);
          result.fromClawHub.push(clawhubBestMatch.name);
        }
      }

      // STEP 4: ClawHub 搜索高相关匹配（匹配度 0.7-0.9）
      if (clawhubBestMatch && clawhubBestMatch.score >= 70) {
        const installedGlobally = await this.installSkillToGlobal(clawhubBestMatch.name);
        if (installedGlobally) {
          result.installed.push({
            name: clawhubBestMatch.name,
            matchScore: clawhubBestMatch.score,
            source: 'clawhub'
          });
          this.installedSkills.push(clawhubBestMatch.name);
          result.fromClawHub.push(clawhubBestMatch.name);
          continue;
        }
      }

      // STEP 5: 在已安装技能中查找近似匹配（匹配度 0.5-0.7）
      const similarInstalled = await this.findSimilarInInstalled(skill);
      if (similarInstalled && similarInstalled.score >= 50) {
        result.alternatives.push({
          original: skill,
          alternative: similarInstalled.name,
          confidence: similarInstalled.score / 100,
          source: 'installed-similar',
          note: '功能近似技能'
        });
        result.installed.push({
          name: similarInstalled.name,
          source: 'installed'
        });
        result.fromGlobal.push(similarInstalled.name);
        continue;
      }

      // STEP 6: 从 ClawHub 搜索近似匹配
      const similarClawhub = await this.searchClawHubForSimilar(skill, category);
      if (similarClawhub && similarClawhub.score >= 50) {
        // 安装近似技能到全局
        await this.installSkillToGlobal(similarClawhub.name);
        result.alternatives.push({
          original: skill,
          alternative: similarClawhub.name,
          confidence: similarClawhub.score / 100,
          source: 'clawhub-similar',
          note: '功能近似技能（从ClawHub安装）'
        });
        result.installed.push({
          name: similarClawhub.name,
          source: 'clawhub',
          installedGlobally: true
        });
        this.installedSkills.push(similarClawhub.name);
        result.fromClawHub.push(similarClawhub.name);
        continue;
      }

      // STEP 7: 通用兜底技能
      const fallback = await this.findFallbackSkill(skill);
      if (fallback) {
        result.alternatives.push({
          original: skill,
          alternative: fallback.name,
          confidence: 0.3,
          source: 'fallback',
          note: '通用兜底技能'
        });
        result.installed.push({
          name: fallback.name,
          source: fallback.source
        });
        continue;
      }

      // STEP 8: 实在找不到
      result.missing.push(skill);
    }

    return result;
  }

  /**
   * 在已安装技能中查找最佳匹配（匹配度 0.9+）
   */
  async findBestMatchInInstalled(skillName, category) {
    let bestMatch = null;
    let bestScore = 0;

    const requiredLower = skillName.toLowerCase();
    const requiredBase = skillName.includes('/') ? skillName.split('/')[1] : skillName;

    for (const installed of this.installedSkills) {
      const score = this.calculateRelevanceScore(installed, skillName, category);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = { name: installed, score };
      }
    }

    return bestMatch;
  }

  /**
   * 在 ClawHub 搜索最佳匹配技能
   */
  async searchClawHubForBest(skillName, category) {
    // 先搜索技能名
    const results = await this.searchClawHub(skillName);
    if (results.length > 0) {
      return results[0]; // 已按分数排序
    }

    // 搜索类别相关关键词
    const categoryKeywords = this.skillCategories[category] || [];
    for (const keyword of categoryKeywords.slice(0, 3)) {
      const keywordResults = await this.searchClawHub(keyword);
      if (keywordResults.length > 0) {
        return { ...keywordResults[0], score: Math.round(keywordResults[0].score * 0.8) };
      }
    }

    return null;
  }

  /**
   * 在已安装技能中查找近似匹配
   */
  async findSimilarInInstalled(skillName) {
    const similarKeywords = this.skillSimilarityMap[skillName] || [];
    let bestMatch = null;
    let bestScore = 0;

    for (const installed of this.installedSkills) {
      for (const keyword of similarKeywords) {
        const score = this.calculateRelevanceScore(installed, keyword);
        if (score > bestScore && score >= 50) {
          bestScore = score;
          bestMatch = { name: installed, score };
        }
      }
    }

    return bestMatch;
  }

  /**
   * 从 ClawHub 搜索近似匹配
   */
  async searchClawHubForSimilar(skillName, category) {
    const similarKeywords = this.skillSimilarityMap[skillName] || [];

    for (const keyword of similarKeywords.slice(0, 3)) {
      const results = await this.searchClawHub(keyword);
      if (results.length > 0 && results[0].score >= 50) {
        return results[0];
      }
    }

    return null;
  }

  /**
   * 查找兜底技能
   */
  async findFallbackSkill(skillName) {
    const category = this.getCategoryFromSkill(skillName);

    // 根据类别返回通用兜底
    const fallbacks = {
      'creative': { name: 'claude', source: 'built-in' },
      'coding': { name: 'claude', source: 'built-in' },
      'analysis': { name: 'claude', source: 'built-in' },
      'design': { name: 'claude', source: 'built-in' },
      'tool': { name: 'exec', source: 'built-in' }
    };

    return fallbacks[category] || { name: 'claude', source: 'built-in' };
  }

  /**
   * 安装技能到全局目录 ~/.openclaw/skills
   */
  async installSkillToGlobal(skillName) {
    try {
      const globalDir = path.join(process.env.HOME || '', '.openclaw', 'skills');
      if (!fs.existsSync(globalDir)) {
        fs.mkdirSync(globalDir, { recursive: true });
      }

      const skillDir = path.join(globalDir, skillName);

      // 如果已经存在，跳过安装
      if (fs.existsSync(skillDir)) {
        return true;
      }

      // 使用 clawhub install 安装到全局目录
      const installCmd = skillName.startsWith('openclaw/')
        ? `openclaw install ${skillName} --global`
        : `clawhub install ${skillName} --global`;

      execSync(installCmd, {
        stdio: 'inherit',
        timeout: 120000,
        env: { ...process.env, CLAWHUB_INSTALL_DIR: globalDir }
      });

      // 验证安装成功
      if (fs.existsSync(skillDir)) {
        return true;
      }

      return false;
    } catch (error) {
      console.warn(`Failed to install skill ${skillName} globally:`, error.message);
      return false;
    }
  }

  /**
   * 在已安装技能中查找完全匹配
   */
  findInstalledSkillMatch(skillName) {
    const requiredLower = skillName.toLowerCase();
    const requiredName = skillName.includes('/') ? skillName.split('/')[1] : skillName;

    for (const installed of this.installedSkills) {
      const installedLower = installed.toLowerCase();
      const installedName = installed.includes('/') ? installed.split('/')[1] : installed;

      // 完全匹配
      if (installedLower === requiredLower) {
        return installed;
      }

      // 名称部分完全匹配
      if (installedName.toLowerCase() === requiredName.toLowerCase()) {
        return installed;
      }

      // 去除连字符后匹配
      if (installedLower.replace(/-/g, '') === requiredLower.replace(/-/g, '')) {
        return installed;
      }
    }

    return null;
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
        fromGlobal: result.fromGlobal?.length || 0,
        fromClawHub: result.fromClawHub?.length || 0,
        alternatives: result.alternatives.length,
        missing: result.missing.length
      },
      details: result
    };
  }
}

module.exports = SkillMatcher;
