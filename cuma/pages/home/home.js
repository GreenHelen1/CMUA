Page({
    data: {
      noiseLevel: 50,
      showPopup: false,
      bannerImage: '/cuma/assets/banner.jpg',
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
      const app = getApp();
      if (!app) {
        console.error('获取应用实例失败');
        return;
      }
      
      wx.getUserInfo({
        success: (res) => {
          if (app.globalData) {
            app.globalData.userInfo = res.userInfo;
            app.globalData.hasUserInfo = true;
          } else {
            console.error('globalData 未定义');
          }
        },
        fail: (err) => {
          console.error('获取用户信息失败：', err);
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
      
      // 保存图片到最近图片列表
      const recentImages = wx.getStorageSync('recentImages') || [];
      const newImages = tempFiles.map(file => ({
        path: file.tempFilePath,
        date: new Date().toLocaleString()
      }));
      
      wx.setStorageSync('recentImages', newImages.concat(recentImages));
      
      // 处理单张图片
      if (tempFiles.length === 1) {
        // 确保使用正确的临时文件路径
        const tempFilePath = tempFiles[0].tempFilePath;
        // 将 http://tmp/ 转换为 wxfile://
        const processedPath = tempFilePath.replace('http://tmp/', 'wxfile://');
        this.processSingleImage(processedPath);
      } else {
        // 处理多张图片
        const processedFiles = tempFiles.map(file => ({
          ...file,
          tempFilePath: file.tempFilePath.replace('http://tmp/', 'wxfile://')
        }));
        this.processMultipleImages(processedFiles);
      }
    },
  
    processSingleImage(tempFilePath) {
      const noiseLevel = this.data.noiseLevel / 100;
      
      // 重置处理状态
      this.setData({ processingImage: false });
      wx.setStorageSync('processingImagePath', tempFilePath);
      wx.setStorageSync('processingNoiseLevel', noiseLevel);
      // 使用与app.json中完全匹配的路径
      const url = 'cuma/pages/advanced/process';  // 移除开头的斜杠
      const params = {
        path: tempFilePath,
        noise: noiseLevel
      };
      
      console.log('准备跳转，原始路径：', tempFilePath);
      
      // 将参数转换为查询字符串
      const query = Object.keys(params)
        .map(key => {
          if (key === 'path') {
            return `${key}=${encodeURIComponent(params[key])}`;
          }
          return `${key}=${params[key]}`;
        })
        .join('&');
      
      const fullUrl = `${url}?${query}`;
      console.log('完整跳转URL：', fullUrl);
      
      wx.navigateTo({
        url: fullUrl,
        success: (res) => {
          console.log('跳转成功，参数：', params);
        },
        fail: (err) => {
          console.error('页面跳转失败：', err);
          console.error('跳转URL：', fullUrl);
          // 尝试使用备用方案
          this.tryAlternativeNavigation(tempFilePath, noiseLevel);
        }
      });
    },
  
    // 备用导航方案
    tryAlternativeNavigation(tempFilePath, noiseLevel) {
      // 使用与app.json中完全匹配的路径
      const url = 'cuma/pages/advanced/process';  // 移除开头的斜杠
      const relativePath = tempFilePath.split('/').pop();
      const fullUrl = `${url}?path=${relativePath}&noise=${noiseLevel}`;
      
      console.log('尝试备用导航方案，URL：', fullUrl);
      
      wx.navigateTo({
        url: fullUrl,
        success: (res) => {
          console.log('备用方案跳转成功');
          res.eventChannel.emit('acceptImagePath', { 
            fullPath: tempFilePath,
            noiseLevel: noiseLevel
          });
        },
        fail: (err) => {
          console.error('备用方案也失败：', err);
          wx.showToast({
            title: '页面跳转失败',
            icon: 'none'
          });
        }
      });
    },
  
    processMultipleImages(tempFiles) {
      // 重置处理状态
      this.setData({ processingImage: false });
      
      // 使用更简单的方式构建URL
      const url = '/pages/advanced/batch';
      
      wx.navigateTo({
        url: url,
        success: (res) => {
          console.log('跳转成功，准备传递图片数据');
          res.eventChannel.emit('acceptImages', { 
            images: tempFiles.map(f => f.tempFilePath),
            noiseLevel: this.data.noiseLevel / 100
          });
        },
        fail: (err) => {
          console.error('页面跳转失败：', err);
          console.error('跳转URL：', url);
          wx.showToast({
            title: '页面跳转失败',
            icon: 'none'
          });
        }
      });
    },
  
    handleImageFail(err) {
      console.error('选择图片失败：', err);
      // 重置处理状态
      this.setData({ processingImage: false });
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
  