'use client';

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Phone, AlertTriangle, Heart, Bird, Waves } from 'lucide-react';

export function RescueGuide() {
  return (
    <section className='py-16 bg-gradient-to-br from-blue-50 to-green-50'>
      <div className='container mx-auto px-4 sm:px-6 lg:px-8'>
        {/* 標題區塊 */}
        <div className='text-center mb-12'>
          <h2 className='text-3xl md:text-4xl font-bold text-gray-900 mb-4'>
            緊急情況？在這裡找到幫助
          </h2>
          <p className='text-lg text-gray-600 max-w-3xl mx-auto'>
            無論是走失寵物或受傷的野生動物，都能在此找到最即時的援手。
          </p>
        </div>

        {/* 頁籤區塊 */}
        <div className='max-w-6xl mx-auto'>
          <Tabs defaultValue='emergency' className='w-full'>
            <TabsList className='grid w-full grid-cols-4 mb-8'>
              <TabsTrigger
                value='emergency'
                className='flex items-center justify-center gap-2'
              >
                🚨 緊急首選電話
              </TabsTrigger>
              <TabsTrigger
                value='pets'
                className='flex items-center justify-center gap-2'
              >
                🐾 寵物/流浪動物
              </TabsTrigger>
              <TabsTrigger
                value='wildlife'
                className='flex items-center justify-center gap-2'
              >
                🐦 野生動物
              </TabsTrigger>
              <TabsTrigger
                value='marine'
                className='flex items-center justify-center gap-2'
              >
                🌊 海洋生物
              </TabsTrigger>
            </TabsList>

            {/* 緊急首選電話 */}
            <TabsContent value='emergency'>
              <div className='grid md:grid-cols-3 gap-6'>
                <Card className='border-red-200 bg-red-50'>
                  <CardHeader className='text-center'>
                    <div className='mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4'>
                      <Phone className='h-6 w-6 text-red-600' />
                    </div>
                    <CardTitle className='text-red-800'>
                      1959 動保專線
                    </CardTitle>
                    <CardDescription className='text-red-600'>
                      農委會動物保護檢舉專線
                    </CardDescription>
                  </CardHeader>
                  <CardContent className='text-center'>
                    <div className='text-3xl font-bold text-red-700 mb-2'>
                      1959
                    </div>
                    <p className='text-sm text-red-600'>
                      農委會全國統一動物保護專線
                      <br />
                      動物虐待、救援、收容問題
                      <br />
                      直接轉接所在地縣市動保處
                    </p>
                  </CardContent>
                </Card>

                <Card className='border-blue-200 bg-blue-50'>
                  <CardHeader className='text-center'>
                    <div className='mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4'>
                      <Phone className='h-6 w-6 text-blue-600' />
                    </div>
                    <CardTitle className='text-blue-800'>
                      1999 市民專線
                    </CardTitle>
                    <CardDescription className='text-blue-600'>
                      各縣市政府服務專線
                    </CardDescription>
                  </CardHeader>
                  <CardContent className='text-center'>
                    <div className='text-3xl font-bold text-blue-700 mb-2'>
                      1999
                    </div>
                    <p className='text-sm text-blue-600'>
                      各縣市市民專線
                      <br />
                      不確定動物狀況時撥打
                      <br />
                      會轉接權責單位處理
                    </p>
                  </CardContent>
                </Card>

                <Card className='border-orange-200 bg-orange-50'>
                  <CardHeader className='text-center'>
                    <div className='mx-auto w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4'>
                      <Phone className='h-6 w-6 text-orange-600' />
                    </div>
                    <CardTitle className='text-orange-800'>
                      119 消防局
                    </CardTitle>
                    <CardDescription className='text-orange-600'>
                      緊急救援專線
                    </CardDescription>
                  </CardHeader>
                  <CardContent className='text-center'>
                    <div className='text-3xl font-bold text-orange-700 mb-2'>
                      119
                    </div>
                    <p className='text-sm text-orange-600'>
                      動物立即性危險救援
                      <br />
                      受困高速公路、火場等
                      <br />
                      對公眾安全造成威脅時
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* 寵物/流浪動物 */}
            <TabsContent value='pets'>
              <div className='grid md:grid-cols-2 gap-8'>
                <Card>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2'>
                      <Heart className='h-5 w-5 text-pink-600' />
                      官方政府單位
                    </CardTitle>
                    <CardDescription>各縣市動物保護處聯絡資訊</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className='space-y-3'>
                      <div className='flex justify-between items-center p-3 bg-gray-50 rounded-lg min-w-0'>
                        <span className='font-medium text-sm flex-shrink-0'>
                          臺北市動物保護處
                        </span>
                        <span className='text-blue-600 font-semibold text-sm ml-4 flex-shrink-0'>
                          02-8791-3064~5
                        </span>
                      </div>
                      <div className='flex justify-between items-center p-3 bg-gray-50 rounded-lg min-w-0'>
                        <span className='font-medium text-sm flex-shrink-0'>
                          新北市政府動物保護防疫處
                        </span>
                        <span className='text-blue-600 font-semibold text-sm ml-4 flex-shrink-0'>
                          02-2959-6353
                        </span>
                      </div>
                      <div className='flex justify-between items-center p-3 bg-gray-50 rounded-lg min-w-0'>
                        <span className='font-medium text-sm flex-shrink-0'>
                          桃園市政府動物保護處
                        </span>
                        <span className='text-blue-600 font-semibold text-sm ml-4 flex-shrink-0'>
                          03-332-6742
                        </span>
                      </div>
                      <div className='flex justify-between items-center p-3 bg-gray-50 rounded-lg min-w-0'>
                        <span className='font-medium text-sm flex-shrink-0'>
                          臺中市動物保護防疫處
                        </span>
                        <span className='text-blue-600 font-semibold text-sm ml-4 flex-shrink-0'>
                          04-2386-9420
                        </span>
                      </div>
                      <div className='flex justify-between items-center p-3 bg-gray-50 rounded-lg min-w-0'>
                        <span className='font-medium text-sm flex-shrink-0'>
                          臺南市動物防疫保護處
                        </span>
                        <span className='text-blue-600 font-semibold text-sm ml-4 flex-shrink-0'>
                          06-213-0958
                        </span>
                      </div>
                      <div className='flex justify-between items-center p-3 bg-gray-50 rounded-lg min-w-0'>
                        <span className='font-medium text-sm flex-shrink-0'>
                          高雄市動物保護處
                        </span>
                        <span className='text-blue-600 font-semibold text-sm ml-4 flex-shrink-0'>
                          07-551-9059
                        </span>
                      </div>
                      <div className='flex justify-between items-center p-3 bg-gray-50 rounded-lg min-w-0'>
                        <span className='font-medium text-sm flex-shrink-0'>
                          基隆市動物保護防疫所
                        </span>
                        <span className='text-blue-600 font-semibold text-sm ml-4 flex-shrink-0'>
                          02-2428-0677
                        </span>
                      </div>
                      <div className='flex justify-between items-center p-3 bg-gray-50 rounded-lg min-w-0'>
                        <span className='font-medium text-sm flex-shrink-0'>
                          新竹市動物保護及防疫所
                        </span>
                        <span className='text-blue-600 font-semibold text-sm ml-4 flex-shrink-0'>
                          03-536-8329
                        </span>
                      </div>
                      <div className='flex justify-between items-center p-3 bg-gray-50 rounded-lg min-w-0'>
                        <span className='font-medium text-sm flex-shrink-0'>
                          嘉義市政府建設處農牧科
                        </span>
                        <span className='text-blue-600 font-semibold text-sm ml-4 flex-shrink-0'>
                          05-225-4321 #123
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2'>
                      <Heart className='h-5 w-5 text-green-600' />
                      知名民間團體
                    </CardTitle>
                    <CardDescription>專業動物救援組織</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className='space-y-3'>
                      <div className='p-3 bg-gray-50 rounded-lg'>
                        <div className='font-medium text-sm mb-1'>
                          台灣動物緊急救援小組 (ARTT)
                        </div>
                        <div className='text-orange-500 font-semibold text-sm mb-2'>
                          0912-254-995
                        </div>
                        <div className='text-xs text-gray-600'>
                          全國性的犬貓救援組織，有 24
                          小時的救援專線。主要處理緊急的犬貓傷病救援案件，若在路上發現受傷、受困的犬貓，可直接撥打24小時救援專線通報。
                        </div>
                      </div>
                      <div className='p-3 bg-gray-50 rounded-lg'>
                        <div className='font-medium text-sm mb-1'>
                          台灣之心愛護動物協會 (HOTAC)
                        </div>
                        <div className='text-orange-500 font-semibold text-sm mb-2'>
                          (04) 2626-1478
                        </div>
                        <div className='text-xs text-gray-600'>
                          專注於流浪犬貓的絕育與權益倡導。主要推動下鄉絕育行動
                          (TNR)，較少處理緊急救援案件，但可提供相關諮詢。
                        </div>
                      </div>
                      <div className='p-3 bg-gray-50 rounded-lg'>
                        <div className='font-medium text-sm mb-1'>
                          台灣防止虐待動物協會 (TSPCA)
                        </div>
                        <div className='text-orange-500 font-semibold text-sm mb-2'>
                          (02) 2738-2130
                        </div>
                        <div className='text-xs text-gray-600'>
                          調查不當飼養與虐待案件。若您發現疑似虐待動物的情況，可透過他們的官方網站進行線上通報，他們會進行專業的調查。
                        </div>
                      </div>
                      <div className='p-3 bg-blue-50 rounded-lg'>
                        <p className='text-sm text-blue-700 font-medium mb-1'>
                          💡 小提醒
                        </p>
                        <p className='text-xs text-blue-600'>
                          撥打1959或1999可查詢其他縣市動保處資訊
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* 野生動物 */}
            <TabsContent value='wildlife'>
              <div className='grid md:grid-cols-3 gap-6'>
                <Card>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2'>
                      <Bird className='h-5 w-5 text-blue-600' />
                      各地野鳥學會
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='space-y-2'>
                      <div className='flex flex-col p-3 bg-blue-50 rounded-lg'>
                        <span className='text-sm font-medium text-left'>
                          中華民國野鳥學會
                        </span>
                        <span className='text-orange-500 text-sm font-semibold text-left'>
                          02-8663-1252
                        </span>
                      </div>
                      <div className='flex flex-col p-3 bg-blue-50 rounded-lg'>
                        <span className='text-sm font-medium text-left'>
                          臺北市野鳥學會
                        </span>
                        <span className='text-orange-500 text-sm font-semibold text-left'>
                          02-2325-9190
                        </span>
                      </div>
                      <div className='flex flex-col p-3 bg-blue-50 rounded-lg'>
                        <span className='text-sm font-medium text-left'>
                          高雄市野鳥學會
                        </span>
                        <span className='text-orange-500 text-sm font-semibold text-left'>
                          07-215-2525
                        </span>
                      </div>
                      <div className='p-3 bg-yellow-50 rounded-lg'>
                        <p className='text-xs text-yellow-700'>
                          💡 受傷鳥類的專業求助對象
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2'>
                      <Heart className='h-5 w-5 text-red-600' />
                      <div className='flex flex-col'>
                        <span>野生動物急救站</span>
                        <span className='text-sm text-gray-500 font-normal'>
                          （國家級專業單位）
                        </span>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='space-y-2'>
                      <div className='p-3 bg-red-50 rounded-lg'>
                        <div className='font-medium text-red-800 mb-2'>
                          農業部生物多樣性研究所
                        </div>
                        <div className='text-sm text-red-600 mb-1'>
                          野生動物急救站
                        </div>
                        <div className='text-red-700 font-semibold'>
                          049-276-1331 #309
                        </div>
                        <div className='text-xs text-red-500 mt-1'>
                          地址：南投縣集集鎮民生東路1號
                        </div>
                      </div>
                      <div className='p-2 bg-orange-50 rounded'>
                        <p className='text-xs text-orange-700 font-medium'>
                          ⚠️ 重要提醒
                        </p>
                        <p className='text-xs text-orange-600'>
                          野生動物請勿送往一般動物醫院
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2'>
                      <AlertTriangle className='h-5 w-5 text-green-600' />
                      各縣市農業局/處
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='space-y-2'>
                      <div className='p-2 bg-green-50 rounded'>
                        <p className='text-sm font-medium text-green-800 mb-2'>
                          各縣市農業局/處
                        </p>
                        <p className='text-xs text-green-600 mb-2'>
                          野生動物救援的政府權責單位
                        </p>
                        <div className='text-xs text-green-700'>
                          <p>• 處理非犬貓的野生動物</p>
                          <p>• 鳥類、爬蟲類、哺乳類等</p>
                          <p>• 請撥打1959或1999查詢各縣市聯絡方式</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* 海洋生物 */}
            <TabsContent value='marine'>
              <div className='grid md:grid-cols-2 gap-8'>
                <Card className='border-blue-200 bg-blue-50'>
                  <CardHeader className='text-center'>
                    <div className='mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4'>
                      <Phone className='h-8 w-8 text-blue-600' />
                    </div>
                    <CardTitle className='text-blue-800'>
                      海巡署服務專線
                    </CardTitle>
                    <CardDescription className='text-blue-600'>
                      海上緊急救援與通報
                    </CardDescription>
                  </CardHeader>
                  <CardContent className='text-center'>
                    <div className='text-4xl font-bold text-blue-700 mb-4'>
                      118
                    </div>
                    <div className='space-y-2 text-sm text-blue-600'>
                      <p>• 海洋動物擱淺通報</p>
                      <p>• 海上緊急救援</p>
                      <p>• 海洋污染通報</p>
                      <p>• 24小時免費專線</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className='border-teal-200 bg-teal-50'>
                  <CardHeader className='text-center'>
                    <div className='mx-auto w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mb-4'>
                      <Waves className='h-8 w-8 text-teal-600' />
                    </div>
                    <CardTitle className='text-teal-800'>
                      海洋保育署 (OCA)
                    </CardTitle>
                    <CardDescription className='text-teal-600'>
                      海洋生物保育專責機關
                    </CardDescription>
                  </CardHeader>
                  <CardContent className='text-center'>
                    <div className='text-2xl font-bold text-teal-700 mb-4'>
                      海洋保育署
                    </div>
                    <div className='space-y-2 text-sm text-teal-600'>
                      <p>• 海洋保育諮詢</p>
                      <p>• 鯨豚擱淺救援</p>
                      <p>• 海龜救護通報</p>
                      <p>• 海洋生態保護</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className='mt-8'>
                <Card className='bg-gradient-to-r from-blue-50 to-teal-50'>
                  <CardHeader>
                    <CardTitle className='text-center text-gray-800'>
                      重要提醒
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='text-center text-gray-600 space-y-2'>
                      <p className='font-medium'>
                        發現海洋動物擱淺時，請勿直接接觸！
                      </p>
                      <p className='text-sm'>
                        立即撥打 118
                        海巡署專線，並保持安全距離等待專業人員到場處理。
                      </p>
                      <p className='text-sm text-blue-600'>
                        您的通報可能拯救一個珍貴的海洋生命！
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </section>
  );
}
