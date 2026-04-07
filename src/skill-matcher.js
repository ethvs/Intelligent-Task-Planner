/**
 * 技能匹配器
 * 从 ClawHub 和 GitHub 搜索、评估、筛选技能
 */

const { execSync } = require('child_process');

class SkillMatcher {
  constructor() {
    this.availableSkills = [];
  }

  /**
   * 从 ClawHub 搜索技能
   * @param {string} query - 搜索关键词
   * @returns {Promise<Array>} 搜索结果
   */
  async searchClawHub(query) {
    try {
      // 使用 clawhub CLI 搜索
      const result = execSync(`clawhub search ${query} --json`, { 
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'ignore']
      });
      return JSON.parse(result) || [];
    } catch (error) {
      console.log(`ClawHub 搜索失败：${query}, 使用默认列表`);
      return this.getDefaultSkills(query);
    }
  }

  /**
   * 从 GitHub 搜索 OpenClaw 技能
   * @param {string} query - 搜索关键词
   * @returns {Promise<Array>} 搜索结果
   */
  async searchGitHub(query) {
    try {
      // 搜索 GitHub 上的 openclaw skill
      const searchQuery = `openclaw+skill+${query.replace(/\s+/g, '+')}`;
      const url = `https://api.github.com/search/repositories?q=${searchQuery}&sort=stars&order=desc`;
      
      const response = await fetch(url, {
        headers: { 'Accept': 'application/vnd.github.v3+json' }
      });
      
      if (!response.ok) return [];
      
      const data = await response.json();
      return data.items?.slice(0, 5).map(repo => ({
        name: repo.name,
        description: repo.description,
        url: repo.html_url,
        stars: repo.stargazers_count,
        source: 'github'
      })) || [];
    } catch (error) {
      console.log(`GitHub 搜索失败：${query}`);
      return [];
    }
  }

  /**
   * 评估技能质量
   * @param {Object} skill - 技能信息
   * @returns {number} 评分 0-100
   */
  evaluateSkill(skill) {
    let score = 50; // 基础分

    // 有描述加分
    if (skill.description) score += 10;
    
    // GitHub star 数加分
    if (skill.stars) {
      score += Math.min(30, skill.stars / 100);
    }

    // 官方/知名作者加分
    if (skill.author === 'openclaw' || skill.official) {
      score += 20;
    }

    // 最近更新时间加分
    if (skill.updatedAt) {
      const daysSinceUpdate = (Date.now() - new Date(skill.updatedAt)) / (1000 * 60 * 60 * 24);
      if (daysSinceUpdate < 30) score += 10;
      else if (daysSinceUpdate > 365) score -= 20;
    }

    return Math.min(100, Math.max(0, score));
  }

  /**
   * 筛选最佳技能
   * @param {Array} skills - 技能列表
   * @param {number} topN - 返回前 N 个
   * @returns {Array} 筛选后的技能
   */
  filterSkills(skills, topN = 3) {
    // 去重（按名称）
    const uniqueSkills = skills.filter((skill, index, self) =>
      index === self.findIndex(s => s.name === skill.name)
    );

    // 评分并排序
    const scored = uniqueSkills.map(skill => ({
      ...skill,
      score: this.evaluateSkill(skill)
    }));

    scored.sort((a, b) => b.score - a.score);

    return scored.slice(0, topN);
  }

  /**
   * 安装技能
   * @param {string} skillName - 技能名称
   * @returns {Promise<boolean>} 是否成功
   */
  async installSkill(skillName) {
    try {
      execSync(`clawhub install ${skillName}`, {
        stdio: 'inherit'
      });
      return true;
    } catch (error) {
      console.log(`安装技能失败：${skillName}`);
      return false;
    }
  }

  /**
   * 获取默认技能列表
   * @param {string} category - 类别
   * @returns {Array} 默认技能
   */
  getDefaultSkills(category) {
    const defaults = {
      'creative_writing': [
        { name: 'writer', source: 'clawhub', description: '写作助手' },
        { name: 'storyteller', source: 'clawhub', description: '故事生成器' }
      ],
      'weather_query': [
        { name: 'weather', source: 'builtin', description: '天气查询' }
      ],
      'data_analysis': [
        { name: 'data-analyzer', source: 'clawhub', description: '数据分析' }
      ],
      'code_generation': [
        { name: 'code-helper', source: 'clawhub', description: '代码助手' }
      ],
      'image_generation': [
        { name: 'imagegen', source: 'builtin', description: '图片生成' }
      ]
    };

    return defaults[category] || [];
  }
}

module.exports = SkillMatcher;
