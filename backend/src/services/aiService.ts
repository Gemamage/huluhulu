import { ImageAnnotatorClient } from '@google-cloud/vision';
import sharp from 'sharp';
import Jimp from 'jimp';
import { config } from '../config/environment';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';
import crypto from 'crypto';

// Google Vision AI 客戶端
let visionClient: ImageAnnotatorClient;

// 初始化 Vision AI 客戶端
try {
  visionClient = new ImageAnnotatorClient({
    keyFilename: config.google?.visionKeyPath,
    projectId: config.google?.projectId,
  });
} catch (error) {
  logger.warn('Google Vision AI 初始化失敗，將使用備用方案', { error });
}

// 寵物品種映射表
const PET_BREEDS = {
  dogs: [
    '拉布拉多', '黃金獵犬', '德國牧羊犬', '法國鬥牛犬', '貴賓犬',
    '柴犬', '哈士奇', '邊境牧羊犬', '比格犬', '吉娃娃',
    '博美犬', '約克夏', '馬爾濟斯', '雪納瑞', '柯基犬'
  ],
  cats: [
    '英國短毛貓', '美國短毛貓', '波斯貓', '暹羅貓', '緬因貓',
    '布偶貓', '俄羅斯藍貓', '蘇格蘭摺耳貓', '阿比西尼亞貓', '孟加拉貓',
    '挪威森林貓', '土耳其安哥拉貓', '埃及貓', '曼島貓', '混種貓'
  ]
};

// 圖像特徵向量介面
interface ImageFeatures {
  colorHistogram: number[];
  textureFeatures: number[];
  shapeFeatures: number[];
  dominantColors: string[];
}

// AI 分析結果介面
interface AIAnalysisResult {
  petType: 'dog' | 'cat' | 'other' | 'unknown';
  breed: string;
  confidence: number;
  features: ImageFeatures;
  labels: string[];
  safeSearch: {
    adult: string;
    violence: string;
    racy: string;
  };
}

