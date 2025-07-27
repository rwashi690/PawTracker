// Ensure the API URL ends with a slash
const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// Log the API URL in development for debugging
if (process.env.NODE_ENV === 'development') {
  console.log('API_URL:', apiUrl);
}

export const API_URL = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
