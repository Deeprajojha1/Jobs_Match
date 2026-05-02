import type { UserRole } from "./types/app.js";

declare global {
  interface Error {
    statusCode?: number;
    code?: string | number;
  }

  namespace Express {
    interface Request {
      user?: {
        id: string;
        name: string;
        email: string;
        role: UserRole;
      };
    }
  }
}

export {};
