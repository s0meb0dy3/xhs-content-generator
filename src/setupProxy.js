const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://gxxsh.yonp.top',
      changeOrigin: true,
      pathRewrite: {
        '^/api': '/api', // 不重写路径
      },
      onError: (err, req, res) => {
        console.error('代理错误:', err);
        res.status(500).json({ error: '代理服务器错误', details: err.message });
      },
    })
  );
}; 