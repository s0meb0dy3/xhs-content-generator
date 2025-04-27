# Linux服务器部署指南

本文档将指导您如何在Linux服务器上部署小红书文案生成器应用。

## 前提条件

- 一台运行Linux的服务器（如Ubuntu、CentOS等）
- Node.js环境（推荐v14+）
- 项目文件已上传到服务器

## 部署方式一：使用Nginx（推荐）

### 步骤1：安装Node.js和npm（如果尚未安装）

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nodejs npm

# 或者对于CentOS/RHEL
sudo yum install nodejs npm

# 验证安装
node --version
npm --version
```

### 步骤2：安装Nginx

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nginx

# 或者对于CentOS/RHEL
sudo yum install nginx

# 启动Nginx并设置开机自启
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 步骤3：构建应用

假设您已经将项目文件上传到服务器的`/home/user/xhs-generator`目录：

```bash
# 进入项目目录
cd /home/user/xhs-generator

# 安装依赖
npm install

# 构建生产版本
npm run build
```

### 步骤4：配置Nginx

创建Nginx配置文件：

```bash
sudo nano /etc/nginx/sites-available/xhs-generator
```

添加以下配置内容：

```nginx
server {
    listen 80;
    server_name your-domain-or-ip;  # 替换为您的域名或服务器IP

    root /home/user/xhs-generator/build;  # 替换为实际的build目录路径
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

    # 静态资源缓存
    location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
        expires 7d;
    }
}
```

创建符号链接并测试配置：

```bash
# 对于Ubuntu/Debian
sudo ln -s /etc/nginx/sites-available/xhs-generator /etc/nginx/sites-enabled/

# 验证配置
sudo nginx -t

# 重启Nginx
sudo systemctl restart nginx
```

### 步骤5：设置防火墙（如需）

确保服务器的防火墙允许HTTP流量：

```bash
# Ubuntu/Debian with UFW
sudo ufw allow 'Nginx Full'

# CentOS/RHEL with firewalld
sudo firewall-cmd --permanent --zone=public --add-service=http
sudo firewall-cmd --permanent --zone=public --add-service=https  # 如果使用HTTPS
sudo firewall-cmd --reload
```

### 步骤6：配置HTTPS（可选但推荐）

使用Let's Encrypt获取免费SSL证书：

```bash
# Ubuntu/Debian
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com

# 证书会自动续期
```

## 部署方式二：使用Node.js静态文件服务器

如果您不想使用Nginx，可以使用Node.js的静态文件服务器：

### 步骤1：安装serve工具

```bash
# 全局安装serve
sudo npm install -g serve
```

### 步骤2：启动服务

```bash
# 进入项目目录
cd /home/user/xhs-generator

# 假设您已经运行过npm run build
serve -s build
```

### 步骤3：使用PM2保持服务运行

为了保持服务在后台持续运行，建议使用PM2：

```bash
# 安装PM2
sudo npm install -g pm2

# 使用PM2启动服务
pm2 start "serve -s build -l 3000" --name xhs-generator

# 设置开机自启
pm2 startup
pm2 save
```

通过`http://your-server-ip:3000`访问您的应用。

### 步骤4：设置反向代理（可选）

如果您希望使用标准HTTP端口（80），可以设置Nginx反向代理：

```nginx
server {
    listen 80;
    server_name your-domain-or-ip;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 常见问题解决

### 1. 跨域问题

如果API请求出现跨域问题，可以在Nginx配置中添加代理：

```nginx
location /api/ {
    proxy_pass https://api.example.com/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    
    # 允许跨域
    add_header 'Access-Control-Allow-Origin' '*';
    add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS';
    add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization';
}
```

### 2. 权限问题

确保Nginx有权访问应用目录：

```bash
# 假设Nginx以www-data用户运行
sudo chown -R www-data:www-data /home/user/xhs-generator/build
```

### 3. 查看日志排查问题

```bash
# Nginx错误日志
sudo tail -f /var/log/nginx/error.log

# PM2日志
pm2 logs
```

### 4. 服务器重启后自动启动

对于使用PM2的部署：

```bash
pm2 startup
pm2 save
```

对于Nginx，通常默认已设置为开机自启：

```bash
sudo systemctl enable nginx
```

## 更新应用

当您需要更新应用时：

```bash
# 拉取最新代码或上传新文件
cd /home/user/xhs-generator

# 安装依赖（如有新依赖）
npm install

# 构建新版本
npm run build

# 如果使用PM2
pm2 restart xhs-generator

# 如果只使用Nginx，无需重启
```

## 安全注意事项

1. **API密钥保护**：确保API密钥等敏感信息不会被公开。可以使用环境变量或后端代理。

2. **HTTPS**：强烈建议配置HTTPS来保护数据传输。

3. **定期更新**：保持服务器操作系统和所有软件包的最新状态。 