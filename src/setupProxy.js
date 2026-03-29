const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
  // Use environment variable provided by Docker, or default to localhost for host development
  const target = process.env.PROXY_API_URL || 'http://localhost:5001';
  console.log(`[React Proxy] Initializing proxy middleware with target: ${target}`);

  app.use(
    createProxyMiddleware({
      pathFilter: '/api',
      target,
      changeOrigin: true,
      onProxyReq: (proxyReq, req, res) => {
        console.log(`[React Proxy] Forwarding request to ${target}${proxyReq.path}`);
      },
      onError: (err, req, res) => {
        console.error(`[React Proxy Error] Failed to reach ${target}:`, err.message);
        res.status(504).json({ error: 'Proxy Error', message: err.message, target });
      },
    })
  );
};
