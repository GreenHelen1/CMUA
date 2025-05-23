// pages/advanced/advanced.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    batchImages: [],
    evaluationResults: [],
    processing: false,
    showEvaluation: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.loadEvaluationResults();
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

  // 批量选择图片
  chooseBatchImages() {
    wx.chooseMedia({
      count: 9,
      mediaType: ['image'],
      sourceType: ['album'],
      success: (res) => {
        const tempFiles = res.tempFiles;
        this.setData({
          batchImages: tempFiles.map(file => ({
            path: file.tempFilePath,
            size: file.size,
            name: file.tempFilePath.split('/').pop()
          }))
        });
      }
    });
  },

  // 处理批量图片
  processBatchImages() {
    if (this.data.batchImages.length === 0) {
      wx.showToast({
        title: '请先选择图片',
        icon: 'none'
      });
      return;
    }

    this.setData({ processing: true });

    // 模拟处理过程
    setTimeout(() => {
      const results = this.data.batchImages.map(image => ({
        path: image.path,
        metrics: {
          l1Norm: (Math.random() * 0.5).toFixed(4),
          l2Norm: (Math.random() * 0.3).toFixed(4),
          psnr: (20 + Math.random() * 10).toFixed(2),
          ssim: (0.8 + Math.random() * 0.2).toFixed(4)
        },
        date: new Date().toLocaleString()
      }));

      // 保存评估结果
      const evaluationResults = wx.getStorageSync('evaluationResults') || [];
      wx.setStorageSync('evaluationResults', [...results, ...evaluationResults]);

      this.setData({
        evaluationResults: [...results, ...this.data.evaluationResults],
        processing: false,
        showEvaluation: true
      });

      wx.showToast({
        title: '处理完成',
        icon: 'success'
      });
    }, 2000);
  },

  // 加载评估结果
  loadEvaluationResults() {
    const results = wx.getStorageSync('evaluationResults') || [];
    this.setData({
      evaluationResults: results
    });
  },

  // 预览图片
  previewImage(e) {
    const { url } = e.currentTarget.dataset;
    wx.previewImage({
      current: url,
      urls: this.data.evaluationResults.map(result => result.path)
    });
  },

  // 删除评估结果
  deleteResult(e) {
    const { index } = e.currentTarget.dataset;
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条评估结果吗？',
      success: (res) => {
        if (res.confirm) {
          const results = [...this.data.evaluationResults];
          results.splice(index, 1);
          
          wx.setStorageSync('evaluationResults', results);
          
          this.setData({
            evaluationResults: results
          });
          
          wx.showToast({
            title: '删除成功',
            icon: 'success'
          });
        }
      }
    });
  }
})