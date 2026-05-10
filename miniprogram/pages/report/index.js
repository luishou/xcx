const store = require("../../utils/report-store");
const api = require("../../utils/api");

const GUEST_USER = {
  name: "工友",
  avatarUrl: ""
};

Page({
  data: {
    currentUser: GUEST_USER,
    selectedSection: "未选择标段",
    images: [],
    hasImages: false,
    canAddMoreImages: true,
    description: "",
    descriptionLength: 0,
    descriptionCountClass: "",
    submitDisabled: true,
    submitText: "请上传至少 1 张照片",
    showSuccess: false,
    submitting: false,
    showLoginModal: false
  },

  onShow() {
    const selectedSection = store.getCurrentSection();

    if (!selectedSection) {
      wx.redirectTo({
        url: "/pages/section/index"
      });
      return;
    }

    const loggedIn = store.isLoggedIn();
    const storedUser = store.getCurrentUser();
    const currentUser = loggedIn && storedUser ? storedUser : GUEST_USER;

    this.setData({
      currentUser,
      selectedSection
    });
    this.syncSubmitState();
  },

  handleSwitchSection() {
    wx.redirectTo({
      url: "/pages/section/index"
    });
  },

  handleChooseImage() {
    const remain = 3 - this.data.images.length;
    if (remain <= 0) {
      return;
    }

    wx.chooseMedia({
      count: remain,
      mediaType: ["image"],
      sizeType: ["compressed"],
      sourceType: ["album", "camera"],
      success: (res) => {
        const nextImages = res.tempFiles.map((item) => item.tempFilePath);
        this.setData({
          images: this.data.images.concat(nextImages).slice(0, 3)
        });
        this.syncSubmitState();
      }
    });
  },

  handleDeleteImage(event) {
    const { index } = event.currentTarget.dataset;
    const images = this.data.images.slice();
    images.splice(index, 1);
    this.setData({ images });
    this.syncSubmitState();
  },

  handleDescriptionInput(event) {
    const value = event.detail.value || "";
    this.setData({
      description: value,
      descriptionLength: value.length,
      descriptionCountClass: value.length >= 25 ? "desc-count-warn" : ""
    });
  },

  handleSubmit() {
    if (this.data.submitDisabled || this.data.submitting) {
      return;
    }

    if (!store.isLoggedIn()) {
      this.setData({ showLoginModal: true });
      return;
    }

    this.runSubmitFlow();
  },

  onLoginCancel() {
    this.setData({ showLoginModal: false });
  },

  onLoginConfirm(e) {
    const { userInfo } = e.detail;
    if (!userInfo) {
      return;
    }

    this.setData({ showLoginModal: false });

    api
      .loginWithWeChat(userInfo)
      .then((user) => {
        this.setData({ currentUser: user });
        wx.showToast({ title: "授权成功", icon: "success" });
        this.runSubmitFlow();
      })
      .catch((err) => {
        wx.showToast({
          title: (err && err.message) || "登录失败",
          icon: "none"
        });
      });
  },

  runSubmitFlow() {
    if (this.data.submitDisabled || this.data.submitting) {
      return;
    }

    this.setData({
      submitting: true,
      submitDisabled: true,
      submitText: "上传中..."
    });

    this.submitReport()
      .then(() => {
        this.setData({
          showSuccess: true
        });
      })
      .catch((error) => {
        const msg = error && error.message;
        if (/登录/.test(msg || "")) {
          store.clearSession();
          this.setData({
            currentUser: GUEST_USER,
            showLoginModal: true
          });
          return;
        }
        wx.showToast({
          title: msg || "提交失败",
          icon: "none"
        });
      })
      .finally(() => {
        this.setData({
          submitting: false
        });
        this.syncSubmitState();
      });
  },

  handleViewMyReports() {
    this.setData({ showSuccess: false });
    wx.navigateTo({ url: "/pages/my-reports/index" });
  },

  handleCloseSuccess() {
    this.setData({
      images: [],
      hasImages: false,
      canAddMoreImages: true,
      description: "",
      descriptionLength: 0,
      descriptionCountClass: "",
      showSuccess: false
    });
    this.syncSubmitState();
    wx.pageScrollTo({ scrollTop: 0, duration: 240 });
  },

  syncSubmitState() {
    const hasSection = Boolean(this.data.selectedSection);
    const hasImages = this.data.images.length > 0;

    let submitText = "请上传至少 1 张照片";
    if (!hasSection) {
      submitText = "请先选择标段后上报";
    } else if (hasImages) {
      submitText = "提交隐患上报";
    }

    this.setData({
      hasImages,
      canAddMoreImages: this.data.images.length < 3,
      submitDisabled: this.data.submitting || !(hasSection && hasImages),
      submitText
    });
  },

  async submitReport() {
    const uploadedImages = [];
    for (const imagePath of this.data.images) {
      const uploadResult = await api.uploadFile(imagePath);
      uploadedImages.push(uploadResult.url);
    }

    await api.request({
      url: "/api/reports",
      method: "POST",
      auth: true,
      data: {
        section: this.data.selectedSection,
        description: this.data.description.trim(),
        images: uploadedImages
      }
    });
  }
});
