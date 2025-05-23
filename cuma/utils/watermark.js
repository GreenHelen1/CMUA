const addWatermark = (imageData, noiseLevel) => {
    return new Promise((resolve, reject) => {
      // 模拟水印添加逻辑
      setTimeout(() => {
        resolve(imageData);
      }, 1000);
    });
  };
  module.exports = {
    addWatermark
  };