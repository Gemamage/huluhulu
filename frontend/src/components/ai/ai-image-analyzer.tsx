'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import {
  aiService,
  AIAnalysisResult,
  ImageOptimizationResult,
} from '@/services/aiService';
import {
  Upload,
  Image as ImageIcon,
  Zap,
  Scissors,
  Search,
  Loader2,
} from 'lucide-react';

interface AIImageAnalyzerProps {
  onAnalysisComplete?: (result: AIAnalysisResult) => void;
  onOptimizationComplete?: (result: ImageOptimizationResult) => void;
  className?: string;
}

export function AIImageAnalyzer({
  onAnalysisComplete,
  onOptimizationComplete,
  className,
}: AIImageAnalyzerProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);

  const [isSearching, setIsSearching] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AIAnalysisResult | null>(
    null
  );
  const [optimizationResult, setOptimizationResult] =
    useState<ImageOptimizationResult | null>(null);

  // 處理文件選擇
  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        // 檢查文件類型
        if (!file.type.startsWith('image/')) {
          toast({
            title: '文件類型錯誤',
            description: '請選擇圖像文件',
            variant: 'destructive',
          });
          return;
        }

        // 檢查文件大小（限制 10MB）
        if (file.size > 10 * 1024 * 1024) {
          toast({
            title: '文件過大',
            description: '圖像文件大小不能超過 10MB',
            variant: 'destructive',
          });
          return;
        }

        setSelectedFile(file);

        // 創建預覽 URL
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);

        // 清除之前的結果
        setAnalysisResult(null);
        setOptimizationResult(null);
      }
    },
    []
  );

  // AI 圖像分析
  const handleAnalyze = useCallback(async () => {
    if (!selectedFile) {
      toast({
        title: '請選擇圖像',
        description: '請先選擇要分析的圖像文件',
        variant: 'destructive',
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await aiService.analyzeImageFile(selectedFile);
      if (response.success && response.data) {
        setAnalysisResult(response.data);
        onAnalysisComplete?.(response.data);
      }
    } catch (error) {
      console.error('圖像分析失敗:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [selectedFile, onAnalysisComplete]);

  // 圖像優化
  const handleOptimize = useCallback(async () => {
    if (!selectedFile) {
      toast({
        title: '請選擇圖像',
        description: '請先選擇要優化的圖像文件',
        variant: 'destructive',
      });
      return;
    }

    setIsOptimizing(true);
    try {
      const response = await aiService.optimizeImage({
        imageFile: selectedFile,
        width: 800,
        height: 600,
        quality: 85,
        format: 'jpeg',
      });
      if (response.success && response.data) {
        setOptimizationResult(response.data);
        onOptimizationComplete?.(response.data);
      }
    } catch (error) {
      console.error('圖像優化失敗:', error);
    } finally {
      setIsOptimizing(false);
    }
  }, [selectedFile, onOptimizationComplete]);

  // 相似寵物搜尋
  const handleSimilarSearch = useCallback(async () => {
    if (!selectedFile) {
      toast({
        title: '請選擇圖像',
        description: '請先選擇要搜尋的寵物圖像',
        variant: 'destructive',
      });
      return;
    }

    setIsSearching(true);
    try {
      const response = await aiService.searchSimilarPets({
        imageFile: selectedFile,
        limit: 10,
      });
      if (response.success && response.data) {
        // 這裡可以導航到搜尋結果頁面或顯示結果
        toast({
          title: '搜尋完成',
          description: `找到 ${response.data.totalFound} 隻相似的寵物`,
        });
      }
    } catch (error) {
      console.error('相似寵物搜尋失敗:', error);
    } finally {
      setIsSearching(false);
    }
  }, [selectedFile]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 文件上傳區域 */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Upload className='h-5 w-5' />
            AI 圖像分析工具
          </CardTitle>
          <CardDescription>
            上傳寵物圖像，使用 AI 進行智能分析、優化和搜尋
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {/* 文件選擇 */}
            <div className='flex items-center justify-center w-full'>
              <label className='flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100'>
                <div className='flex flex-col items-center justify-center pt-5 pb-6'>
                  <ImageIcon className='w-8 h-8 mb-4 text-gray-500' />
                  <p className='mb-2 text-sm text-gray-500'>
                    <span className='font-semibold'>點擊上傳</span>{' '}
                    或拖拽圖像文件
                  </p>
                  <p className='text-xs text-gray-500'>
                    PNG, JPG, JPEG (最大 10MB)
                  </p>
                </div>
                <input
                  type='file'
                  className='hidden'
                  accept='image/*'
                  onChange={handleFileSelect}
                />
              </label>
            </div>

            {/* 圖像預覽 */}
            {previewUrl && (
              <div className='mt-4'>
                <img
                  src={previewUrl}
                  alt='預覽'
                  className='max-w-full h-48 object-contain mx-auto rounded-lg border'
                />
                <p className='text-sm text-gray-500 text-center mt-2'>
                  {selectedFile?.name} (
                  {(selectedFile?.size || 0 / 1024 / 1024).toFixed(2)} MB)
                </p>
              </div>
            )}

            {/* 操作按鈕 */}
            <div className='flex flex-wrap gap-2'>
              <Button
                onClick={handleAnalyze}
                disabled={!selectedFile || isAnalyzing}
                className='flex items-center gap-2'
              >
                {isAnalyzing ? (
                  <Loader2 className='h-4 w-4 animate-spin' />
                ) : (
                  <Zap className='h-4 w-4' />
                )}
                {isAnalyzing ? '分析中...' : 'AI 分析'}
              </Button>

              <Button
                onClick={handleOptimize}
                disabled={!selectedFile || isOptimizing}
                variant='outline'
                className='flex items-center gap-2'
              >
                {isOptimizing ? (
                  <Loader2 className='h-4 w-4 animate-spin' />
                ) : (
                  <Scissors className='h-4 w-4' />
                )}
                {isOptimizing ? '優化中...' : '圖像優化'}
              </Button>

              <Button
                onClick={handleSimilarSearch}
                disabled={!selectedFile || isSearching}
                variant='outline'
                className='flex items-center gap-2'
              >
                {isSearching ? (
                  <Loader2 className='h-4 w-4 animate-spin' />
                ) : (
                  <Search className='h-4 w-4' />
                )}
                {isSearching ? '搜尋中...' : '相似搜尋'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 結果顯示 */}
      {(analysisResult || optimizationResult) && (
        <Card>
          <CardHeader>
            <CardTitle>AI 處理結果</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue='analysis' className='w-full'>
              <TabsList className='grid w-full grid-cols-2'>
                <TabsTrigger value='analysis' disabled={!analysisResult}>
                  分析結果
                </TabsTrigger>
                <TabsTrigger
                  value='optimization'
                  disabled={!optimizationResult}
                >
                  優化結果
                </TabsTrigger>
              </TabsList>

              {/* 分析結果 */}
              {analysisResult && (
                <TabsContent value='analysis' className='space-y-4'>
                  {/* 品種識別 */}
                  {analysisResult.breedPrediction && (
                    <div>
                      <h4 className='font-semibold mb-2'>品種識別</h4>
                      <div className='space-y-2'>
                        <Badge variant='default' className='text-sm'>
                          {analysisResult.breedPrediction.breed}(
                          {(
                            analysisResult.breedPrediction.confidence * 100
                          ).toFixed(1)}
                          %)
                        </Badge>
                        {analysisResult.breedPrediction.alternatives
                          .slice(0, 3)
                          .map((alt, index) => (
                            <Badge
                              key={index}
                              variant='outline'
                              className='text-sm ml-2'
                            >
                              {alt.breed} ({(alt.confidence * 100).toFixed(1)}%)
                            </Badge>
                          ))}
                      </div>
                    </div>
                  )}

                  <Separator />

                  {/* 圖像標籤 */}
                  <div>
                    <h4 className='font-semibold mb-2'>圖像內容</h4>
                    <div className='flex flex-wrap gap-2'>
                      {analysisResult.labels
                        .slice(0, 10)
                        .map((label, index) => (
                          <Badge key={index} variant='secondary'>
                            {label.description} (
                            {(label.score * 100).toFixed(0)}%)
                          </Badge>
                        ))}
                    </div>
                  </div>

                  <Separator />

                  {/* 檢測到的物件 */}
                  {analysisResult.objects.length > 0 && (
                    <div>
                      <h4 className='font-semibold mb-2'>檢測到的物件</h4>
                      <div className='space-y-1'>
                        {analysisResult.objects
                          .slice(0, 5)
                          .map((obj, index) => (
                            <div key={index} className='text-sm'>
                              {obj.name} - {(obj.score * 100).toFixed(1)}%
                              信心度
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  <Separator />

                  {/* AI 標籤 */}
                  <div>
                    <h4 className='font-semibold mb-2'>AI 標籤</h4>
                    <div className='flex flex-wrap gap-1'>
                      {analysisResult.tags.map((tag, index) => (
                        <Badge
                          key={index}
                          variant='outline'
                          className='text-xs'
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              )}

              {/* 優化結果 */}
              {optimizationResult && (
                <TabsContent value='optimization' className='space-y-4'>
                  <div className='grid grid-cols-2 gap-4'>
                    <div>
                      <h4 className='font-semibold mb-2'>優化統計</h4>
                      <div className='space-y-2 text-sm'>
                        <div>
                          原始大小:{' '}
                          {(optimizationResult.originalSize / 1024).toFixed(1)}{' '}
                          KB
                        </div>
                        <div>
                          優化後大小:{' '}
                          {(optimizationResult.optimizedSize / 1024).toFixed(1)}{' '}
                          KB
                        </div>
                        <div>
                          壓縮率:{' '}
                          {optimizationResult.compressionRatio.toFixed(1)}%
                        </div>
                        <div>
                          格式: {optimizationResult.format.toUpperCase()}
                        </div>
                        <div>
                          尺寸: {optimizationResult.dimensions.width} ×{' '}
                          {optimizationResult.dimensions.height}
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className='font-semibold mb-2'>優化後圖像</h4>
                      <img
                        src={optimizationResult.optimizedImageUrl}
                        alt='優化後'
                        className='max-w-full h-32 object-contain border rounded'
                      />
                    </div>
                  </div>
                </TabsContent>
              )}
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default AIImageAnalyzer;
