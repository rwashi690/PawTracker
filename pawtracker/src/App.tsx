import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ClerkProvider } from '@clerk/clerk-react';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './styles/App.css';

import FrontPage from './pages/FrontPage';
import { SignIn } from '@clerk/clerk-react';
import Dashboard from './pages/Dashboard';
import PetProfile from './pages/PetProfile';
import Settings from './pages/Settings';
import ServiceDogTasks from './pages/ServiceDogTasks';
import Shots from './pages/Shots';
import PetFiles from './pages/PetFiles';  

import ClerkProtectedRoute from './components/ClerkProtectedRoute';

const clerkPubKey = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY || '';

if (!clerkPubKey) {
  throw new Error(
    'Missing REACT_APP_CLERK_PUBLISHABLE_KEY - Please add it to your .env file'
  );
}

function App() {
  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<FrontPage />} />
          <Route
            path="/sign-in/*"
            element={<SignIn routing="path" path="/sign-in" afterSignInUrl="/dashboard" />}
          />
          <Route
            path="/dashboard"
            element={
              <ClerkProtectedRoute>
                <Dashboard />
              </ClerkProtectedRoute>
            }
          />
          <Route
            path="/pet/:id"
            element={
              <ClerkProtectedRoute>
                <PetProfile />
              </ClerkProtectedRoute>
            }
          />
          <Route
            path="/pet/:id/settings"
            element={
              <ClerkProtectedRoute>
                <Settings />
              </ClerkProtectedRoute>
            }
          />
          <Route
            path="/pet/:petId/servicetasks"
            element={
              <ClerkProtectedRoute>
                <ServiceDogTasks />
              </ClerkProtectedRoute>
            }
          />
          <Route
            path="/pet/:petId/shots"
            element={
              <ClerkProtectedRoute>
                <Shots />
              </ClerkProtectedRoute>
            }
          />
          <Route
            path="/pet/:id/files"
            element={
              <ClerkProtectedRoute>
                <PetFiles />
              </ClerkProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </ClerkProvider>
  );
}

export default App;
