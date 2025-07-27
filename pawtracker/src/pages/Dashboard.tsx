import React from 'react';
import { Navigate } from 'react-router-dom';
import { UserButton, useUser, useAuth } from '@clerk/clerk-react';
import { API_URL } from '../config';

import PetGrid from '../components/PetGrid';

const createUserInDatabase = async (
  user: any,
  getToken: () => Promise<string | null>
) => {
  try {
    const token = await getToken();
    if (!token) throw new Error('Failed to get authentication token');

    const response = await fetch(`${API_URL}/api/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        clerkId: user.id,
        email: user.primaryEmailAddress?.emailAddress,
        firstName: user.firstName,
        lastName: user.lastName,
      }),
    });

    const contentType = response.headers.get('content-type');
    let data: any;

    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = { error: text };
    }

    if (!response.ok && !data.error?.includes('users_clerk_id_key')) {
      throw new Error(data.error || 'Failed to create user in database');
    }

    return data;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error instanceof Error ? error : new Error(String(error));
  }
};

const Dashboard = () => {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const initializeUser = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        setError(null);
        await createUserInDatabase(user, getToken);
      } catch (err) {
        console.error('Error initializing user:', err);
        // Don't show the duplicate key error to users
        if (
          err instanceof Error &&
          !err.message.includes('users_clerk_id_key')
        ) {
          setError(
            'Error initializing user data. Please try refreshing the page.'
          );
        }
      } finally {
        setIsLoading(false);
      }
    };

    initializeUser();
  }, [user, getToken]);

  if (!user) {
    return <Navigate to="/" />;
  }

  if (isLoading) {
    return (
      <div className="container py-4 text-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Welcome, {user.firstName}! 🐾</h1>
        <UserButton />
      </div>
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}
      <PetGrid />
    </div>
  );
};

export default Dashboard;
