// Get the API URL from environment variables or use the production URL as fallback
const getApiUrl = () => {
  // In production, use the hardcoded production URL
  if (process.env.NODE_ENV === 'production') {
    return 'https://pawtracker.fly.dev';
  }
  // In development, use the environment variable or default to localhost
  return process.env.REACT_APP_API_URL || 'http://localhost:3001';
};

const apiUrl = getApiUrl();

// Log the API URL for debugging
console.log('API_URL:', apiUrl);

// Ensure the API URL doesn't end with a slash
export const API_URL = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
