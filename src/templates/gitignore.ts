/**
 * .gitignore 生成器
 */

export function generateGitignore(): string {
  return `# Dependencies
node_modules/
.pnpm-store/
.yarn/

# Build output
dist/
*.tsbuildinfo

# Environment variables
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Test coverage
coverage/
.nyc_output/

# Temporary files
tmp/
temp/
*.tmp
`;
}
