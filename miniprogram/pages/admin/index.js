const api = require("../../utils/api");

const STATUS_OPTIONS = ["待处理", "处理中", "已完成"];

Page({
  data: {
    section: "",
    loading: false,
    errorMessage: "",
    activeTab: "records", // records | stats
    records: [],
    displayRecords: [],
    stats: {
      total: 0,
      thisWeek: 0,
      pending: 0,
      inProgress: 0,
      done: 0
    },
    statusDistribution: [],
    detailVisible: false,
    detailRecord: null,
    detailStatusIndex: 0,
    detailSaving: false,
    statusOptions: STATUS_OPTIONS
  },

  onLoad(query) {
    const section = (query && query.section) || "";
    if (!section) {
      wx.showToast({ title: "未指定标段", icon: "none" });
      setTimeout(() => wx.navigateBack(), 600);
      return;
    }

    wx.setNavigationBarTitle({ title: `${section} 管理后台` });
    this.setData({ section });
    this.loadData();
  },

  onPullDownRefresh() {
    this.loadData().finally(() => wx.stopPullDownRefresh());
  },

  switchTab(event) {
    const { tab } = event.currentTarget.dataset;
    if (!tab || tab === this.data.activeTab) return;
    this.setData({ activeTab: tab });
  },

  handleRefresh() {
    this.loadData();
  },

  async loadData() {
    const { section } = this.data;
    if (!section) return;

    this.setData({ loading: true, errorMessage: "" });

    try {
      const [recordsRes, statsRes] = await Promise.all([
        api.adminFetchRecords(section),
        api.adminFetchStats(section)
      ]);

      const records = (recordsRes && recordsRes.records) || [];
      const stats = (statsRes && statsRes.stats) || this.data.stats;
      this.applyRecordsAndStats(records, stats);
    } catch (error) {
      this.setData({
        errorMessage: (error && error.message) || "加载失败，请稍后重试"
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  applyRecordsAndStats(records, stats) {
    const displayRecords = records.map((r) => this.decorateRecord(r));
    const statusDistribution = this.buildStatusDistribution(stats);
    this.setData({
      records,
      displayRecords,
      stats,
      statusDistribution
    });
  },

  decorateRecord(record) {
    const images = Array.isArray(record.images) ? record.images : [];
    const thumbs = images.slice(0, 2);
    const moreCount = Math.max(images.length - 2, 0);
    const statusClass = record.status === "待处理"
      ? "pending"
      : record.status === "处理中"
      ? "progress"
      : "done";

    return {
      ...record,
      images,
      thumbs,
      moreCount,
      shortId: String(record.id).slice(-6),
      statusClass,
      descriptionText: record.description || "（无文字描述）",
      descriptionEmpty: !record.description
    };
  },

  buildStatusDistribution(stats) {
    const items = [
      { key: "pending", label: "待处理", count: stats.pending || 0, color: "#FF6B00" },
      { key: "inProgress", label: "处理中", count: stats.inProgress || 0, color: "#1677ff" },
      { key: "done", label: "已完成", count: stats.done || 0, color: "#07c160" }
    ];
    const maxCount = Math.max(items[0].count, items[1].count, items[2].count, 1);
    return items.map((item) => ({
      ...item,
      percent: item.count > 0 ? Math.round((item.count / maxCount) * 100) : 0
    }));
  },

  previewThumb(event) {
    const { src, images } = event.currentTarget.dataset;
    if (!src) return;
    wx.previewImage({
      current: src,
      urls: Array.isArray(images) && images.length ? images : [src]
    });
  },

  openDetail(event) {
    const { id } = event.currentTarget.dataset;
    const record = this.data.records.find((item) => item.id === id);
    if (!record) return;

    const statusIndex = Math.max(STATUS_OPTIONS.indexOf(record.status), 0);

    this.setData({
      detailVisible: true,
      detailRecord: this.decorateRecord(record),
      detailStatusIndex: statusIndex,
      detailSaving: false
    });
  },

  closeDetail() {
    if (this.data.detailSaving) return;
    this.setData({
      detailVisible: false,
      detailRecord: null,
      detailStatusIndex: 0
    });
  },

  noop() {},

  onStatusChange(event) {
    const index = Number(event.detail.value);
    this.setData({ detailStatusIndex: index });
  },

  async saveDetailStatus() {
    const { detailRecord, detailStatusIndex } = this.data;
    if (!detailRecord) return;

    const newStatus = STATUS_OPTIONS[detailStatusIndex];
    if (newStatus === detailRecord.status) {
      this.closeDetail();
      return;
    }

    this.setData({ detailSaving: true });

    try {
      await api.adminUpdateStatus(detailRecord.id, newStatus);

      const records = this.data.records.map((item) =>
        item.id === detailRecord.id ? { ...item, status: newStatus } : item
      );
      const stats = this.recomputeStats(records);
      this.applyRecordsAndStats(records, stats);

      this.setData({
        detailVisible: false,
        detailRecord: null,
        detailSaving: false
      });

      wx.showToast({ title: "状态已更新", icon: "success" });
    } catch (error) {
      this.setData({ detailSaving: false });
      wx.showToast({
        title: (error && error.message) || "状态更新失败",
        icon: "none"
      });
    }
  },

  recomputeStats(records) {
    const weekAgo = Date.now() - 7 * 24 * 3600 * 1000;
    const stats = {
      total: records.length,
      thisWeek: 0,
      pending: 0,
      inProgress: 0,
      done: 0
    };

    records.forEach((record) => {
      const t = new Date(String(record.time).replace(/-/g, "/")).getTime();
      if (!isNaN(t) && t >= weekAgo) stats.thisWeek += 1;
      if (record.status === "待处理") stats.pending += 1;
      else if (record.status === "处理中") stats.inProgress += 1;
      else if (record.status === "已完成") stats.done += 1;
    });

    return stats;
  },

  previewDetailImage(event) {
    const { src } = event.currentTarget.dataset;
    const images = (this.data.detailRecord && this.data.detailRecord.images) || [];
    wx.previewImage({
      current: src,
      urls: images.length ? images : [src]
    });
  }
});
