import { Request } from 'express';

export interface AuthenticatedUser {
  userId: number;
  username: string;
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}
