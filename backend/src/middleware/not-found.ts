import { Request, Response, NextFunction } from 'express';
import { NotFoundError } from '../utils/errors';

/**
 * 404 Not Found 中介軟體
 * 當沒有路由匹配時，會執行此中介軟體
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const error = new NotFoundError(
    `API 端點 ${req.method} ${req.originalUrl} 不存在`
  );
  
  next(error);
};

export default notFoundHandler;