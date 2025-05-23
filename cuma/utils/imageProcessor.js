const { createWorker } = require('tesseract.js');

class ImageProcessor {
  constructor() {
    this.worker = null;
  }

  async init() {
    if (!this.worker) {
      this.worker = await createWorker();
      await this.worker.loadLanguage('eng');
      await this.worker.initialize('eng');
    }
  }

  async addWatermark(imageData, noiseLevel) {
    await this.init();
    
    // 将图像数据转换为ImageData对象
    const img = await this.createImageData(imageData);
    
    // 生成对抗性噪声
    const noise = this.generateNoise(img.width, img.height, noiseLevel);
    
    // 添加噪声到图像
    const watermarkedData = this.applyNoise(img.data, noise, noiseLevel);
    
    // 创建新的ImageData对象
    const watermarkedImage = new ImageData(
      new Uint8ClampedArray(watermarkedData),
      img.width,
      img.height
    );

    return watermarkedImage;
  }

  async createImageData(imagePath) {
    return new Promise((resolve, reject) => {
      const img = wx.createImage();
      img.onload = () => {
        const canvas = wx.createOffscreenCanvas({
          type: '2d',
          width: img.width,
          height: img.height
        });
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        resolve(imageData);
      };
      img.onerror = reject;
      img.src = imagePath;
    });
  }

  generateNoise(width, height, noiseLevel) {
    const noise = new Float32Array(width * height * 4);
    const scale = noiseLevel * 0.1; // 缩放噪声强度

    for (let i = 0; i < noise.length; i += 4) {
      // 生成高斯噪声
      noise[i] = this.gaussianRandom() * scale;
      noise[i + 1] = this.gaussianRandom() * scale;
      noise[i + 2] = this.gaussianRandom() * scale;
      noise[i + 3] = 0; // Alpha通道保持不变
    }

    return noise;
  }

  gaussianRandom() {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  }

  applyNoise(imageData, noise, noiseLevel) {
    const result = new Uint8ClampedArray(imageData.length);
    
    for (let i = 0; i < imageData.length; i += 4) {
      // 应用噪声到每个通道
      result[i] = Math.max(0, Math.min(255, imageData[i] + noise[i]));
      result[i + 1] = Math.max(0, Math.min(255, imageData[i + 1] + noise[i + 1]));
      result[i + 2] = Math.max(0, Math.min(255, imageData[i + 2] + noise[i + 2]));
      result[i + 3] = imageData[i + 3]; // 保持Alpha通道不变
    }

    return result;
  }

  async evaluateWatermark(originalImage, watermarkedImage) {
    const metrics = {
      l1Norm: this.calculateL1Norm(originalImage, watermarkedImage),
      l2Norm: this.calculateL2Norm(originalImage, watermarkedImage),
      psnr: this.calculatePSNR(originalImage, watermarkedImage),
      ssim: await this.calculateSSIM(originalImage, watermarkedImage)
    };

    return metrics;
  }

  calculateL1Norm(original, watermarked) {
    let sum = 0;
    for (let i = 0; i < original.length; i += 4) {
      sum += Math.abs(original[i] - watermarked[i]) +
             Math.abs(original[i + 1] - watermarked[i + 1]) +
             Math.abs(original[i + 2] - watermarked[i + 2]);
    }
    return sum / (original.length / 4);
  }

  calculateL2Norm(original, watermarked) {
    let sum = 0;
    for (let i = 0; i < original.length; i += 4) {
      sum += Math.pow(original[i] - watermarked[i], 2) +
             Math.pow(original[i + 1] - watermarked[i + 1], 2) +
             Math.pow(original[i + 2] - watermarked[i + 2], 2);
    }
    return Math.sqrt(sum / (original.length / 4));
  }

  calculatePSNR(original, watermarked) {
    const mse = this.calculateMSE(original, watermarked);
    if (mse === 0) return Infinity;
    return 10 * Math.log10((255 * 255) / mse);
  }

  calculateMSE(original, watermarked) {
    let sum = 0;
    for (let i = 0; i < original.length; i += 4) {
      sum += Math.pow(original[i] - watermarked[i], 2) +
             Math.pow(original[i + 1] - watermarked[i + 1], 2) +
             Math.pow(original[i + 2] - watermarked[i + 2], 2);
    }
    return sum / (original.length / 4);
  }

  async calculateSSIM(original, watermarked) {
    // 简化的SSIM计算
    const k1 = 0.01;
    const k2 = 0.03;
    const L = 255;
    const c1 = Math.pow(k1 * L, 2);
    const c2 = Math.pow(k2 * L, 2);

    let mu1 = 0, mu2 = 0, sigma1 = 0, sigma2 = 0, sigma12 = 0;
    const n = original.length / 4;

    // 计算均值
    for (let i = 0; i < original.length; i += 4) {
      mu1 += (original[i] + original[i + 1] + original[i + 2]) / 3;
      mu2 += (watermarked[i] + watermarked[i + 1] + watermarked[i + 2]) / 3;
    }
    mu1 /= n;
    mu2 /= n;

    // 计算方差和协方差
    for (let i = 0; i < original.length; i += 4) {
      const val1 = (original[i] + original[i + 1] + original[i + 2]) / 3;
      const val2 = (watermarked[i] + watermarked[i + 1] + watermarked[i + 2]) / 3;
      sigma1 += Math.pow(val1 - mu1, 2);
      sigma2 += Math.pow(val2 - mu2, 2);
      sigma12 += (val1 - mu1) * (val2 - mu2);
    }
    sigma1 /= n;
    sigma2 /= n;
    sigma12 /= n;

    // 计算SSIM
    const numerator = (2 * mu1 * mu2 + c1) * (2 * sigma12 + c2);
    const denominator = (mu1 * mu1 + mu2 * mu2 + c1) * (sigma1 + sigma2 + c2);

    return numerator / denominator;
  }

  async cleanup() {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
    }
  }
}

module.exports = new ImageProcessor(); 