// Force localhost in development, use environment variable in production
const API_URL = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:3001' 
  : process.env.REACT_APP_API_URL || 'http://localhost:3001';

// Debug log
console.log('API Configuration:', {
  NODE_ENV: process.env.NODE_ENV,
  REACT_APP_API_URL: process.env.REACT_APP_API_URL,
  Using_API_URL: API_URL
});

export { API_URL };