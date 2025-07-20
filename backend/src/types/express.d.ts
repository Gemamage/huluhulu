import { Request } from "express";

declare global {
  namespace Express {
    interface Request {
      validatedData?: any;
      validatedQuery?: any;
      user?: {
        id: string;
        email: string;
        name: string;
        role: string;
      };
    }
  }
}
