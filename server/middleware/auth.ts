import { type Request, type Response, type NextFunction } from 'express';
import { ClerkExpressRequireAuth, clerkClient } from '@clerk/clerk-sdk-node';
import { pool } from '../db/db.js';

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
        internalId: number;
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
    clerkAuth(req, res, async (err?: any) => {
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

      console.log(' Auth successful:', {
        userId: (req as any).auth?.userId,
        sessionId: (req as any).auth?.sessionId,
        claims: (req as any).auth?.claims,
      });

      if (!(req as any).auth?.userId) {
        console.error(' No user ID in request after successful auth');
        res.status(401).json({ error: 'User ID not found' });
        return;
      }

      const clerkUserId: string = (req as any).auth.userId as string;
      console.log(' User ID set:', clerkUserId);

      // Get internal user ID from clerk_id
      try {
        if (!clerkUserId) {
          throw new Error('No user ID in request');
        }

        const userQuery = 'SELECT id FROM users WHERE clerk_id = $1';
        console.log('Looking up user:', { clerkId: clerkUserId });
        const userResult = await pool.query(userQuery, [clerkUserId]);
        console.log('User lookup result:', userResult.rows);

        if (!userResult.rows[0]) {
          const clerkUser = await clerkClient.users.getUser(clerkUserId);
          const email = clerkUser.emailAddresses[0]?.emailAddress;
          if (!email) {
            throw new Error('User has no email address');
          }

          const insertQuery = `
            INSERT INTO users (clerk_id, email, first_name, last_name)
            VALUES ($1, $2, $3, $4)
            RETURNING id
          `;
          const insertResult = await pool.query(insertQuery, [
            clerkUserId,
            email,
            clerkUser.firstName || null,
            clerkUser.lastName || null
          ]);

          req.auth!.internalId = insertResult.rows[0].id;
          console.log('Created new user with ID:', req.auth!.internalId);
        } else {
          req.auth!.internalId = userResult.rows[0].id;
          console.log('Found existing user with ID:', req.auth!.internalId);
        }

        console.log('Set internal user ID:', req.auth!.internalId);
        next();
      } catch (error) {
        console.error('❌ Error getting/creating user:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });
  } catch (error) {
    console.error('❌ Auth middleware error:', error);
    res.status(500).json({
      error: 'Authentication service error',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
