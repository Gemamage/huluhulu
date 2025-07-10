'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/auth-context';
import {
  User,
  LogOut,
  Settings,
  Mail,
  Heart,
  Search,
  Plus,
  ShoppingCart,
  HelpCircle,
} from 'lucide-react';

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('登出失敗:', error);
    }
  };

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-white shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between py-4">
        {/* Logo - 左邊 */}
        <div className="flex items-center">
          <Link href="/" className="flex items-center space-x-2">
            <Heart className="h-6 w-6" style={{color: '#FF8C69'}} />
            <span className="text-xl font-bold" style={{color: '#333333'}}>呼嚕</span>
          </Link>
        </div>

        {/* Navigation Links - 中間 */}
        <div className="hidden md:flex items-center space-x-8">
          <Link
            href="/pets/new"
            className="text-lg font-medium text-zinc-700 transition-colors duration-300 hover:text-amber-600"
          >
            拾獲通報
          </Link>
          <Link
            href="/pets/lost"
            className="text-lg font-medium text-zinc-700 transition-colors duration-300 hover:text-amber-600"
          >
            走失尋找
          </Link>
          <Link
            href="/about"
            className="text-lg font-medium text-zinc-700 transition-colors duration-300 hover:text-amber-600"
          >
            關於我們
          </Link>
          <Link
            href="/contact"
            className="text-lg font-medium text-zinc-700 transition-colors duration-300 hover:text-amber-600"
          >
            聯絡我們
          </Link>
        </div>

        {/* User Menu - 右邊 */}
        <div className="flex items-center space-x-4">
          {isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {getUserInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.name}</p>
                    <div className="flex items-center space-x-2">
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                      {!user.isEmailVerified && (
                        <Badge variant="secondary" className="text-xs">
                          <Mail className="h-3 w-3 mr-1" />
                          未驗證
                        </Badge>
                      )}
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    <span>個人資料</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/pets/my" className="flex items-center">
                    <Heart className="mr-2 h-4 w-4" />
                    <span>我的協尋</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="flex items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>設定</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-600 focus:text-red-600"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>登出</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center space-x-3">
              <button className="text-sm text-gray-600 hover:text-gray-800 transition-colors">
                ?
              </button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/auth/login">登入</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/auth/register">註冊</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}