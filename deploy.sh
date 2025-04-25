#!/bin/bash

# 小红书文案生成器部署脚本
# 使用此脚本将应用部署到服务器

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 打印带颜色的信息
echo_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

echo_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

echo_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查build目录是否存在
if [ ! -d "build" ]; then
    echo_error "未找到build目录，请先运行 npm run build"
    exit 1
fi

# 获取部署目标服务器
read -p "请输入部署服务器IP或域名: " SERVER
read -p "请输入SSH用户名 (默认: root): " SSH_USER
SSH_USER=${SSH_USER:-root}
read -p "请输入远程部署目录 (默认: /var/www/xhs-generator): " REMOTE_DIR
REMOTE_DIR=${REMOTE_DIR:-/var/www/xhs-generator}

echo_info "准备部署到 ${SSH_USER}@${SERVER}:${REMOTE_DIR}"

# 检查ssh连接
echo_info "正在检查SSH连接..."
ssh -q ${SSH_USER}@${SERVER} exit
if [ $? -ne 0 ]; then
    echo_error "无法连接到服务器，请检查SSH配置"
    exit 1
fi

# 创建远程目录
echo_info "创建远程目录..."
ssh ${SSH_USER}@${SERVER} "mkdir -p ${REMOTE_DIR}"

# 上传文件
echo_info "正在上传文件到服务器..."
rsync -avz --progress build/ ${SSH_USER}@${SERVER}:${REMOTE_DIR}/

if [ $? -ne 0 ]; then
    echo_error "文件上传失败"
    exit 1
fi

echo_success "文件上传成功！"

# 询问是否配置Nginx
read -p "是否要配置Nginx? (y/n): " CONFIGURE_NGINX
if [ "$CONFIGURE_NGINX" = "y" ]; then
    echo_info "配置Nginx..."
    
    # 创建Nginx配置
    NGINX_CONF="server {
    listen 80;
    server_name ${SERVER};

    root ${REMOTE_DIR};
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }
}"
    
    # 将配置上传到服务器
    echo "$NGINX_CONF" | ssh ${SSH_USER}@${SERVER} "cat > /tmp/xhs-generator.conf"
    
    # 移动配置文件并配置Nginx
    ssh ${SSH_USER}@${SERVER} "
        if [ -d /etc/nginx/sites-available ]; then
            # Debian/Ubuntu
            sudo mv /tmp/xhs-generator.conf /etc/nginx/sites-available/xhs-generator
            sudo ln -sf /etc/nginx/sites-available/xhs-generator /etc/nginx/sites-enabled/
        else
            # CentOS/RHEL
            sudo mv /tmp/xhs-generator.conf /etc/nginx/conf.d/xhs-generator.conf
        fi
        sudo nginx -t && sudo systemctl restart nginx
    "
    
    if [ $? -ne 0 ]; then
        echo_error "Nginx配置失败"
    else
        echo_success "Nginx配置成功！"
    fi
fi

echo_success "部署完成！"
echo_info "您的应用已部署到: http://${SERVER}"
echo_info "如果服务器未开启Web服务，您可以在服务器上执行以下命令来启动一个简单的Web服务器："
echo_info "cd ${REMOTE_DIR} && python3 -m http.server 80 # 或者使用 npx serve -s" 