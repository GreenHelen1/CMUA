const watermark = require('../../utils/watermark.js');

Page({
  data: {
    imagePaths: [],
    noiseLevel: 50,
    imageData: null,
    watermarkedImage: null
  },

  chooseImages() {
    wx.chooseImage({
      count: 9,
      success: res => {
        this.setData({
          imagePaths: res.tempFilePaths
        });
      }
    });
  },

  onSliderChange(e) {
    this.setData({
      noiseLevel: e.detail.value
    });
  },

  addWatermark() {
    if (this.data.imagePaths.length > 0) {
      const imageData = this.data.imagePaths[0];  // 使用第一张图片作为例子
      const noiseLevel = this.data.noiseLevel;

      // 通过 watermark.js 添加水印
      watermark.addWatermark(imageData, noiseLevel).then((watermarkedImage) => {
        this.setData({
          watermarkedImage
        });

        // 将水印图像绘制到 canvas 上
        this.drawImageOnCanvas(watermarkedImage);
      });
    }
  },

  drawImageOnCanvas(watermarkedImage) {
    const ctx = wx.createCanvasContext('watermarkCanvas');
    ctx.drawImage(watermarkedImage, 0, 0, 300, 300);
    ctx.draw();
  },

  saveImage() {
    const ctx = wx.createCanvasContext('watermarkCanvas');
    wx.canvasToTempFilePath({
      canvasId: 'watermarkCanvas',
      success: res => {
        wx.saveImageToPhotosAlbum({
          filePath: res.tempFilePath,
          success: () => {
            wx.showToast({
              title: '保存成功',
              icon: 'success'
            });
          }
        });
      }
    });
  }
});
