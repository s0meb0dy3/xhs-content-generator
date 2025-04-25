# 发布到GitHub指南

本文档将指导您如何将小红书文案生成器项目发布到GitHub上。

## 前提条件

1. 安装Git：从 [git-scm.com](https://git-scm.com/) 下载并安装
2. 创建GitHub账号：如果您还没有GitHub账号，请在 [github.com](https://github.com) 注册
3. 确保您已经运行了 `npm run build` 生成产品版本

## 步骤一：初始化Git仓库

在项目目录下打开终端或命令提示符，执行以下命令：

```bash
# 初始化Git仓库
git init

# 添加所有文件到暂存区
git add .

# 提交更改
git commit -m "初始化提交：小红书文案生成器应用"
```

## 步骤二：在GitHub上创建新仓库

1. 登录您的GitHub账号
2. 点击右上角"+"图标，选择"New repository"
3. 填写仓库名称，如"xhs-content-generator"
4. 添加仓库描述："基于React和Coze API的小红书文案生成器"
5. 选择仓库可见性（公开或私有）
6. 不要勾选"Initialize this repository with a README"
7. 点击"Create repository"

## 步骤三：推送到GitHub

创建仓库后，GitHub会显示仓库的URL和推送指令。按照以下步骤操作：

```bash
# 添加远程仓库（替换YOUR_USERNAME为您的GitHub用户名）
git remote add origin https://github.com/YOUR_USERNAME/xhs-content-generator.git

# 推送到主分支
git push -u origin master
# 或者如果您使用main分支
git push -u origin main
```

如果您使用SSH密钥认证，则命令会略有不同：

```bash
git remote add origin git@github.com:YOUR_USERNAME/xhs-content-generator.git
git push -u origin master  # 或 main
```

## 步骤四：验证发布

1. 刷新GitHub仓库页面，确认所有文件都已成功上传
2. 查看仓库的README.md是否正确显示
3. 检查项目结构和代码文件是否完整

## GitHub Pages部署（可选）

如果您希望通过GitHub Pages展示您的应用，可以按照以下步骤操作：

1. 在GitHub仓库页面，点击"Settings"
2. 滚动到"GitHub Pages"部分
3. 在"Source"下拉菜单中选择"main"或"master"分支的"/docs"文件夹或"/(root)"
4. 点击"Save"
5. 等待几分钟，GitHub Pages会自动构建您的网站
6. 访问生成的URL（通常是https://YOUR_USERNAME.github.io/xhs-content-generator/）

## 注意事项

1. **API密钥安全**：请注意项目中的Coze API密钥是硬编码的。对于公开仓库，建议在推送前移除敏感信息或使用环境变量。

2. **持续集成**：考虑设置GitHub Actions自动化构建和部署流程。

3. **协作者管理**：如果这是团队项目，可以在仓库设置中添加协作者。

4. **分支策略**：对于更大型的项目，考虑使用feature分支和pull request工作流。

## 常见问题解决

1. **推送失败**：确保您有正确的仓库权限，并且Git凭据配置正确。

2. **大文件问题**：如果有超过100MB的文件，可能需要使用Git LFS。

3. **忽略文件**：确认.gitignore文件包含了所有应该被忽略的文件和目录。

完成上述步骤后，您的小红书文案生成器项目就成功发布到GitHub上了。 