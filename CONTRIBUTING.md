# 贡献指南

感谢您对小红书文案生成器项目的关注！欢迎贡献代码、报告问题或提出改进建议。

## 开发环境设置

1. Fork本仓库到您的GitHub账号
2. 克隆您的Fork到本地开发环境
   ```bash
   git clone https://github.com/YOUR_USERNAME/xhs-content-generator.git
   cd xhs-content-generator
   ```
3. 安装依赖
   ```bash
   npm install
   ```
4. 启动开发服务器
   ```bash
   npm start
   ```

## 分支策略

- `main`/`master`: 主分支，包含稳定版本代码
- `develop`: 开发分支，包含待发布的新功能
- `feature/*`: 功能分支，用于开发新功能
- `bugfix/*`: 修复分支，用于修复bug
- `hotfix/*`: 热修复分支，用于修复生产环境中的严重问题

请基于`develop`分支创建您的功能分支：

```bash
git checkout develop
git checkout -b feature/your-feature-name
```

## 提交规范

我们使用约定式提交规范。每个提交消息应当包含以下结构：

```
<类型>[可选作用域]: <描述>

[可选正文]

[可选脚注]
```

类型可以是：
- `feat`: 新功能
- `fix`: 错误修复
- `docs`: 文档更改
- `style`: 不影响代码含义的更改（空格、格式等）
- `refactor`: 既不修复错误也不添加功能的代码重构
- `perf`: 性能改进
- `test`: 添加或修正测试
- `build`: 影响构建系统或外部依赖的更改
- `ci`: 更改CI配置文件和脚本
- `chore`: 其他不修改src或test的更改

示例：
```
feat(文案生成): 添加新的风格选项

添加了"学术风格"选项，使用更加专业化的语言生成文案。

Closes #123
```

## Pull Request流程

1. 确保您的代码符合项目的样式和质量标准
2. 确保所有测试都能通过 (`npm test`)
3. 更新文档以反映您的更改（如有必要）
4. 提交Pull Request到`develop`分支
5. 在PR描述中详细说明您的更改

## 代码审查

所有Pull Request都将通过代码审查。在审查期间，我们可能会要求您做出一些更改。请保持耐心并积极响应反馈。

## 报告问题

如果您发现了bug或有功能请求，请在GitHub上创建一个Issue。请提供尽可能多的信息，包括：

- 详细描述问题或功能请求
- 如何重现问题（对于bug）
- 预期行为与实际行为
- 截图（如果适用）
- 使用的环境（浏览器、操作系统等）

## 开发指南

### 代码风格

我们使用ESLint和Prettier来保持代码风格一致。在提交之前，请确保您的代码符合这些标准：

```bash
npm run lint
npm run format
```

### 组件开发

- 尽可能使用函数组件和Hooks
- 保持组件的单一职责
- 遵循Ant Design的设计规范
- 为复杂组件编写文档和注释

### API密钥安全

测试和开发中，可使用环境变量来存储API密钥：

1. 在项目根目录创建`.env.local`文件
2. 添加API密钥：`REACT_APP_COZE_API_KEY=your_api_key`
3. 在代码中使用：`process.env.REACT_APP_COZE_API_KEY`

**注意：** 不要提交包含真实API密钥的`.env`文件。

## 许可证

通过贡献代码，您同意您的贡献将根据项目的MIT许可证进行许可。谢谢！ 