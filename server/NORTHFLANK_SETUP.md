# Northflank Deployment Setup

## Stack Configuration
- **Frontend**: Netlify (free)
- **Backend**: Northflank (free tier with persistent storage)
- **Database**: Northflank PostgreSQL (free tier)
- **File Storage**: Northflank persistent volume (10GB)

## Deployment Steps

### 1. Create Northflank Account
1. Go to [northflank.com](https://northflank.com)
2. Sign up for a free account
3. Create a new project called "pawtracker"

### 2. Deploy Database
1. In your Northflank project, click "Add Service"
2. Select "Database"
3. Choose "PostgreSQL"
4. Use the configuration from `northflank-database.json`
5. Name it "pawtracker-database"
6. Deploy

### 3. Deploy Backend
1. In your Northflank project, click "Add Service"
2. Select "Combined Service" (or "Docker Service")
3. Connect your GitHub repository
4. Use the repository root as the build context
5. In build options, specify the Dockerfile path: `Dockerfile` (at repository root)
6. Add the following environment variables:

### Required Environment Variables
- `DATABASE_URL` - Get this from the Northflank database service (click on database → Connection → Connection String)
- `CLERK_SECRET_KEY` - Your Clerk secret key from Clerk dashboard
- `CLERK_PUBLISHABLE_KEY` - Your Clerk publishable key from Clerk dashboard
- `FRONTEND_URL` - Your Netlify URL (e.g., https://pawtracker.netlify.app)
- `NODE_ENV` - Set to `production`
- `PORT` - Set to `3001`

### 4. Configure Persistent Storage
The `northflank.json` already includes a 10GB volume mounted at `/app/uploads` for file storage.

### 5. Run Migrations
After deployment, you'll need to run the database migrations:
1. Access the Northflank service logs
2. SSH into the container (if available) or use the Northflank console
3. Run: `node db/run-migrations.js`

### 6. Update Frontend
Update the frontend environment variable to point to the new Northflank backend URL:
- `REACT_APP_API_URL` - Your Northflank backend URL (e.g., https://pawtracker-backend.northflank.com)

### 7. Deploy Frontend to Netlify
1. Connect your GitHub repository to Netlify
2. Use the existing `netlify.toml` configuration
3. Set the `REACT_APP_API_URL` environment variable in Netlify
4. Deploy

## Free Tier Limits
- **2 services** (backend + cron jobs)
- **2 cron jobs** 
- **1 database** (PostgreSQL)
- **10GB storage** per volume
- **0.25 vCPU, 256MB RAM** per service

## Cost
This entire stack is **free** on Northflank's free tier.
