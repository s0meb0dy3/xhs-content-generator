# 小红书文案生成器

这是一个基于React和Ant Design的小红书文案生成工具，通过Coze API自动生成校园相关的小红书风格文案。

![小红书文案生成器](https://ui-avatars.com/api/?name=小红书文案生成器&size=128&background=f56a6a&color=fff)

## 功能特点

- 校园文案自动生成
- 多种风格选择（默认风格、正式风格、幽默风趣、情感共鸣、自定义提示词）
- 文案历史记录保存
- 文案内容编辑功能
- 一键复制功能
- 响应式设计
- 报告内容展示

## 技术栈

- React 18
- Ant Design 5
- CozeAPI
- React Markdown

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式启动

```bash
npm start
```

应用将在开发模式下运行，访问 [http://localhost:3000](http://localhost:3000) 查看。

### 构建生产版本

```bash
npm run build
```

生成的文件将存放在 `build` 目录中，可以部署到任何静态网站托管服务。

## 本地预览生产版本

在生产模式下预览应用：

```bash
npm run serve
```

## 部署

本项目提供了两种部署脚本：

- `deploy.sh` - Linux/macOS用户使用
- `deploy.ps1` - Windows用户使用

这些脚本会引导您完成将应用部署到远程服务器的过程。

## 使用说明

1. 从下拉菜单中选择学校，或输入学校名称
2. 选择文案风格（默认风格、正式风格、幽默风趣、情感共鸣或自定义提示词）
3. 如选择"自定义提示词"，可输入自定义的风格需求
4. 点击"生成文案"按钮
5. 生成的文案将在左侧显示，右侧显示报告内容
6. 可以点击"编辑"按钮修改文案内容
7. 可以点击"复制"按钮复制单条文案，或"复制全部"复制所有文案
8. 点击顶部的历史记录图标可查看历史生成记录

## 项目结构

```
src/
├── App.js          # 主应用组件
├── App.css         # 主样式文件
├── index.js        # 应用入口
└── ...
```

## API密钥安全

⚠️ **注意**：当前应用中的Coze API密钥是硬编码的。在生产环境中，建议将其移至环境变量或后端服务中，以增强安全性。

## 贡献指南

1. Fork本仓库
2. 创建您的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交您的修改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建Pull Request

## 许可证

本项目采用MIT许可证 - 详见[LICENSE](LICENSE)文件

## 联系方式

如有任何问题或建议，请创建Issue或联系项目维护者。 