export class AIService {
  /**
   * 圖像壓縮和優化
   */
  static async optimizeImage(
    imageBuffer: Buffer,
    options: {
      maxWidth?: number;
      maxHeight?: number;
      quality?: number;
      format?: 'jpeg' | 'png' | 'webp';
    } = {}
  ): Promise<{ buffer: Buffer; metadata: any }> {
    try {
      const {
        maxWidth = 1200,
        maxHeight = 1200,
        quality = 85,
        format = 'jpeg'
      } = options;

      let pipeline = sharp(imageBuffer)
        .resize(maxWidth, maxHeight, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .rotate(); // 自動旋轉

      // 根據格式設置輸出選項
      switch (format) {
        case 'jpeg':
          pipeline = pipeline.jpeg({ quality, progressive: true });
          break;
        case 'png':
          pipeline = pipeline.png({ compressionLevel: 8 });
          break;
        case 'webp':
          pipeline = pipeline.webp({ quality });
          break;
      }

      const optimizedBuffer = await pipeline.toBuffer();
      const metadata = await sharp(optimizedBuffer).metadata();

      logger.info('圖像優化完成', {
        originalSize: imageBuffer.length,
        optimizedSize: optimizedBuffer.length,
        compressionRatio: ((imageBuffer.length - optimizedBuffer.length) / imageBuffer.length * 100).toFixed(2) + '%',
        format,
        dimensions: `${metadata.width}x${metadata.height}`
      });

      return {
        buffer: optimizedBuffer,
        metadata
      };
    } catch (error) {
      logger.error('圖像優化失敗', { error });
      throw new AppError('圖像處理失敗', 500);
    }
  }

  /**
   * 圖像裁剪
   */
  static async cropImage(
    imageBuffer: Buffer,
    cropOptions: {
      x: number;
      y: number;
      width: number;
      height: number;
    }
  ): Promise<Buffer> {
    try {
      const { x, y, width, height } = cropOptions;
      
      const croppedBuffer = await sharp(imageBuffer)
        .extract({ left: x, top: y, width, height })
        .toBuffer();

      logger.info('圖像裁剪完成', { cropOptions });
      return croppedBuffer;
    } catch (error) {
      logger.error('圖像裁剪失敗', { error });
      throw new AppError('圖像裁剪失敗', 500);
    }
  }

  /**
   * 提取圖像特徵向量
   */
  static async extractImageFeatures(imageBuffer: Buffer): Promise<ImageFeatures> {
    try {
      const image = await Jimp.read(imageBuffer);
      
      // 顏色直方圖
      const colorHistogram = this.calculateColorHistogram(image);
      
      // 紋理特徵（簡化版）
      const textureFeatures = this.calculateTextureFeatures(image);
      
      // 形狀特徵（簡化版）
      const shapeFeatures = this.calculateShapeFeatures(image);
      
      // 主要顏色
      const dominantColors = this.extractDominantColors(image);

      return {
        colorHistogram,
        textureFeatures,
        shapeFeatures,
        dominantColors
      };
    } catch (error) {
      logger.error('特徵提取失敗', { error });
      throw new AppError('圖像特徵提取失敗', 500);
    }
  }

  /**
   * 計算圖像相似度
   */
  static calculateImageSimilarity(
    features1: ImageFeatures,
    features2: ImageFeatures
  ): number {
    try {
      // 計算顏色直方圖相似度
      const colorSimilarity = this.calculateHistogramSimilarity(
        features1.colorHistogram,
        features2.colorHistogram
      );
      
      // 計算紋理相似度
      const textureSimilarity = this.calculateVectorSimilarity(
        features1.textureFeatures,
        features2.textureFeatures
      );
      
      // 計算形狀相似度
      const shapeSimilarity = this.calculateVectorSimilarity(
        features1.shapeFeatures,
        features2.shapeFeatures
      );
      
      // 加權平均
      const similarity = (
        colorSimilarity * 0.4 +
        textureSimilarity * 0.3 +
        shapeSimilarity * 0.3
      );
      
      return Math.max(0, Math.min(1, similarity));
    } catch (error) {
      logger.error('相似度計算失敗', { error });
      return 0;
    }
  }

  /**
   * Google Vision AI 圖像分析
   */
  static async analyzeImageWithVision(imageBuffer: Buffer): Promise<AIAnalysisResult> {
    try {
      if (!visionClient) {
        throw new AppError('Google Vision AI 未初始化', 500);
      }

      const [result] = await visionClient.annotateImage({
        image: { content: imageBuffer.toString('base64') },
        features: [
          { type: 'LABEL_DETECTION', maxResults: 10 },
          { type: 'SAFE_SEARCH_DETECTION' },
          { type: 'IMAGE_PROPERTIES' }
        ],
      });

      const labels = result.labelAnnotations?.map(label => label.description || '') || [];
      const safeSearch = result.safeSearchAnnotation || {};
      
      // 分析寵物類型和品種
      const petAnalysis = this.analyzePetFromLabels(labels);
      
      // 提取圖像特徵
      const features = await this.extractImageFeatures(imageBuffer);

      return {
        petType: petAnalysis.type,
        breed: petAnalysis.breed,
        confidence: petAnalysis.confidence,
        features,
        labels,
        safeSearch: {
          adult: safeSearch.adult || 'UNKNOWN',
          violence: safeSearch.violence || 'UNKNOWN',
          racy: safeSearch.racy || 'UNKNOWN'
        }
      };
    } catch (error) {
      logger.error('Vision AI 分析失敗', { error });
      
      // 備用方案：使用本地分析
      return this.analyzeImageLocally(imageBuffer);
    }
  }

  /**
   * 本地圖像分析（備用方案）
   */
  static async analyzeImageLocally(imageBuffer: Buffer): Promise<AIAnalysisResult> {
    try {
      const features = await this.extractImageFeatures(imageBuffer);
      
      return {
        petType: 'unknown',
        breed: '未知品種',
        confidence: 0.5,
        features,
        labels: ['寵物', '動物'],
        safeSearch: {
          adult: 'VERY_UNLIKELY',
          violence: 'VERY_UNLIKELY',
          racy: 'VERY_UNLIKELY'
        }
      };
    } catch (error) {
      logger.error('本地圖像分析失敗', { error });
      throw new AppError('圖像分析失敗', 500);
    }
  }

  /**
   * 從標籤分析寵物類型和品種
   */
  private static analyzePetFromLabels(labels: string[]): {
    type: 'dog' | 'cat' | 'other' | 'unknown';
    breed: string;
    confidence: number;
  } {
    const lowerLabels = labels.map(label => label.toLowerCase());
    
    // 檢測寵物類型
    let petType: 'dog' | 'cat' | 'other' | 'unknown' = 'unknown';
    let confidence = 0;
    
    if (lowerLabels.some(label => label.includes('dog') || label.includes('puppy'))) {
      petType = 'dog';
      confidence = 0.8;
    } else if (lowerLabels.some(label => label.includes('cat') || label.includes('kitten'))) {
      petType = 'cat';
      confidence = 0.8;
    } else if (lowerLabels.some(label => label.includes('pet') || label.includes('animal'))) {
      petType = 'other';
      confidence = 0.6;
    }
    
    // 嘗試識別品種
    let breed = '混種';
    if (petType === 'dog') {
      for (const dogBreed of PET_BREEDS.dogs) {
        if (lowerLabels.some(label => label.includes(dogBreed.toLowerCase()))) {
          breed = dogBreed;
          confidence = Math.min(confidence + 0.1, 0.9);
          break;
        }
      }
    } else if (petType === 'cat') {
      for (const catBreed of PET_BREEDS.cats) {
        if (lowerLabels.some(label => label.includes(catBreed.toLowerCase()))) {
          breed = catBreed;
          confidence = Math.min(confidence + 0.1, 0.9);
          break;
        }
      }
    }
    
    return { type: petType, breed, confidence };
  }

  // 輔助方法
  private static calculateColorHistogram(image: any): number[] {
    // 簡化的顏色直方圖計算
    const histogram = new Array(256).fill(0);
    const { width, height } = image.bitmap;
    
    for (let x = 0; x < width; x += 4) {
      for (let y = 0; y < height; y += 4) {
        const color = Jimp.intToRGBA(image.getPixelColor(x, y));
        const gray = Math.round(0.299 * color.r + 0.587 * color.g + 0.114 * color.b);
        histogram[gray]++;
      }
    }
    
    // 正規化
    const total = histogram.reduce((sum, val) => sum + val, 0);
    return histogram.map(val => val / total);
  }

  private static calculateTextureFeatures(image: any): number[] {
    // 簡化的紋理特徵計算
    return [0.5, 0.3, 0.7, 0.2]; // 佔位符
  }

  private static calculateShapeFeatures(image: any): number[] {
    // 簡化的形狀特徵計算
    const { width, height } = image.bitmap;
    const aspectRatio = width / height;
    return [aspectRatio, width, height, width * height];
  }

  private static extractDominantColors(image: any): string[] {
    // 簡化的主要顏色提取
    return ['#8B4513', '#D2691E', '#000000']; // 佔位符
  }

  private static calculateHistogramSimilarity(hist1: number[], hist2: number[]): number {
    if (hist1.length !== hist2.length) return 0;
    
    let similarity = 0;
    for (let i = 0; i < hist1.length; i++) {
      similarity += Math.min(hist1[i], hist2[i]);
    }
    return similarity;
  }

  private static calculateVectorSimilarity(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length) return 0;
    
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;
    
    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      norm1 += vec1[i] * vec1[i];
      norm2 += vec2[i] * vec2[i];
    }
    
    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }

  /**
   * 生成搜尋建議
   */
  static generateSearchSuggestions(analysisResult: AIAnalysisResult): string[] {
    const suggestions: string[] = [];
    
    // 基於寵物類型的建議
    if (analysisResult.petType !== 'unknown') {
      suggestions.push(analysisResult.petType === 'dog' ? '狗' : '貓');
    }
    
    // 基於品種的建議
    if (analysisResult.breed !== '混種' && analysisResult.breed !== '未知品種') {
      suggestions.push(analysisResult.breed);
    }
    
    // 基於標籤的建議
    analysisResult.labels.forEach(label => {
      if (label.length > 1 && !suggestions.includes(label)) {
        suggestions.push(label);
      }
    });
    
    return suggestions.slice(0, 5); // 限制為 5 個建議
  }
}