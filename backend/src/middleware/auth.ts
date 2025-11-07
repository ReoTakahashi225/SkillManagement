import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../utils/jwt';

// Express Requestの型を拡張してユーザー情報を含める
export interface AuthRequest extends Request {
  user?: JwtPayload;
}

// 認証ミドルウェア
export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    // Authorizationヘッダーからトークンを取得
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const token = authHeader.substring(7); // 'Bearer 'プレフィックスを削除

    // トークンを検証
    const decoded = verifyToken(token);

    // ユーザー情報をリクエストに追加
    req.user = decoded;

    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// 管理者専用ミドルウェア（authenticateミドルウェアの後に使用する必要があります）
export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (req.user.role !== 'admin') {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }

    next();
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
