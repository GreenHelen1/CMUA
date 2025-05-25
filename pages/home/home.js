Page({
  data: {
    noiseLevel: 50,  // 默认噪声级别
    processingImage: false,  // 图片处理状态
    recentImages: [],  // 最近处理的图片
    maxRecentImages: 10,  // 最大保存数量
    bannerImage: '/images/banner.jpg',  // banner图片
    showPopup: false  // 控制图片选择弹窗显示
  },

  onLoad() {
    // 加载最近处理的图片
    const recentImages = wx.getStorageSync('recentImages') || [];
    this.setData({ recentImages });
  },

  // 打开图片选择弹窗
  onSelectImage() {
    this.setData({ showPopup: true });
  },

  // 关闭弹窗
  closePopup() {
    this.setData({ showPopup: false });
  },

  // 拍照
  takePhoto() {
    this.closePopup();
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['camera'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        this.processSingleImage(tempFilePath);
      },
      fail: (err) => {
        console.error('拍照失败：', err);
        wx.showToast({
          title: '拍照失败',
          icon: 'none'
        });
      }
    });
  },

  // 从相册选择
  chooseFromAlbum() {
    this.closePopup();
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        this.processSingleImage(tempFilePath);
      },
      fail: (err) => {
        console.error('选择图片失败：', err);
        wx.showToast({
          title: '选择图片失败',
          icon: 'none'
        });
      }
    });
  },

  // 从微信选择
  chooseFromWeChat() {
    this.closePopup();
    wx.chooseMessageFile({
      count: 1,
      type: 'image',
      success: (res) => {
        const tempFilePath = res.tempFiles[0].path;
        this.processSingleImage(tempFilePath);
      },
      fail: (err) => {
        console.error('选择图片失败：', err);
        wx.showToast({
          title: '选择图片失败',
          icon: 'none'
        });
      }
    });
  },

  // 滑块值变化
  onSliderChange(e) {
    this.setData({
      noiseLevel: e.detail.value
    });
  },

  // 处理单张图片
  processSingleImage(tempFilePath) {
    console.log('=== processSingleImage 开始 ===');
    console.log('输入参数：', { tempFilePath });
    
    const noiseLevel = this.data.noiseLevel / 100;
    console.log('噪声级别：', noiseLevel);
    
    // 设置处理状态
    this.setData({ processingImage: true });
    
    // 保存处理参数到全局存储
    console.log('保存处理参数到全局存储');
    wx.setStorageSync('processingImagePath', tempFilePath);
    wx.setStorageSync('processingNoiseLevel', noiseLevel);
    
    // 使用相对路径
    const url = '../advanced/process';
    console.log('基础URL：', url);
    
    const params = {
      path: tempFilePath,
      noise: noiseLevel
    };
    console.log('URL参数：', params);
    
    // 构建查询字符串
    const query = Object.keys(params)
      .map(key => {
        const value = key === 'path' ? encodeURIComponent(params[key]) : params[key];
        console.log(`参数 ${key} 编码后：`, value);
        return `${key}=${value}`;
      })
      .join('&');
    
    const fullUrl = `${url}?${query}`;
    console.log('最终跳转URL：', fullUrl);
    
    // 尝试跳转
    console.log('开始页面跳转...');
    wx.navigateTo({
      url: fullUrl,
      success: (res) => {
        console.log('跳转成功，返回数据：', res);
        // 更新最近处理的图片列表
        this.updateRecentImages(tempFilePath);
        // 重置处理状态
        this.setData({ processingImage: false });
      },
      fail: (err) => {
        console.error('跳转失败，错误详情：', err);
        console.error('失败时的URL：', fullUrl);
        console.log('尝试备用方案...');
        this.tryAlternativeNavigation(tempFilePath, noiseLevel);
      }
    });
  },

  // 更新最近处理的图片列表
  updateRecentImages(newImagePath) {
    let recentImages = wx.getStorageSync('recentImages') || [];
    // 如果图片已存在，先移除
    recentImages = recentImages.filter(path => path !== newImagePath);
    // 添加到开头
    recentImages.unshift(newImagePath);
    // 保持最大数量
    if (recentImages.length > this.data.maxRecentImages) {
      recentImages = recentImages.slice(0, this.data.maxRecentImages);
    }
    // 更新存储和状态
    wx.setStorageSync('recentImages', recentImages);
    this.setData({ recentImages });
  },
  
  tryAlternativeNavigation(tempFilePath, noiseLevel) {
    console.log('=== tryAlternativeNavigation 开始 ===');
    console.log('输入参数：', { tempFilePath, noiseLevel });
    
    // 使用相对路径
    const url = '../advanced/process';
    console.log('备用方案基础URL：', url);
    
    // 使用事件通道传递完整路径
    console.log('准备使用事件通道传递数据');
    const fullUrl = url;
    console.log('备用方案最终URL：', fullUrl);
    
    wx.navigateTo({
      url: fullUrl,
      success: (res) => {
        console.log('备用方案跳转成功，准备传递数据');
        res.eventChannel.emit('acceptImagePath', { 
          fullPath: tempFilePath,
          noiseLevel: noiseLevel
        });
        console.log('数据传递完成');
        // 更新最近处理的图片列表
        this.updateRecentImages(tempFilePath);
        // 重置处理状态
        this.setData({ processingImage: false });
      },
      fail: (err) => {
        console.error('备用方案也失败，错误详情：', err);
        console.error('失败时的URL：', fullUrl);
        wx.showToast({
          title: '页面跳转失败',
          icon: 'none'
        });
        // 重置处理状态
        this.setData({ processingImage: false });
      }
    });
  },

  // 预览图片
  previewImage(e) {
    const { url } = e.currentTarget.dataset;
    wx.previewImage({
      current: url,
      urls: this.data.recentImages
    });
  },

  // 删除最近图片
  deleteRecentImage(e) {
    const { index } = e.currentTarget.dataset;
    let recentImages = [...this.data.recentImages];
    recentImages.splice(index, 1);
    wx.setStorageSync('recentImages', recentImages);
    this.setData({ recentImages });
  }
}); 