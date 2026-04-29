const store = require("../../utils/report-store");

Page({
  data: {
    sections: store.SECTIONS,
    selectedSection: "",
    mode: "report" // report | admin
  },

  onShow() {
    const currentUser = store.getCurrentUser();
    if (!currentUser) {
      wx.redirectTo({
        url: "/pages/index/index"
      });
      return;
    }

    this.syncSections(store.getCurrentSection(), this.data.mode);
  },

  handleModeChange(event) {
    const { mode } = event.currentTarget.dataset;
    if (!mode || mode === this.data.mode) return;
    this.syncSections(this.data.selectedSection, mode);
  },

  handleSectionTap(event) {
    const { code } = event.currentTarget.dataset;
    const { mode } = this.data;

    if (mode === "admin") {
      this.syncSections(code, mode);
      wx.navigateTo({
        url: `/pages/admin/index?section=${code}`
      });
      return;
    }

    store.setCurrentSection(code);
    this.syncSections(code, mode);

    wx.showToast({
      title: `${code} 已选择`,
      icon: "none"
    });

    setTimeout(() => {
      wx.redirectTo({
        url: "/pages/report/index"
      });
    }, 180);
  },

  syncSections(selectedSection, mode) {
    const nextMode = mode || this.data.mode || "report";
    const isAdmin = nextMode === "admin";
    const sections = store.SECTIONS.map((item) => ({
      ...item,
      activeClass: !isAdmin && item.code === selectedSection ? "section-item-active" : "",
      stateText: isAdmin
        ? "点击进入管理后台"
        : item.code === selectedSection
        ? "当前已选"
        : "点击进入上报"
    }));

    this.setData({
      mode: nextMode,
      selectedSection,
      sections
    });
  }
});
