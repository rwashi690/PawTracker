import React, { useEffect } from 'react';
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  UserButton,
  useUser,
} from '@clerk/clerk-react';
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

const clerkPubKey = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY as string;

if (!clerkPubKey) {
  throw new Error(
    'Missing REACT_APP_CLERK_PUBLISHABLE_KEY - Please add it to your .env file'
  );
}

// Landing/Login page component
const LandingPage = () => {
  const { user } = useUser();

  if (user) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <div
      className="min-vh-100 d-flex align-items-center justify-content-center"
      style={{ backgroundColor: '#e6f3ff' }}
    >
      <div
        className="bg-white p-5 rounded shadow-lg w-100 border"
        style={{
          maxWidth: '500px',
          minHeight: '400px',
          borderColor: '#002D72',
          borderWidth: '2px',
        }}
      >
        <h1 className="text-center mb-5 fw-bold text-dark">
          Welcome to Paw Tracker 🐾
        </h1>
        <div className="d-flex flex-column align-items-center gap-3">
          <SignInButton mode="modal">
            <button
              className="btn w-100 text-white"
              style={{ backgroundColor: '#002D72' }}
            >
              Log In
            </button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button
              className="btn w-100 text-white"
              style={{ backgroundColor: '#002D72' }}
            >
              Sign Up
            </button>
          </SignUpButton>
        </div>
      </div>
    </div>
  );
};

// Dashboard page component
const createUserInDatabase = async (user: any) => {
  try {
    const response = await fetch('http://localhost:3001/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        clerkId: user.id,
        email: user.primaryEmailAddress?.emailAddress,
        firstName: user.firstName,
        lastName: user.lastName,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create user in database');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

const Dashboard = () => {
  const { user } = useUser();

  React.useEffect(() => {
    if (user) {
      createUserInDatabase(user).catch(console.error);
    }
  }, [user]);

  if (!user) {
    return <Navigate to="/" />;
  }

  return (
    <>
      <nav className="navbar navbar-light bg-white shadow">
        <div className="container-fluid">
          <span className="navbar-brand mb-0 h1">🐾 Paw Tracker</span>
          <UserButton afterSignOutUrl="/" />
        </div>
      </nav>
      <div className="bg-light min-vh-100 py-5">
        <div className="container">
          <div className="bg-white p-5 rounded shadow">
            <h1 className="mb-3">Welcome, {user.firstName}!</h1>
            <p>Start tracking your pet's activities and health records.</p>
          </div>
        </div>
      </div>
    </>
  );
};

function App() {
  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </BrowserRouter>
    </ClerkProvider>
  );
}

export default App;