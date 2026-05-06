const store = require("../../utils/report-store");
const api = require("../../utils/api");

Page({
  data: {
    sections: store.SECTIONS,
    selectedSection: "",
    mode: "report", // report | admin
    canManage: false,
    manageSections: []
  },

  onShow() {
    const currentUser = store.getCurrentUser();
    if (!currentUser) {
      wx.redirectTo({
        url: "/pages/index/index"
      });
      return;
    }

    this.refreshManageSections();
  },

  handleModeChange(event) {
    const { mode } = event.currentTarget.dataset;
    if (!mode || mode === this.data.mode) return;
    if (mode === "admin" && !this.data.canManage) {
      wx.showToast({ title: "暂无标段管理权限", icon: "none" });
      return;
    }
    this.syncSections(this.data.selectedSection, mode);
  },

  handleSectionTap(event) {
    const { code } = event.currentTarget.dataset;
    const { mode, manageSections } = this.data;

    if (mode === "admin") {
      if (!manageSections.includes(code)) {
        wx.showToast({ title: "暂无该标段管理权限", icon: "none" });
        return;
      }
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
    const manageSections = this.data.manageSections || [];
    const baseSections = isAdmin
      ? store.SECTIONS.filter((item) => manageSections.includes(item.code))
      : store.SECTIONS;
    const sections = baseSections.map((item) => ({
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
  },

  refreshManageSections() {
    const localManageSections = store.getManageSections();

    api
      .adminFetchMySections()
      .then((result) => {
        const remoteSections = Array.isArray(result && result.sections) ? result.sections : [];
        const currentUser = store.getCurrentUser() || {};
        store.setCurrentUser({
          ...currentUser,
          manageSections: remoteSections
        });
        this.applyManageSections(remoteSections);
      })
      .catch((error) => {
        console.warn("[section-page] adminFetchMySections failed, fallback local cache", error);
        this.applyManageSections(localManageSections);
      });
  },

  applyManageSections(manageSections) {
    const canManage = manageSections.length > 0;
    const nextMode = canManage ? this.data.mode : "report";
    this.setData({ canManage, manageSections });
    this.syncSections(store.getCurrentSection(), nextMode);
  }
});
