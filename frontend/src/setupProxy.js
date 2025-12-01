const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Only proxy in development when there's no REACT_APP_BACKEND_URL set
  // In production (deployed), Kubernetes Ingress handles routing
  const backendUrl = process.env.REACT_APP_BACKEND_URL;
  
  if (!backendUrl || backendUrl.trim() === '') {
    // Proxy /api requests to backend in development
    app.use(
      '/api',
      createProxyMiddleware({
        target: 'http://localhost:8001',
        changeOrigin: true,
        logLevel: 'debug',
      })
    );
    console.log('🔧 Development proxy: /api -> http://localhost:8001');
  } else {
    console.log('✅ Using backend URL from env:', backendUrl);
  }
};
