const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function (app) {
  app.use(
    "/api",
    createProxyMiddleware({
      target: "https://www.metalmental.net",
      changeOrigin: true,
      secure: false,
    })
  );
};
