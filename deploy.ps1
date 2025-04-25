# 小红书文案生成器 - Windows 部署脚本

# 输出带颜色的文字
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

function Write-Info($message) {
    Write-ColorOutput Blue "[INFO] $message"
}

function Write-Success($message) {
    Write-ColorOutput Green "[SUCCESS] $message"
}

function Write-Error($message) {
    Write-ColorOutput Red "[ERROR] $message"
}

# 检查build目录是否存在
if (-not (Test-Path "build")) {
    Write-Error "未找到build目录，请先运行 npm run build"
    exit 1
}

# 获取部署目标服务器
$SERVER = Read-Host "请输入部署服务器IP或域名"
$SSH_USER = Read-Host "请输入SSH用户名 (默认: Administrator)"
if ([string]::IsNullOrEmpty($SSH_USER)) {
    $SSH_USER = "Administrator"
}
$REMOTE_DIR = Read-Host "请输入远程部署目录 (默认: C:\inetpub\wwwroot\xhs-generator)"
if ([string]::IsNullOrEmpty($REMOTE_DIR)) {
    $REMOTE_DIR = "C:\inetpub\wwwroot\xhs-generator"
}

Write-Info "准备部署到 ${SSH_USER}@${SERVER}:${REMOTE_DIR}"

# 创建临时压缩文件
Write-Info "正在创建部署包..."
$zipFile = "build.zip"
if (Test-Path $zipFile) {
    Remove-Item $zipFile -Force
}
Compress-Archive -Path "build\*" -DestinationPath $zipFile

# 检查是否安装了SSH客户端
$sshInstalled = $null
try {
    $sshInstalled = Get-Command ssh -ErrorAction SilentlyContinue
} catch {
    $sshInstalled = $null
}

if ($sshInstalled) {
    # 使用SSH部署
    Write-Info "使用SSH部署..."
    
    # 检查ssh连接
    Write-Info "正在检查SSH连接..."
    ssh -q "${SSH_USER}@${SERVER}" "exit"
    if ($LASTEXITCODE -ne 0) {
        Write-Error "无法连接到服务器，请检查SSH配置"
        exit 1
    }
    
    # 创建远程目录
    Write-Info "创建远程目录..."
    ssh "${SSH_USER}@${SERVER}" "if not exist `"$REMOTE_DIR`" mkdir `"$REMOTE_DIR`""
    
    # 上传文件
    Write-Info "正在上传文件到服务器..."
    scp $zipFile "${SSH_USER}@${SERVER}:$REMOTE_DIR"
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "文件上传失败"
        exit 1
    }
    
    # 解压文件
    Write-Info "正在解压文件..."
    ssh "${SSH_USER}@${SERVER}" "cd $REMOTE_DIR && powershell -command `"Expand-Archive -Path build.zip -DestinationPath . -Force`" && del build.zip"
    
    # 配置IIS (可选)
    $configureIIS = Read-Host "是否要配置IIS? (y/n)"
    if ($configureIIS -eq "y") {
        Write-Info "配置IIS..."
        
        $siteName = "xhs-generator"
        $port = "80"
        
        # 远程执行IIS配置命令
        ssh "${SSH_USER}@${SERVER}" "
            # 检查是否安装了Web-Server角色
            if (-not (Get-WindowsFeature Web-Server).Installed) {
                Write-Output 'IIS未安装，请先安装IIS'
                exit 1
            }
            
            # 检查网站是否已存在
            Import-Module WebAdministration
            if (Test-Path IIS:\Sites\$siteName) {
                Remove-WebSite -Name $siteName
            }
            
            # 创建网站
            New-Website -Name $siteName -PhysicalPath $REMOTE_DIR -Port $port -Force
            
            # 设置应用池
            if (-not (Test-Path IIS:\AppPools\$siteName)) {
                New-WebAppPool -Name $siteName
            }
            Set-ItemProperty IIS:\Sites\$siteName -Name applicationPool -Value $siteName
            
            # 启动网站
            Start-Website -Name $siteName
            
            Write-Output 'IIS配置完成'
        "
        
        if ($LASTEXITCODE -ne 0) {
            Write-Error "IIS配置失败"
        } else {
            Write-Success "IIS配置成功！"
        }
    }
} else {
    # 提示手动部署
    Write-Info "未检测到SSH客户端，请按以下步骤手动部署："
    Write-Info "1. 将 $zipFile 复制到目标服务器的 $REMOTE_DIR 目录"
    Write-Info "2. 在目标服务器上解压该文件"
    Write-Info "3. 配置Web服务器（如IIS）指向解压后的目录"
}

# 清理临时文件
if (Test-Path $zipFile) {
    Remove-Item $zipFile -Force
}

Write-Success "部署过程完成！"
Write-Info "您的应用已部署到: http://${SERVER}"
Write-Info "如果服务器未开启Web服务，您可以在服务器上运行: npx serve -s ${REMOTE_DIR}" 