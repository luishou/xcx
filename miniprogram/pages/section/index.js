const store = require("../../utils/report-store");

Page({
  data: {
    sections: store.SECTIONS,
    selectedSection: ""
  },

  onShow() {
    const currentUser = store.getCurrentUser();
    if (!currentUser) {
      wx.redirectTo({
        url: "/pages/index/index"
      });
      return;
    }

    this.syncSections(store.getCurrentSection());
  },

  handleSectionTap(event) {
    const { code } = event.currentTarget.dataset;
    store.setCurrentSection(code);
    this.syncSections(code);

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

  syncSections(selectedSection) {
    const sections = store.SECTIONS.map((item) => ({
      ...item,
      activeClass: item.code === selectedSection ? "section-item-active" : "",
      stateText: item.code === selectedSection ? "当前已选" : "点击进入上报"
    }));

    this.setData({
      selectedSection,
      sections
    });
  }
});
