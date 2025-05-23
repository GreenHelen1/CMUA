// pages/profile/profile.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    userInfo: null,
    hasUserInfo: false,
    canIUseGetUserProfile: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    if (wx.getUserProfile) {
      this.setData({
        canIUseGetUserProfile: true
      });
    }
    this.getUserProfile();
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  },

  getUserProfile() {
    wx.getUserProfile({
      desc: '用于完善用户资料',
      success: (res) => {
        const app = getApp();
        if (app && app.globalData) {
          app.globalData.userInfo = res.userInfo;
          app.globalData.hasUserInfo = true;
          this.setData({
            userInfo: res.userInfo,
            hasUserInfo: true
          });
        }
      },
      fail: (err) => {
        console.error('获取用户信息失败：', err);
      }
    });
  },

  // 联系客服
  contactService() {
    wx.showModal({
      title: '联系客服',
      content: '客服电话：xxx-xxxx-xxxx\n工作时间：周一至周五 9:00-18:00',
      showCancel: false
    });
  },

  // 使用帮助
  showHelp() {
    wx.showModal({
      title: '使用帮助',
      content: '1. 首页：上传单张图片进行处理\n2. 图片：查看历史处理图片\n3. 高级：批量处理图片并查看评估结果\n4. 我的：个人信息和设置',
      showCancel: false
    });
  },

  // 注销账户
  deleteAccount() {
    wx.showModal({
      title: '注销账户',
      content: '注销后，您的所有数据将被永久删除，是否继续？',
      success: (res) => {
        if (res.confirm) {
          // 清除用户数据
          wx.clearStorageSync();
          const app = getApp();
          if (app && app.globalData) {
            app.globalData.userInfo = null;
            app.globalData.hasUserInfo = false;
          }
          this.setData({
            userInfo: null,
            hasUserInfo: false
          });
          wx.showToast({
            title: '账户已注销',
            icon: 'success'
          });
        }
      }
    });
  },

  // 退出登录
  logout() {
    wx.showModal({
      title: '退出登录',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          const app = getApp();
          if (app && app.globalData) {
            app.globalData.userInfo = null;
            app.globalData.hasUserInfo = false;
          }
          this.setData({
            userInfo: null,
            hasUserInfo: false
          });
          wx.showToast({
            title: '已退出登录',
            icon: 'success'
          });
        }
      }
    });
  }
})