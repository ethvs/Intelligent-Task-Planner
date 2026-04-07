/**
 * GitHub 上传脚本
 * 自动创建 GitHub 仓库并推送代码
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const GITHUB_USER = process.env.GITHUB_USER || 'openclaw';
const REPO_NAME = 'intelligent-task-planner';

async function uploadToGitHub() {
  console.log('🚀 开始上传到 GitHub...\n');
  
  const repoPath = path.join(__dirname, '..');
  const gitUrl = `https://github.com/${GITHUB_USER}/${REPO_NAME}.git`;
  
  try {
    // 1. 检查是否已存在 git 仓库
    let isGitRepo = false;
    try {
      execSync('git status', { cwd: repoPath });
      isGitRepo = true;
    } catch (e) {
      isGitRepo = false;
    }
    
    if (!isGitRepo) {
      console.log('📦 初始化 Git 仓库...');
      execSync('git init', { cwd: repoPath, stdio: 'inherit' });
    }
    
    // 2. 添加所有文件
    console.log('📝 添加文件到暂存区...');
    execSync('git add .', { cwd: repoPath, stdio: 'inherit' });
    
    // 3. 提交
    console.log('💾 提交更改...');
    execSync('git commit -m "feat: 初始版本 v2.0.0 - 支持 100+ 任务类型和 1000+ 关键词"', { 
      cwd: repoPath, 
      stdio: 'inherit' 
    });
    
    // 4. 检查远程仓库
    try {
      execSync('git remote get-url origin', { cwd: repoPath });
      console.log('✅ 远程仓库已存在');
    } catch (e) {
      console.log('🔗 添加远程仓库...');
      execSync(`git remote add origin ${gitUrl}`, { cwd: repoPath, stdio: 'inherit' });
    }
    
    // 5. 推送
    console.log('📤 推送到 GitHub...');
    execSync('git push -u origin main', { cwd: repoPath, stdio: 'inherit' });
    
    console.log('\n✅ 上传成功！');
    console.log(`🌐 访问：https://github.com/${GITHUB_USER}/${REPO_NAME}`);
    
  } catch (error) {
    console.error('\n❌ 上传失败:', error.message);
    console.log('\n💡 提示：请检查是否正确设置了 GITHUB_USER 环境变量，或手动执行 git push');
    process.exit(1);
  }
}

// 如果是直接运行此脚本
if (require.main === module) {
  uploadToGitHub();
}

module.exports = uploadToGitHub;
