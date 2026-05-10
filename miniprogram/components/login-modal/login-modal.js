Component({
  properties: {
    visible: {
      type: Boolean,
      value: false
    },
    title: {
      type: String,
      value: "完善个人信息"
    },
    subtitle: {
      type: String,
      value: "填写昵称和头像后即可继续"
    }
  },

  data: {
    tempNickname: "",
    tempAvatarUrl: ""
  },

  observers: {
    visible(val) {
      if (val) {
        this.setData({ tempNickname: "", tempAvatarUrl: "" });
      }
    }
  },

  methods: {
    chooseAvatar(e) {
      this.setData({ tempAvatarUrl: e.detail.avatarUrl });
    },

    onNicknameInput(e) {
      this.setData({ tempNickname: e.detail.value });
    },

    onConfirm() {
      const { tempNickname, tempAvatarUrl } = this.data;
      if (!tempNickname || !tempNickname.trim()) {
        wx.showToast({ title: "请输入昵称", icon: "none" });
        return;
      }
      this.triggerEvent("confirm", {
        userInfo: {
          nickName: tempNickname.trim(),
          avatarUrl: tempAvatarUrl || ""
        }
      });
    },

    onCancel() {
      this.triggerEvent("cancel");
    }
  }
});
