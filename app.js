App({
  globalData: {
    userInfo: null,
    hasUserInfo: false,
    canIUseGetUserProfile: false,
    imageProcessor: null
  },
  onLaunch() {
    if (wx.getUserProfile) {
      this.globalData.canIUseGetUserProfile = true
    }
  }
}) 