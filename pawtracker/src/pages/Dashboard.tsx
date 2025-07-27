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

    const url = `${API_URL}/api/users`;
    console.log('Making request to:', url);
    console.log('Using token:', token ? 'Token present' : 'No token');

    const response = await fetch(url, {
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

    console.log('Response status:', response.status);
    
    // Get the response text first
    const responseText = await response.text();
    console.log('Response text:', responseText);
    
    let data: any;
    try {
      // Try to parse as JSON
      data = responseText ? JSON.parse(responseText) : {};
    } catch (e) {
      console.error('Failed to parse response as JSON:', e);
      // If it's not JSON, use the raw text as error
      throw new Error(`Invalid response from server: ${responseText.substring(0, 200)}`);
    }

    if (!response.ok) {
      // Check for duplicate key error (PostgreSQL error)
      const isDuplicateError = 
        data.error?.includes('users_clerk_id_key') || 
        data.error?.includes('duplicate key');
        
      if (!isDuplicateError) {
        throw new Error(data.error || `Request failed with status ${response.status}`);
      }
      // If it's a duplicate error, we can continue as the user already exists
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
