// pages/advanced/process.js
const imageProcessor = require('../../utils/imageProcessor');

Page({
  data: {
    imagePath: '',
    processedImagePath: '',
    noiseLevel: 0.5,
    processing: false
  },

  onLoad(options) {
    console.log('process页面接收到的参数：', options);
    
    // 获取事件通道
    const eventChannel = this.getOpenerEventChannel();
    
    // 监听备用方案传递的路径
    eventChannel.on('acceptImagePath', (data) => {
      console.log('通过事件通道接收到的路径：', data);
      this.setData({
        imagePath: data.fullPath,
        noiseLevel: data.noiseLevel || 0.5
      });
    });

    // 处理URL参数
    if (options.path) {
      let imagePath = decodeURIComponent(options.path);
      // 如果是相对路径，尝试转换为完整路径
      if (!imagePath.startsWith('wxfile://') && !imagePath.startsWith('http://')) {
        imagePath = `wxfile://${imagePath}`;
      }
      
      this.setData({
        imagePath: imagePath,
        noiseLevel: parseFloat(options.noise) || 0.5
      });
    }
  },

  onUnload() {
    // 清理资源
    if (this.data.processedImagePath) {
      wx.removeSavedFile({
        filePath: this.data.processedImagePath
      });
    }
  },

  // 处理图片
  async onProcessImage() {
    if (this.data.processing) return;

    this.setData({ processing: true });

    try {
      // 获取图片数据
      const imageData = await imageProcessor.createImageData(this.data.imagePath);
      
      // 添加水印
      const watermarkedImage = await imageProcessor.addWatermark(imageData, this.data.noiseLevel);
      
      // 将处理后的图片保存到临时文件
      const tempFilePath = await this.saveImageToTemp(watermarkedImage);
      
      // 更新状态
      this.setData({
        processedImagePath: tempFilePath,
        processing: false
      });

      // 保存到最近图片列表
      const recentImages = wx.getStorageSync('recentImages') || [];
      const newImage = {
        path: tempFilePath,
        date: new Date().toLocaleString()
      };
      wx.setStorageSync('recentImages', [newImage].concat(recentImages));

      wx.showToast({
        title: '处理完成',
        icon: 'success'
      });
    } catch (err) {
      console.error('处理图片失败：', err);
      this.setData({ processing: false });
      wx.showToast({
        title: '处理失败',
        icon: 'none'
      });
    }
  },

  // 保存图片到临时文件
  saveImageToTemp(imageData) {
    return new Promise((resolve, reject) => {
      const canvas = wx.createOffscreenCanvas({
        type: '2d',
        width: imageData.width,
        height: imageData.height
      });
      const ctx = canvas.getContext('2d');
      ctx.putImageData(imageData, 0, 0);
      
      wx.canvasToTempFilePath({
        canvas,
        success: (res) => resolve(res.tempFilePath),
        fail: reject
      });
    });
  },

  // 调整噪声强度
  onNoiseChange(e) {
    this.setData({
      noiseLevel: e.detail.value / 100
    });
  },

  // 保存到相册
  async onSaveToAlbum() {
    if (!this.data.processedImagePath) return;

    try {
      await wx.saveImageToPhotosAlbum({
        filePath: this.data.processedImagePath
      });
      
      wx.showToast({
        title: '保存成功',
        icon: 'success'
      });
    } catch (err) {
      console.error('保存图片失败：', err);
      wx.showToast({
        title: '保存失败',
        icon: 'none'
      });
    }
  },

  // 分享图片
  onShareImage() {
    if (!this.data.processedImagePath) return;

    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
  },

  // 分享给朋友
  onShareAppMessage() {
    return {
      title: '对抗性水印处理',
      path: '/pages/home/home',
      imageUrl: this.data.processedImagePath
    };
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: '对抗性水印处理',
      query: '',
      imageUrl: this.data.processedImagePath
    };
  }
}); 