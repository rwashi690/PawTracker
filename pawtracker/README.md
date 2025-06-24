# PawTracker

A modern web application built with TypeScript, React, Tailwind CSS, PostgreSQL, and Bun.

## Tech Stack

- Frontend: React with TypeScript
- Styling: Tailwind CSS
- Runtime: Bun
- Database: PostgreSQL
- Deployment: Heroku

## Setup

1. Clone the repository
2. Copy `.env.example` to `.env` and configure your environment variables
3. Install dependencies:
   ```bash
   bun install
   ```
4. Start the development server:
   ```bash
   bun start
   ```

## Database Setup

1. Create a PostgreSQL database
2. Update the DATABASE_URL in your `.env` file

## Deployment

The application is configured for deployment on Heroku. Make sure to:

1. Create a new Heroku app
2. Add the PostgreSQL addon
3. Configure environment variables in Heroku dashboard
4. Deploy using Heroku Git or GitHub integration
