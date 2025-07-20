'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  MessageCircle,
  Star,
  Flag,
  Users,
  TrendingUp,
  Heart,
  Shield,
  Award
} from 'lucide-react';
import MessageCenter from '@/components/community/MessageCenter';
import ReviewSection from '@/components/community/ReviewSection';
import ReportCenter from '@/components/community/ReportCenter';

export default function CommunityPage() {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
        <Footer />
      </>
    );
  }

  if (!user) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <Card className="w-full max-w-md mx-auto">
            <CardHeader>
              <CardTitle>需要登入</CardTitle>
              <CardDescription>
                請先登入以使用社群功能
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => window.location.href = '/auth/login'}>
                前往登入
              </Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </>
    );
  }

  const renderOverview = () => (
    <div className="space-y-6">
      {/* 歡迎區塊 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            歡迎來到呼嚕社群
          </CardTitle>
          <CardDescription>
            與其他寵物愛好者交流，分享經驗，互相幫助
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <MessageCircle className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                <h3 className="font-semibold">留言討論</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  在寵物資訊下留言交流
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <MessageCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <h3 className="font-semibold">私人訊息</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  與其他用戶私下聯繫
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Star className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                <h3 className="font-semibold">用戶評價</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  評價其他用戶的服務
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Shield className="h-8 w-8 mx-auto mb-2 text-red-500" />
                <h3 className="font-semibold">安全舉報</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  維護社群安全環境
                </p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* 社群統計 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            社群動態
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">1,234</div>
              <div className="text-sm text-muted-foreground">活躍用戶</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">5,678</div>
              <div className="text-sm text-muted-foreground">留言數量</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">890</div>
              <div className="text-sm text-muted-foreground">成功配對</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">4.8</div>
              <div className="text-sm text-muted-foreground">平均評分</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 社群規範 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            社群規範
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <Badge variant="outline" className="mt-0.5">1</Badge>
            <div>
              <h4 className="font-medium">友善互動</h4>
              <p className="text-sm text-muted-foreground">
                保持禮貌和尊重，營造友善的交流環境
              </p>
            </div>
          </div>
          <Separator />
          <div className="flex items-start gap-3">
            <Badge variant="outline" className="mt-0.5">2</Badge>
            <div>
              <h4 className="font-medium">真實資訊</h4>
              <p className="text-sm text-muted-foreground">
                提供準確的寵物資訊，避免虛假或誤導性內容
              </p>
            </div>
          </div>
          <Separator />
          <div className="flex items-start gap-3">
            <Badge variant="outline" className="mt-0.5">3</Badge>
            <div>
              <h4 className="font-medium">保護隱私</h4>
              <p className="text-sm text-muted-foreground">
                尊重他人隱私，不分享個人敏感資訊
              </p>
            </div>
          </div>
          <Separator />
          <div className="flex items-start gap-3">
            <Badge variant="outline" className="mt-0.5">4</Badge>
            <div>
              <h4 className="font-medium">舉報違規</h4>
              <p className="text-sm text-muted-foreground">
                發現不當行為請及時舉報，共同維護社群秩序
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <>
      <Navbar />
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">社群中心</h1>
        <p className="text-muted-foreground">
          與寵物愛好者交流互動，分享經驗與心得
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            總覽
          </TabsTrigger>
          <TabsTrigger value="messages" className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            私訊
          </TabsTrigger>
          <TabsTrigger value="reviews" className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            評價
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <Flag className="h-4 w-4" />
            舉報
          </TabsTrigger>
          {user?.role === 'admin' && (
            <TabsTrigger value="admin" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              管理
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="overview">
          {renderOverview()}
        </TabsContent>

        <TabsContent value="messages">
          <Card>
            <CardHeader>
              <CardTitle>私人訊息</CardTitle>
              <CardDescription>
                與其他用戶進行私人對話
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MessageCenter />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reviews">
          <Card>
            <CardHeader>
              <CardTitle>用戶評價</CardTitle>
              <CardDescription>
                查看和管理用戶評價
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ReviewSection userId={user.id} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>舉報中心</CardTitle>
              <CardDescription>
                提交舉報或查看舉報狀態
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ReportCenter isAdmin={false} />
            </CardContent>
          </Card>
        </TabsContent>

        {user?.role === 'admin' && (
          <TabsContent value="admin">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  管理員面板
                </CardTitle>
                <CardDescription>
                  管理社群內容和用戶舉報
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ReportCenter isAdmin={true} />
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
        </div>
      </main>
      <Footer />
    </>
  );
}