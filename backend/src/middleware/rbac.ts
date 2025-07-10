import { Request, Response, NextFunction } from 'express';
import { IUser } from '../models/User';
import { AppError } from '../utils/errors';

// 定義權限枚舉
export enum Permission {
  // 用戶管理
  USER_READ = 'user:read',
  USER_WRITE = 'user:write',
  USER_DELETE = 'user:delete',
  USER_ADMIN = 'user:admin',
  
  // 寵物管理
  PET_READ = 'pet:read',
  PET_WRITE = 'pet:write',
  PET_DELETE = 'pet:delete',
  PET_MODERATE = 'pet:moderate',
  
  // 案件管理
  CASE_READ = 'case:read',
  CASE_WRITE = 'case:write',
  CASE_DELETE = 'case:delete',
  CASE_MODERATE = 'case:moderate',
  
  // 系統管理
  SYSTEM_CONFIG = 'system:config',
  SYSTEM_LOGS = 'system:logs',
  SYSTEM_BACKUP = 'system:backup',
  
  // 內容管理
  CONTENT_MODERATE = 'content:moderate',
  CONTENT_DELETE = 'content:delete',
  
  // 報告和分析
  ANALYTICS_READ = 'analytics:read',
  REPORTS_GENERATE = 'reports:generate',
}

// 定義角色和對應權限
export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  user: [
    Permission.USER_READ,
    Permission.PET_READ,
    Permission.CASE_READ,
    Permission.CASE_WRITE,
  ],
  moderator: [
    Permission.USER_READ,
    Permission.PET_READ,
    Permission.PET_WRITE,
    Permission.PET_MODERATE,
    Permission.CASE_READ,
    Permission.CASE_WRITE,
    Permission.CASE_MODERATE,
    Permission.CONTENT_MODERATE,
  ],
  admin: [
    Permission.USER_READ,
    Permission.USER_WRITE,
    Permission.USER_DELETE,
    Permission.USER_ADMIN,
    Permission.PET_READ,
    Permission.PET_WRITE,
    Permission.PET_DELETE,
    Permission.PET_MODERATE,
    Permission.CASE_READ,
    Permission.CASE_WRITE,
    Permission.CASE_DELETE,
    Permission.CASE_MODERATE,
    Permission.SYSTEM_CONFIG,
    Permission.SYSTEM_LOGS,
    Permission.SYSTEM_BACKUP,
    Permission.CONTENT_MODERATE,
    Permission.CONTENT_DELETE,
    Permission.ANALYTICS_READ,
    Permission.REPORTS_GENERATE,
  ],
};

// 檢查用戶是否有特定權限
export function hasPermission(user: IUser, permission: Permission): boolean {
  const userPermissions = ROLE_PERMISSIONS[user.role] || [];
  return userPermissions.includes(permission);
}

// 檢查用戶是否有任一權限
export function hasAnyPermission(user: IUser, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(user, permission));
}

// 檢查用戶是否有所有權限
export function hasAllPermissions(user: IUser, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(user, permission));
}

// 權限檢查中介軟體
export function requirePermission(permission: Permission) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req.user as IUser);
    
    if (!user) {
      throw new AppError('未授權訪問', 401);
    }
    
    if (!hasPermission(user, permission)) {
      throw new AppError('權限不足', 403);
    }
    
    next();
  };
}

// 多權限檢查中介軟體（需要任一權限）
export function requireAnyPermission(permissions: Permission[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req.user as IUser);
    
    if (!user) {
      throw new AppError('未授權訪問', 401);
    }
    
    if (!hasAnyPermission(user, permissions)) {
      throw new AppError('權限不足', 403);
    }
    
    next();
  };
}

// 多權限檢查中介軟體（需要所有權限）
export function requireAllPermissions(permissions: Permission[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req.user as IUser);
    
    if (!user) {
      throw new AppError('未授權訪問', 401);
    }
    
    if (!hasAllPermissions(user, permissions)) {
      throw new AppError('權限不足', 403);
    }
    
    next();
  };
}

// 資源擁有者或管理員檢查
export function requireOwnershipOrPermission(permission: Permission) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req.user as IUser);
    const resourceUserId = req.params.userId || req.params.id;
    
    if (!user) {
      throw new AppError('未授權訪問', 401);
    }
    
    // 檢查是否為資源擁有者
    const isOwner = user._id.toString() === resourceUserId;
    
    // 檢查是否有管理權限
    const hasAdminPermission = hasPermission(user, permission);
    
    if (!isOwner && !hasAdminPermission) {
      throw new AppError('權限不足', 403);
    }
    
    next();
  };
}

// 角色檢查中介軟體
export function requireRole(roles: string | string[]) {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req.user as IUser);
    
    if (!user) {
      throw new AppError('未授權訪問', 401);
    }
    
    if (!allowedRoles.includes(user.role)) {
      throw new AppError('角色權限不足', 403);
    }
    
    next();
  };
}

// 帳號狀態檢查中介軟體
export function requireActiveAccount(req: Request, res: Response, next: NextFunction): void {
  const user = (req.user as IUser);
  
  if (!user) {
    throw new AppError('未授權訪問', 401);
  }
  
  if (!user.isActive) {
    throw new AppError('帳號已被停用', 403);
  }
  
  next();
}

// 郵箱驗證檢查中介軟體
export function requireEmailVerification(req: Request, res: Response, next: NextFunction): void {
  const user = (req.user as IUser);
  
  if (!user) {
    throw new AppError('未授權訪問', 401);
  }
  
  if (!user.isEmailVerified) {
    throw new AppError('請先驗證您的電子郵件', 403);
  }
  
  next();
}

// 組合中介軟體：檢查認證、帳號狀態和權限
export function requireAuthAndPermission(permission: Permission) {
  return [
    requireActiveAccount,
    requireEmailVerification,
    requirePermission(permission)
  ];
}

// 獲取用戶權限列表
export function getUserPermissions(user: IUser): Permission[] {
  return ROLE_PERMISSIONS[user.role] || [];
}

// 檢查用戶是否可以訪問資源
export function canAccessResource(
  user: IUser, 
  resourceOwnerId: string, 
  requiredPermission?: Permission
): boolean {
  // 檢查是否為資源擁有者
  if (user._id.toString() === resourceOwnerId) {
    return true;
  }
  
  // 檢查是否有管理權限
  if (requiredPermission && hasPermission(user, requiredPermission)) {
    return true;
  }
  
  return false;
}