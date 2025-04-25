// 简单的本地服务器脚本，用于测试部署版本
const express = require('express');
const path = require('path');
const compression = require('compression');
const app = express();
const port = process.env.PORT || 5000;

// 启用gzip压缩
app.use(compression());

// 提供静态文件
app.use(express.static(path.join(__dirname, 'build')));

// 对所有请求返回index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(port, () => {
  console.log(`小红书文案生成器正在运行于 http://localhost:${port}`);
  console.log(`您可以通过以下地址访问应用：`);
  console.log(`- 本地: http://localhost:${port}`);
  
  // 获取本机IP地址
  const { networkInterfaces } = require('os');
  const nets = networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // 跳过内部IP和非IPv4地址
      if (net.family === 'IPv4' && !net.internal) {
        console.log(`- 网络: http://${net.address}:${port}`);
      }
    }
  }
}); 