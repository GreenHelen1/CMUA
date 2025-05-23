const imageProcessor = require('../../utils/imageProcessor');

Page({
  data: {
    images: [],
    processedImages: [],
    noiseLevel: 0.5,
    processing: false,
    currentIndex: 0,
    totalImages: 0
  },

  onLoad() {
    const eventChannel = this.getOpenerEventChannel();
    eventChannel.on('acceptImages', (data) => {
      this.setData({
        images: data.images.map(path => ({ path, status: 'pending' })),
        noiseLevel: data.noiseLevel || 0.5,
        totalImages: data.images.length
      });
      this.processNextImage();
    });
  },

  async processNextImage() {
    if (this.data.currentIndex >= this.data.images.length) {
      this.setData({ processing: false });
      wx.showToast({
        title: '全部处理完成',
        icon: 'success'
      });
      return;
    }

    this.setData({ processing: true });
    const currentImage = this.data.images[this.data.currentIndex];

    try {
      // 获取图片数据
      const imageData = await imageProcessor.createImageData(currentImage.path);
      
      // 添加水印
      const watermarkedImage = await imageProcessor.addWatermark(imageData, this.data.noiseLevel);
      
      // 保存处理后的图片
      const tempFilePath = await this.saveImageToTemp(watermarkedImage);
      
      // 更新图片状态
      const processedImages = [...this.data.processedImages];
      processedImages[this.data.currentIndex] = {
        originalPath: currentImage.path,
        processedPath: tempFilePath,
        status: 'completed'
      };

      this.setData({
        processedImages,
        currentIndex: this.data.currentIndex + 1
      });

      // 保存到最近图片列表
      const recentImages = wx.getStorageSync('recentImages') || [];
      const newImage = {
        path: tempFilePath,
        date: new Date().toLocaleString()
      };
      wx.setStorageSync('recentImages', [newImage].concat(recentImages));

      // 处理下一张图片
      this.processNextImage();
    } catch (err) {
      console.error('处理图片失败：', err);
      const processedImages = [...this.data.processedImages];
      processedImages[this.data.currentIndex] = {
        originalPath: currentImage.path,
        status: 'failed'
      };
      this.setData({
        processedImages,
        currentIndex: this.data.currentIndex + 1
      });
      this.processNextImage();
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

  // 保存单张图片到相册
  async onSaveImage(e) {
    const index = e.currentTarget.dataset.index;
    const image = this.data.processedImages[index];
    if (!image || image.status !== 'completed') return;

    try {
      await wx.saveImageToPhotosAlbum({
        filePath: image.processedPath
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

  // 预览图片
  onPreviewImage(e) {
    const index = e.currentTarget.dataset.index;
    const image = this.data.processedImages[index];
    if (!image || image.status !== 'completed') return;

    wx.previewImage({
      current: image.processedPath,
      urls: this.data.processedImages
        .filter(img => img && img.status === 'completed')
        .map(img => img.processedPath)
    });
  }
}); 