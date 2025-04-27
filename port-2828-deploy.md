# 使用2828端口部署小红书文案生成器

以下是如何在Linux服务器上使用2828端口部署小红书文案生成器的步骤。

## 方式一：使用Node.js静态文件服务器（最简单）

这是最直接的方法，不需要复杂的配置：

```bash
# 进入项目目录
cd 您的项目目录

# 安装依赖
npm install

# 构建项目
npm run build

# 安装serve工具
npm install -g serve

# 使用2828端口启动服务
serve -s build -l 2828
```

您可以通过 `http://服务器IP:2828` 访问应用。

## 方式二：使用PM2管理（推荐用于生产环境）

使用PM2可以让应用在后台运行并在服务器重启后自动启动：

```bash
# 进入项目目录
cd 您的项目目录

# 安装依赖
npm install

# 构建项目
npm run build

# 安装PM2
npm install -g pm2

# 使用PM2在2828端口启动服务
pm2 start "serve -s build -l 2828" --name xhs-generator

# 设置开机自启
pm2 startup
pm2 save
```

您可以通过 `http://服务器IP:2828` 访问应用。

## 方式三：使用local-server.js修改端口

项目已经包含了`local-server.js`脚本，您可以修改它来使用2828端口：

```bash
# 进入项目目录
cd 您的项目目录

# 编辑local-server.js文件
# 将 const port = process.env.PORT || 5000; 修改为:
# const port = process.env.PORT || 2828;

# 安装依赖
npm install

# 构建项目
npm run build

# 安装express和compression（如果还没有）
npm install express compression

# 启动服务器
node local-server.js
```

## 方式四：使用Nginx反向代理

如果您想使用Nginx并保持2828端口：

```bash
# 进入项目目录
cd 您的项目目录

# 安装依赖并构建
npm install
npm run build

# 安装Nginx
sudo apt update
sudo apt install nginx

# 配置Nginx
sudo nano /etc/nginx/sites-available/xhs-generator
```

添加以下配置到Nginx：

```nginx
server {
    listen 2828;
    server_name your-server-ip-or-domain;  # 替换为您的服务器IP或域名

    root /path/to/your/project/build;  # 替换为实际的build目录路径
    index index.html;

    # 启用gzip压缩
    gzip on;
    gzip_min_length 1k;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/javascript application/json application/javascript;

    # 处理单页应用路由
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

然后启用配置：

```bash
sudo ln -s /etc/nginx/sites-available/xhs-generator /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# 确保防火墙允许2828端口
sudo ufw allow 2828/tcp  # 对于使用ufw的系统
# 或
sudo firewall-cmd --permanent --add-port=2828/tcp  # 对于使用firewalld的系统
sudo firewall-cmd --reload
```

## 方式五：修改deploy.sh脚本

您可以修改自带的`deploy.sh`脚本来使用2828端口：

```bash
# 编辑deploy.sh文件
# 在Nginx配置部分，将 listen 80; 修改为 listen 2828;

# 然后运行部署脚本
chmod +x deploy.sh
./deploy.sh
```

## 检查部署是否成功

无论使用哪种方法，部署后都可以通过以下命令检查端口是否正在监听：

```bash
# 检查2828端口是否已在监听
netstat -tulpn | grep 2828
# 或
ss -tulpn | grep 2828
```

如果一切正常，您应该能够通过 `http://服务器IP:2828` 访问应用。

## 注意事项

1. 某些Linux发行版可能需要配置防火墙以允许2828端口的流量。
2. 如果您的服务器使用了云服务提供商（如AWS、阿里云等），可能还需要在其控制台中配置安全组/防火墙规则。
3. 部署在非标准端口（如2828）上可能会影响SEO，如果这是一个生产环境的应用，建议使用标准端口（80/443）并通过反向代理重定向。 