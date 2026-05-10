const store = require("../../utils/report-store");

function getWindowHeight() {
  try {
    if (typeof wx.getWindowInfo === "function") {
      return wx.getWindowInfo().windowHeight;
    }
  } catch (e) {
    /* ignore */
  }
  try {
    return wx.getSystemInfoSync().windowHeight;
  } catch (e) {
    return 667;
  }
}

Page({
  data: {
    scrollHeight: 667,
    isLoggedIn: false,
    primaryButtonText: "点击上报",
    statusText: "点击下方上报",
    welcomeText: "",
    features: [
      { icon: "📷", text: "拍照即上报，无需填写复杂表单" },
      { icon: "⚡", text: "全程约 10 秒完成，操作极简" },
      { icon: "🛡️", text: "隐患及时处理，保障你和工友的安全" }
    ]
  },

  onLoad() {
    this.setData({ scrollHeight: getWindowHeight() });
  },

  onResize() {
    this.setData({ scrollHeight: getWindowHeight() });
  },

  onShow() {
    const currentUser = store.getCurrentUser();
    const isLoggedIn = store.isLoggedIn();
    if (isLoggedIn && currentUser && currentUser.name) {
      this.setData({
        isLoggedIn: true,
        primaryButtonText: "继续上报",
        statusText: "已授权，可继续上报",
        welcomeText: `${currentUser.name}，欢迎回来。点击下方继续选择标段并上报。`
      });
    } else {
      this.setData({
        isLoggedIn: false,
        primaryButtonText: "点击上报",
        statusText: "点击下方上报",
        welcomeText: ""
      });
    }
  },

  /** 主流程：直接进入标段选择；提交时再授权登录 */
  handleReportTap() {
    wx.navigateTo({ url: "/pages/section/index" });
  },

  handleMyReportsTap() {
    wx.navigateTo({ url: "/pages/my-reports/index" });
  }
});
