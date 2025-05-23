Page({
    data: {
      noiseLevel: 50,
      showPopup: false,
      bannerImage: '../../assets/banner.jpg',
      processingImage: false
    },
  
    onLoad() {
      // 检查用户登录状态
      this.checkUserAuth();
    },
  
    checkUserAuth() {
      wx.getSetting({
        success: (res) => {
          if (!res.authSetting['scope.userInfo']) {
            wx.authorize({
              scope: 'scope.userInfo',
              success: () => {
                this.getUserInfo();
              }
            });
          } else {
            this.getUserInfo();
          }
        }
      });
    },
  
    getUserInfo() {
      wx.getUserInfo({
        success: (res) => {
          getApp().globalData.userInfo = res.userInfo;
        }
      });
    },
  
    onSelectImage() {
      this.setData({
        showPopup: true
      });
    },
  
    closePopup() {
      this.setData({
        showPopup: false
      });
    },
  
    takePhoto() {
      this.setData({ showPopup: false });
      wx.chooseMedia({
        count: 1,
        sourceType: ['camera'],
        mediaType: ['image'],
        success: this.handleImageSuccess,
        fail: this.handleImageFail
      });
    },
  
    chooseFromAlbum() {
      this.setData({ showPopup: false });
      wx.chooseMedia({
        count: 9,
        sourceType: ['album'],
        mediaType: ['image'],
        success: this.handleImageSuccess,
        fail: this.handleImageFail
      });
    },
  
    chooseFromWeChat() {
      this.setData({ showPopup: false });
      wx.chooseMessageFile({
        count: 9,
        type: 'image',
        success: this.handleImageSuccess,
        fail: this.handleImageFail
      });
    },
  
    handleImageSuccess(res) {
      const tempFiles = res.tempFiles || res.tempFilePaths.map(path => ({ tempFilePath: path }));
      if (tempFiles.length === 0) return;
  
      this.setData({ processingImage: true });
      
      // 处理单张图片
      if (tempFiles.length === 1) {
        this.processSingleImage(tempFiles[0].tempFilePath);
      } else {
        // 处理多张图片
        this.processMultipleImages(tempFiles);
      }
    },
  
    processSingleImage(tempFilePath) {
      const noiseLevel = this.data.noiseLevel / 100;
      wx.navigateTo({
        url: `/pages/advanced/process?path=${encodeURIComponent(tempFilePath)}&noise=${noiseLevel}`
      });
    },
  
    processMultipleImages(tempFiles) {
      wx.navigateTo({
        url: '/pages/advanced/batch',
        success: (res) => {
          res.eventChannel.emit('acceptImages', { 
            images: tempFiles.map(f => f.tempFilePath),
            noiseLevel: this.data.noiseLevel / 100
          });
        }
      });
    },
  
    handleImageFail(err) {
      console.error('选择图片失败：', err);
      wx.showToast({
        title: '选择图片失败',
        icon: 'none'
      });
    },
  
    onSliderChange(e) {
      this.setData({
        noiseLevel: e.detail.value
      });
    }
  });
  