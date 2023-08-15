// types/express.d.ts

declare namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        firstname: string;
        lastname: string;
        role: string;
      };
    }
  }
  