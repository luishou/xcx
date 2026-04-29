const store = require("../../utils/report-store");
const api = require("../../utils/api");

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
    loading: false,
    statusText: "待授权进入",
    welcomeText: "",
    features: [
      { icon: "📷", text: "拍照即上报，无需填写复杂表单" },
      { icon: "⚡", text: "全程约 10 秒完成，操作极简" },
      { icon: "🛡️", text: "隐患及时处理，保障你和工友的安全" }
    ],
    showNicknameModal: false,
    tempNickname: "",
    tempAvatarUrl: ""
  },

  onLoad() {
    this.setData({ scrollHeight: getWindowHeight() });
  },

  onResize() {
    this.setData({ scrollHeight: getWindowHeight() });
  },

  onShow() {
    const currentUser = store.getCurrentUser();
    const isLoggedIn = !!(currentUser && currentUser.name && store.getToken());
    if (isLoggedIn) {
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
        statusText: "待授权进入",
        welcomeText: ""
      });
    }
  },

  /** 主流程：已登录直接去标段；未登录先弹授权，成功后再去标段 */
  handleReportTap() {
    if (this.data.loading) {
      return;
    }

    const currentUser = store.getCurrentUser();
    if (currentUser && currentUser.name && store.getToken()) {
      wx.navigateTo({ url: "/pages/section/index" });
      return;
    }

    this.setData({
      showNicknameModal: true,
      tempNickname: "",
      tempAvatarUrl: ""
    });
  },

  chooseAvatar(e) {
    this.setData({ tempAvatarUrl: e.detail.avatarUrl });
  },

  onNicknameInput(e) {
    this.setData({ tempNickname: e.detail.value });
  },

  confirmUserInfo() {
    const { tempNickname, tempAvatarUrl } = this.data;
    if (!tempNickname || !tempNickname.trim()) {
      wx.showToast({ title: "请输入昵称", icon: "none" });
      return;
    }

    const userInfo = {
      nickName: tempNickname.trim(),
      avatarUrl: tempAvatarUrl || ""
    };

    this.setData({ showNicknameModal: false, loading: true, primaryButtonText: "登录中..." });
    this.proceedWithLogin(userInfo);
  },

  cancelUserInfo() {
    this.setData({ showNicknameModal: false });
  },

  proceedWithLogin(userInfo) {
    wx.login({
      success: (res) => {
        if (!res.code) {
          this._onLoginFail(new Error("未拿到微信登录 code"));
          return;
        }
        api.request({
          url: "/api/auth/wechat-login",
          method: "POST",
          data: { code: res.code, userInfo }
        })
          .then((result) => {
            store.setToken(result.token);
            store.setCurrentUser({
              id: result.user.id,
              name: result.user.nickname,
              avatarUrl: result.user.avatarUrl
            });

            wx.showToast({ title: "授权成功", icon: "success" });

            setTimeout(() => {
              wx.navigateTo({ url: "/pages/section/index" });
            }, 250);
          })
          .catch((error) => this._onLoginFail(error))
          .finally(() => {
            const u = store.getCurrentUser();
            this.setData({
              loading: false,
              isLoggedIn: !!(u && u.name && store.getToken()),
              primaryButtonText: u && u.name ? "继续上报" : "点击上报",
              statusText: u && u.name ? "已授权，可继续上报" : "待授权进入"
            });
          });
      },
      fail: (err) => this._onLoginFail(err)
    });
  },

  handleMyReportsTap() {
    wx.navigateTo({ url: "/pages/my-reports/index" });
  },

  _onLoginFail(error) {
    wx.showToast({ title: (error && error.message) || "登录失败", icon: "none" });
    this.setData({ loading: false, primaryButtonText: "点击上报" });
  }
});
