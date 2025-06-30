import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ClerkProvider } from '@clerk/clerk-react';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './styles/App.css';

import FrontPage from './pages/FrontPage';
import Dashboard from './pages/Dashboard';

import ClerkProtectedRoute from './components/ClerkProtectedRoute';

const clerkPubKey = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY || '';

if (!clerkPubKey) {
  throw new Error('Missing REACT_APP_CLERK_PUBLISHABLE_KEY - Please add it to your .env file');
}

function App() {
  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<FrontPage />} />
          <Route path="/sign-in/*" element={<FrontPage />} />
          <Route path="/sign-up/*" element={<FrontPage />} />
          <Route
            path="/dashboard"
            element={
              <ClerkProtectedRoute>
                <Dashboard />
              </ClerkProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </ClerkProvider>
  );
}

export default App;