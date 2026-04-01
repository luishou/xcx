function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
    return res.status(401).json({
      message: "登录已失效，请重新登录"
    });
  }

  console.error(error);
  return res.status(500).json({
    message: error.message || "服务器开小差了"
  });
}

module.exports = {
  errorHandler
};
