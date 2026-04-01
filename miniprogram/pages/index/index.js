const store = require("../../utils/report-store");
const api = require("../../utils/api");

Page({
  data: {
    isLoggedIn: false,
    buttonText: "授权昵称头像 · 一键登录",
    loading: false,
    statusText: "待授权进入",
    welcomeText: "面向施工现场的一线安全直报入口，发现隐患后可立即拍照、选择标段并提交后台处理。",
    metrics: [
      { value: "10 秒", label: "最快完成一次上报" },
      { value: "3 张", label: "支持现场多图上传" },
      { value: "2 标段", label: "按施工标段精准分发" }
    ],
    features: [
      {
        icon: "📷",
        title: "现场直拍，减少漏报",
        text: "不需要复杂表单，发现问题后直接拍照上传，降低工友上报门槛。"
      },
      {
        icon: "🧭",
        title: "按标段分流处理",
        text: "提交时确认标段，后台能直接按 TJ01、TJ02 分开查看和跟进。"
      },
      {
        icon: "📊",
        title: "后台同步可见",
        text: "上报成功后会进入后台记录和统计页，方便管理人员统一处理。"
      }
    ],
    steps: [
      {
        index: "1",
        title: "微信授权进入",
        text: "首次进入完成授权，系统会记录当前上报人信息。"
      },
      {
        index: "2",
        title: "选择标段并拍照",
        text: "确认所在标段后拍摄隐患现场，最多支持 3 张图片。"
      },
      {
        index: "3",
        title: "补充描述并提交",
        text: "可补一句简要说明，提交后后台立即可以看到这条记录。"
      }
    ],
    showNicknameModal: false,
    tempNickname: "",
    tempAvatarUrl: ""
  },

  onShow() {
    const currentUser = store.getCurrentUser();
    const isLoggedIn = !!(currentUser && currentUser.name && store.getToken());
    if (isLoggedIn) {
      this.setData({
        isLoggedIn: true,
        buttonText: `继续使用 ${currentUser.name}`,
        statusText: "已授权，可继续上报",
        welcomeText: `${currentUser.name}，欢迎回来。发现现场隐患后，直接进入下一步继续上报。`
      });
    } else {
      this.setData({
        isLoggedIn: false,
        buttonText: "授权昵称头像 · 一键登录",
        statusText: "待授权进入",
        welcomeText: "面向施工现场的一线安全直报入口，发现隐患后可立即拍照、选择标段并提交后台处理。"
      });
    }
  },

  handleAuthTap() {
    if (this.data.loading) {
      return;
    }

    // 已登录：直接跳转，不重复弹授权弹窗
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

    this.setData({ showNicknameModal: false, loading: true, buttonText: "登录中..." });
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
            const currentUser = store.getCurrentUser();
            this.setData({
              loading: false,
              buttonText: currentUser && currentUser.name
                ? `继续使用 ${currentUser.name}`
                : "授权昵称头像 · 一键登录"
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
    this.setData({ loading: false, buttonText: "授权昵称头像 · 一键登录" });
  }
});
