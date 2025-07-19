'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import AIImageAnalyzer from '@/components/ai/ai-image-analyzer';
import { AIAnalysisResult, ImageOptimizationResult } from '@/services/aiService';
import { Brain, Zap, Search, Image as ImageIcon, Info } from 'lucide-react';

export default function AIDemoPage() {
  const [analysisHistory, setAnalysisHistory] = useState<AIAnalysisResult[]>([]);
  const [optimizationHistory, setOptimizationHistory] = useState<ImageOptimizationResult[]>([]);

  const handleAnalysisComplete = (result: AIAnalysisResult) => {
    setAnalysisHistory(prev => [result, ...prev.slice(0, 4)]); // 保留最近 5 次結果
  };

  const handleOptimizationComplete = (result: ImageOptimizationResult) => {
    setOptimizationHistory(prev => [result, ...prev.slice(0, 4)]); // 保留最近 5 次結果
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* 頁面標題 */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4 flex items-center justify-center gap-3">
          <Brain className="h-10 w-10 text-blue-600" />
          AI 功能展示中心
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          體驗呼嚕寵物協尋網站的強大 AI 功能，包括圖像分析、寵物品種識別、圖像優化和相似度搜尋
        </p>
      </div>

      {/* 功能介紹卡片 */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card className="text-center">
          <CardHeader>
            <Zap className="h-8 w-8 mx-auto text-yellow-500 mb-2" />
            <CardTitle className="text-lg">智能圖像分析</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              使用 Google Vision AI 分析圖像內容，自動識別寵物品種、特徵和標籤
            </p>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardHeader>
            <ImageIcon className="h-8 w-8 mx-auto text-green-500 mb-2" />
            <CardTitle className="text-lg">圖像處理優化</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              自動壓縮、調整大小和格式轉換，提升圖像載入速度和用戶體驗
            </p>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardHeader>
            <Search className="h-8 w-8 mx-auto text-purple-500 mb-2" />
            <CardTitle className="text-lg">相似度搜尋</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              基於圖像特徵向量進行相似寵物搜尋，幫助快速找到走失的寵物
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 主要內容區域 */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* AI 工具區域 */}
        <div className="lg:col-span-2">
          <AIImageAnalyzer
            onAnalysisComplete={handleAnalysisComplete}
            onOptimizationComplete={handleOptimizationComplete}
            className="w-full"
          />
        </div>

        {/* 側邊欄 - 歷史記錄和說明 */}
        <div className="space-y-6">
          {/* 使用說明 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Info className="h-5 w-5" />
                使用說明
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <h4 className="font-semibold mb-1">1. 上傳圖像</h4>
                <p className="text-gray-600">選擇清晰的寵物圖像，支援 PNG、JPG 格式</p>
              </div>
              <div>
                <h4 className="font-semibold mb-1">2. AI 分析</h4>
                <p className="text-gray-600">自動識別寵物品種、特徵和圖像內容</p>
              </div>
              <div>
                <h4 className="font-semibold mb-1">3. 圖像優化</h4>
                <p className="text-gray-600">壓縮圖像大小，提升載入速度</p>
              </div>
              <div>
                <h4 className="font-semibold mb-1">4. 相似搜尋</h4>
                <p className="text-gray-600">搜尋資料庫中相似的寵物案例</p>
              </div>
            </CardContent>
          </Card>

          {/* 分析歷史 */}
          {analysisHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">最近分析結果</CardTitle>
                <CardDescription>最近 {analysisHistory.length} 次 AI 分析</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysisHistory.map((result, index) => (
                    <div key={index} className="border-l-4 border-blue-500 pl-3">
                      <div className="text-sm font-medium mb-1">
                        分析 #{analysisHistory.length - index}
                      </div>
                      {result.breedPrediction && (
                        <Badge variant="default" className="text-xs mb-2">
                          {result.breedPrediction.breed} 
                          ({(result.breedPrediction.confidence * 100).toFixed(1)}%)
                        </Badge>
                      )}
                      <div className="text-xs text-gray-600">
                        檢測到 {result.labels.length} 個標籤，
                        {result.objects.length} 個物件
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 優化歷史 */}
          {optimizationHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">優化記錄</CardTitle>
                <CardDescription>最近 {optimizationHistory.length} 次圖像優化</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {optimizationHistory.map((result, index) => (
                    <div key={index} className="border-l-4 border-green-500 pl-3">
                      <div className="text-sm font-medium mb-1">
                        優化 #{optimizationHistory.length - index}
                      </div>
                      <div className="text-xs text-gray-600 space-y-1">
                        <div>
                          大小: {(result.originalSize / 1024).toFixed(1)}KB → 
                          {(result.optimizedSize / 1024).toFixed(1)}KB
                        </div>
                        <div>
                          壓縮率: {result.compressionRatio.toFixed(1)}%
                        </div>
                        <div>
                          尺寸: {result.dimensions.width}×{result.dimensions.height}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* AI 功能狀態 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">AI 服務狀態</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span>Google Vision API</span>
                  <Badge variant="default" className="text-xs">正常</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>圖像處理服務</span>
                  <Badge variant="default" className="text-xs">正常</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>相似度搜尋</span>
                  <Badge variant="default" className="text-xs">正常</Badge>
                </div>
                <div className="text-xs text-gray-500 mt-3">
                  所有 AI 服務運行正常，可以開始使用
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 技術說明 */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>技術架構說明</CardTitle>
          <CardDescription>了解我們的 AI 功能是如何實現的</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="analysis" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="analysis">圖像分析</TabsTrigger>
              <TabsTrigger value="optimization">圖像優化</TabsTrigger>
              <TabsTrigger value="search">相似搜尋</TabsTrigger>
              <TabsTrigger value="integration">系統整合</TabsTrigger>
            </TabsList>

            <TabsContent value="analysis" className="mt-4">
              <div className="space-y-3 text-sm">
                <h4 className="font-semibold">Google Vision AI 整合</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  <li>使用 Google Cloud Vision API 進行圖像內容分析</li>
                  <li>支援物件檢測、標籤識別和文字識別</li>
                  <li>自訓練模型進行寵物品種分類</li>
                  <li>提取圖像特徵向量用於相似度比對</li>
                </ul>
              </div>
            </TabsContent>

            <TabsContent value="optimization" className="mt-4">
              <div className="space-y-3 text-sm">
                <h4 className="font-semibold">圖像處理技術</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  <li>使用 Sharp 和 Jimp 進行高效圖像處理</li>
                  <li>智能壓縮算法，保持圖像品質</li>
                  <li>支援多種格式轉換（JPEG、PNG、WebP）</li>
                  <li>自動調整尺寸和裁剪功能</li>
                </ul>
              </div>
            </TabsContent>

            <TabsContent value="search" className="mt-4">
              <div className="space-y-3 text-sm">
                <h4 className="font-semibold">相似度搜尋算法</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  <li>基於深度學習的特徵提取</li>
                  <li>餘弦相似度計算和向量比對</li>
                  <li>多維度特徵融合（顏色、紋理、形狀）</li>
                  <li>地理位置和時間權重調整</li>
                </ul>
              </div>
            </TabsContent>

            <TabsContent value="integration" className="mt-4">
              <div className="space-y-3 text-sm">
                <h4 className="font-semibold">系統架構</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  <li>微服務架構，AI 功能獨立部署</li>
                  <li>Redis 快取提升響應速度</li>
                  <li>MongoDB 儲存特徵向量和分析結果</li>
                  <li>RESTful API 提供統一介面</li>
                </ul>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}