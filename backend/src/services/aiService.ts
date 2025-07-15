import { ImageAnnotatorClient } from '@google-cloud/vision';
import sharp from 'sharp';
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
   * 提取圖像特徵向量（簡化版）
   */
  static async extractImageFeatures(imageBuffer: Buffer): Promise<ImageFeatures> {
    try {
      // 使用 Sharp 獲取基本圖像信息
      const metadata = await sharp(imageBuffer).metadata();
      
      // 生成簡化的特徵向量
      const colorHistogram = this.generateSimpleColorHistogram(metadata);
      const textureFeatures = this.generateSimpleTextureFeatures(metadata);
      const shapeFeatures = this.generateSimpleShapeFeatures(metadata);
      const dominantColors = this.generateSimpleDominantColors();

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
      const colorSimilarity = AIService.calculateHistogramSimilarity(
        features1.colorHistogram,
        features2.colorHistogram
      );
      
      // 計算紋理相似度
      const textureSimilarity = AIService.calculateVectorSimilarity(
        features1.textureFeatures,
        features2.textureFeatures
      );
      
      // 計算形狀相似度
      const shapeSimilarity = AIService.calculateVectorSimilarity(
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
      const petAnalysis = AIService.analyzePetFromLabels(labels);

      // 提取圖像特徵
      const features = await AIService.extractImageFeatures(imageBuffer);

      return {
        petType: petAnalysis.type,
        breed: petAnalysis.breed,
        confidence: petAnalysis.confidence,
        features,
        labels,
        safeSearch: {
          adult: String(safeSearch.adult || 'UNKNOWN'),
          violence: String(safeSearch.violence || 'UNKNOWN'),
          racy: String(safeSearch.racy || 'UNKNOWN')
        }
      };
    } catch (error) {
      logger.error('Vision AI 分析失敗', { error });
      
      // 備用方案：使用本地分析
      return AIService.analyzeImageLocally(imageBuffer);
    }
  }

  /**
   * 本地圖像分析（備用方案）
   */
  static async analyzeImageLocally(imageBuffer: Buffer): Promise<AIAnalysisResult> {
    try {
      const features = await AIService.extractImageFeatures(imageBuffer);
      
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

  // 輔助方法（簡化版）
  private static generateSimpleColorHistogram(metadata: any): number[] {
    // 基於圖像元數據生成簡化的顏色直方圖
    const histogram = new Array(256).fill(0);
    const seed = (metadata.width || 100) * (metadata.height || 100);
    
    // 生成偽隨機但一致的直方圖
    for (let i = 0; i < 256; i++) {
      histogram[i] = Math.sin(seed + i) * 0.5 + 0.5;
    }
    
    // 正規化
    const total = histogram.reduce((sum, val) => sum + val, 0);
    return histogram.map(val => val / total);
  }

  private static generateSimpleTextureFeatures(metadata: any): number[] {
    // 基於圖像元數據生成簡化的紋理特徵
    const width = metadata.width || 100;
    const height = metadata.height || 100;
    return [
      width / 1000,
      height / 1000,
      (width * height) / 1000000,
      metadata.channels || 3
    ];
  }

  private static generateSimpleShapeFeatures(metadata: any): number[] {
    // 基於圖像元數據生成簡化的形狀特徵
    const width = metadata.width || 100;
    const height = metadata.height || 100;
    const aspectRatio = width / height;
    return [aspectRatio, width, height, width * height];
  }

  private static generateSimpleDominantColors(): string[] {
    // 返回常見的寵物顏色
    return ['#8B4513', '#D2691E', '#000000', '#FFFFFF', '#808080'];
  }

  private static calculateHistogramSimilarity(hist1: number[], hist2: number[]): number {
    if (hist1.length !== hist2.length) return 0;
    
    let similarity = 0;
    for (let i = 0; i < hist1.length; i++) {
      const val1 = hist1[i];
      const val2 = hist2[i];
      if (val1 !== undefined && val2 !== undefined) {
        similarity += Math.min(val1, val2);
      }
    }
    return similarity;
  }

  private static calculateVectorSimilarity(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length) return 0;
    
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;
    
    for (let i = 0; i < vec1.length; i++) {
      const val1 = vec1[i];
      const val2 = vec2[i];
      if (val1 !== undefined && val2 !== undefined) {
        dotProduct += val1 * val2;
        norm1 += val1 * val1;
        norm2 += val2 * val2;
      }
    }
    
    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }

  /**
   * 分析圖像（主要入口方法）
   */
  static async analyzeImage(imageUrl: string): Promise<AIAnalysisResult> {
    try {
      // 從 URL 下載圖像
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new AppError(`無法下載圖像: ${response.statusText}`, 400);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      const imageBuffer = Buffer.from(arrayBuffer);
      
      // 使用 Vision AI 分析圖像
      return await this.analyzeImageWithVision(imageBuffer);
    } catch (error) {
      logger.error('圖像分析失敗', { imageUrl, error });
      
      // 如果分析失敗，返回基本結果
      return {
        petType: 'unknown',
        breed: '未識別',
        confidence: 0.5,
        features: {
          colorHistogram: [],
          textureFeatures: [],
          shapeFeatures: [],
          dominantColors: []
        },
        labels: ['寵物'],
        safeSearch: {
          adult: 'VERY_UNLIKELY',
          violence: 'VERY_UNLIKELY',
          racy: 'VERY_UNLIKELY'
        }
      };
    }
  }

  /**
   * 計算兩隻寵物的相似度
   */
  static calculateSimilarity(pet1: any, pet2: any): number {
    try {
      let similarity = 0;
      let factors = 0;

      // 品種相似度 (權重: 30%)
      if (pet1.breed && pet2.breed) {
        factors++;
        if (pet1.breed === pet2.breed) {
          similarity += 0.3;
        } else if (pet1.breed.includes('混種') || pet2.breed.includes('混種')) {
          similarity += 0.15;
        }
      }

      // 顏色相似度 (權重: 25%)
      if (pet1.color && pet2.color) {
        factors++;
        const color1 = pet1.color.toLowerCase();
        const color2 = pet2.color.toLowerCase();
        if (color1 === color2) {
          similarity += 0.25;
        } else if (color1.includes(color2) || color2.includes(color1)) {
          similarity += 0.15;
        }
      }

      // 大小相似度 (權重: 20%)
      if (pet1.size && pet2.size) {
        factors++;
        if (pet1.size === pet2.size) {
          similarity += 0.2;
        } else {
          const sizes = ['小型', '中型', '大型'];
          const index1 = sizes.indexOf(pet1.size);
          const index2 = sizes.indexOf(pet2.size);
          if (index1 !== -1 && index2 !== -1) {
            const diff = Math.abs(index1 - index2);
            if (diff === 1) similarity += 0.1;
          }
        }
      }

      // 年齡相似度 (權重: 15%)
      if (pet1.age && pet2.age) {
        factors++;
        const ageDiff = Math.abs(pet1.age - pet2.age);
        if (ageDiff === 0) {
          similarity += 0.15;
        } else if (ageDiff <= 1) {
          similarity += 0.1;
        } else if (ageDiff <= 3) {
          similarity += 0.05;
        }
      }

      // 性別相似度 (權重: 10%)
      if (pet1.gender && pet2.gender) {
        factors++;
        if (pet1.gender === pet2.gender) {
          similarity += 0.1;
        }
      }

      // 如果有圖像特徵，計算圖像相似度
      if (pet1.imageFeatures && pet2.imageFeatures) {
        const imageSimilarity = AIService.calculateImageSimilarity(
          pet1.imageFeatures,
          pet2.imageFeatures
        );
        similarity += imageSimilarity * 0.3; // 圖像相似度權重 30%
        factors++;
      }

      // 正規化相似度分數
      return factors > 0 ? Math.min(similarity, 1) : 0;
    } catch (error) {
      logger.error('相似度計算失敗', { error });
      return 0;
    }
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