// Hardcode the production API URL
const PRODUCTION_API_URL = 'https://pawtracker.fly.dev';

// In development, use the environment variable or default to localhost
const DEVELOPMENT_API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// Use the appropriate URL based on the environment
const apiUrl = process.env.NODE_ENV === 'production' 
  ? PRODUCTION_API_URL 
  : DEVELOPMENT_API_URL;

// Log the API URL for debugging (only in development)
if (process.env.NODE_ENV !== 'production') {
  console.log('Using API URL:', apiUrl);
}

// Ensure the API URL doesn't end with a slash
export const API_URL = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
