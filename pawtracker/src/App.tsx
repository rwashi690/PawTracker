import React from 'react';
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  UserButton,
  useUser,
} from '@clerk/clerk-react';
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/App.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import PetGrid from './components/PetGrid';

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
    <div className="landing-page">
      <div className="login-container">
        <h1 className="text-center mb-5 fw-bold text-dark">
          Welcome to Paw Tracker 🐾
        </h1>
        <div className="d-flex flex-column align-items-center gap-3">
          <SignInButton mode="modal">
            <button className="btn text-white auth-button">
              Log In
            </button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button className="btn text-white auth-button">
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
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Welcome, {user.firstName}! 🐾</h1>
        <UserButton />
      </div>
      <PetGrid />
    </div>
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