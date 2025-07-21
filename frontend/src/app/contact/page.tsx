'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Mail, Phone, MapPin, Clock, Send } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // 這裡可以添加實際的表單提交邏輯
      await new Promise(resolve => setTimeout(resolve, 1000)); // 模擬API調用

      toast({
        title: '訊息已送出',
        description: '感謝您的聯絡，我們會盡快回覆您！',
      });

      // 清空表單
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
      });
    } catch {
      toast({
        title: '送出失敗',
        description: '請稍後再試，或直接透過電話聯絡我們。',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='container mx-auto px-4 py-8 max-w-6xl'>
      {/* 頁面標題 */}
      <div className='text-center mb-12'>
        <h1 className='text-4xl font-bold text-gray-900 mb-4'>聯絡我們</h1>
        <p className='text-lg text-gray-600 max-w-2xl mx-auto'>
          有任何問題或建議嗎？我們很樂意聽到您的聲音，讓我們一起為毛孩們創造更美好的未來。
        </p>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
        {/* 聯絡表單 */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Send className='h-5 w-5 text-amber-600' />
              發送訊息
            </CardTitle>
            <CardDescription>請填寫以下表單，我們會盡快回覆您</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className='space-y-4'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <Label htmlFor='name'>姓名 *</Label>
                  <Input
                    id='name'
                    value={formData.name}
                    onChange={e => handleInputChange('name', e.target.value)}
                    placeholder='請輸入您的姓名'
                    required
                  />
                </div>
                <div>
                  <Label htmlFor='email'>電子郵件 *</Label>
                  <Input
                    id='email'
                    type='email'
                    value={formData.email}
                    onChange={e => handleInputChange('email', e.target.value)}
                    placeholder='請輸入您的電子郵件'
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor='subject'>主旨 *</Label>
                <Input
                  id='subject'
                  value={formData.subject}
                  onChange={e => handleInputChange('subject', e.target.value)}
                  placeholder='請簡述您的問題或建議'
                  required
                />
              </div>

              <div>
                <Label htmlFor='message'>詳細內容 *</Label>
                <Textarea
                  id='message'
                  value={formData.message}
                  onChange={e => handleInputChange('message', e.target.value)}
                  placeholder='請詳細描述您的問題、建議或需要協助的事項...'
                  rows={6}
                  required
                />
              </div>

              <Button
                type='submit'
                className='w-full bg-amber-600 hover:bg-amber-700'
                disabled={isSubmitting}
              >
                {isSubmitting ? '送出中...' : '發送訊息'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* 聯絡資訊 */}
        <div className='space-y-6'>
          {/* 聯絡方式 */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Phone className='h-5 w-5 text-amber-600' />
                聯絡方式
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex items-center gap-3'>
                <Mail className='h-5 w-5 text-gray-500' />
                <div>
                  <p className='font-medium'>電子郵件</p>
                  <p className='text-gray-600'>huluhulu@gmail.com</p>
                </div>
              </div>

              <div className='flex items-center gap-3'>
                <Phone className='h-5 w-5 text-gray-500' />
                <div>
                  <p className='font-medium'>客服專線</p>
                  <p className='text-gray-600'>0800-123-456</p>
                </div>
              </div>

              <div className='flex items-center gap-3'>
                <MapPin className='h-5 w-5 text-gray-500' />
                <div>
                  <p className='font-medium'>地址</p>
                  <p className='text-gray-600'>台中市北區北屯路14號</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 服務時間 */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Clock className='h-5 w-5 text-amber-600' />
                服務時間
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-2'>
                <div className='flex justify-between'>
                  <span className='font-medium'>週一至週五</span>
                  <span className='text-gray-600'>09:00 - 18:00</span>
                </div>
                <div className='flex justify-between'>
                  <span className='font-medium'>週六</span>
                  <span className='text-gray-600'>09:00 - 17:00</span>
                </div>
                <div className='flex justify-between'>
                  <span className='font-medium'>週日及國定假日</span>
                  <span className='text-gray-600'>休息</span>
                </div>
              </div>

              <div className='mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200'>
                <p className='text-sm text-amber-800'>
                  <strong>緊急情況：</strong>
                  如遇寵物緊急狀況，請直接撥打當地動物醫院或動保處電話。
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 常見問題 */}
          <Card>
            <CardHeader>
              <CardTitle>常見問題</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-3 text-sm'>
                <div>
                  <p className='font-medium text-gray-900'>
                    Q: 如何發布走失寵物資訊？
                  </p>
                  <p className='text-gray-600'>
                    A: 點擊首頁的「我的寵物走失了」按鈕，填寫詳細資訊即可發布。
                  </p>
                </div>

                <div>
                  <p className='font-medium text-gray-900'>
                    Q: 發現走失寵物該怎麼辦？
                  </p>
                  <p className='text-gray-600'>
                    A: 請點擊「我發現了寵物」填寫拾獲通報，幫助寵物回家。
                  </p>
                </div>

                <div>
                  <p className='font-medium text-gray-900'>
                    Q: 網站服務是免費的嗎？
                  </p>
                  <p className='text-gray-600'>
                    A: 是的，我們提供完全免費的寵物協尋服務。
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
