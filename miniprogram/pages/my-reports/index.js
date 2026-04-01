const store = require("../../utils/report-store");
const api = require("../../utils/api");

const STATUS_MAP = {
  待处理: { label: "待处理", cls: "tag-pending" },
  处理中: { label: "处理中", cls: "tag-processing" },
  已完成: { label: "已完成", cls: "tag-done" }
};

Page({
  data: {
    currentUser: null,
    records: [],
    loading: true,
    empty: false,
    needLogin: false
  },

  onShow() {
    const currentUser = store.getCurrentUser();
    const token = store.getToken();

    if (!currentUser || !token) {
      this.setData({ needLogin: true, loading: false });
      return;
    }

    this.setData({ needLogin: false, currentUser });
    this.loadRecords();
  },

  handleGoLogin() {
    wx.navigateBack({ delta: 1 });
  },

  loadRecords() {
    this.setData({ loading: true, empty: false });

    api.request({ url: "/api/reports/mine", method: "GET", auth: true })
      .then((res) => {
        const records = (res.records || []).map((r) => {
          const st = STATUS_MAP[r.status] || { label: r.status, cls: "tag-pending" };
          return {
            ...r,
            statusLabel: st.label,
            statusCls: st.cls,
            firstImage: Array.isArray(r.images) && r.images.length ? r.images[0] : "",
            imageCount: Array.isArray(r.images) ? r.images.length : 0
          };
        });
        this.setData({ records, empty: records.length === 0 });
      })
      .catch(() => {
        wx.showToast({ title: "加载失败，请重试", icon: "none" });
      })
      .finally(() => {
        this.setData({ loading: false });
      });
  },

  handlePreviewImages(e) {
    const images = e.currentTarget.dataset.images;
    if (!images || !images.length) return;
    wx.previewImage({ current: images[0], urls: images });
  },

  handleBack() {
    wx.navigateBack({ delta: 1 });
  }
});
