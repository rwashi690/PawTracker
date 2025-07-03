import { type Request, type Response, type NextFunction } from 'express';
import { ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node';

// Ensure Clerk environment variables are set
if (!process.env.CLERK_PUBLISHABLE_KEY || !process.env.CLERK_SECRET_KEY) {
  console.error('Missing required Clerk environment variables');
  process.exit(1);
}

// Extend Express Request type to include auth property
declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId?: string;
        sessionId?: string;
        claims?: Record<string, any>;
      };
    }
  }
}

// Middleware to ensure user is authenticated
export const ensureAuthenticated = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    console.log('🔒 Auth Middleware - Request details:', {
      url: req.originalUrl,
      method: req.method,
      authHeader: req.headers.authorization,
      clerkToken: req.headers['clerk-token'],
      sessionId: req.headers['clerk-session-id'],
      sessionToken: req.headers['clerk-session-token'],
    });

    console.log('🔑 Clerk Configuration:', {
      publishableKey:
        process.env.CLERK_PUBLISHABLE_KEY?.substring(0, 8) + '...',
      secretKey: process.env.CLERK_SECRET_KEY ? '✓ Present' : '❌ Missing',
    });

    if (!process.env.CLERK_SECRET_KEY) {
      console.error('❌ Missing CLERK_SECRET_KEY');
      res.status(500).json({ error: 'Authentication configuration error' });
      return;
    }

    const clerkAuth = ClerkExpressRequireAuth();
    clerkAuth(req, res, (err?: any) => {
      if (err) {
        console.error('❌ Authentication error:', {
          message: err.message,
          stack: err.stack,
          type: err.type,
        });
        res
          .status(401)
          .json({ error: 'Authentication required', details: err.message });
        return;
      }

      console.log('✅ Auth successful:', {
        userId: req.auth?.userId,
        sessionId: req.auth?.sessionId,
        claims: req.auth?.claims,
      });

      if (!req.auth?.userId) {
        console.error('❌ No user ID in request after successful auth');
        res.status(401).json({ error: 'User ID not found' });
        return;
      }

      // Add user ID to request for downstream use
      req.auth = { ...req.auth, userId: req.auth.userId };
      console.log('✅ User ID set:', req.auth.userId);

      next();
    });
  } catch (error) {
    console.error('❌ Auth middleware error:', error);
    res.status(500).json({
      error: 'Authentication service error',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
