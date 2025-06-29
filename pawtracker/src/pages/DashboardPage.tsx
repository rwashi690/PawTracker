import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UserButton, useUser } from '@clerk/clerk-react';
import { Container, Row, Col, Navbar } from 'react-bootstrap';
import PetGrid from '../components/PetGrid';

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

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { isSignedIn, user } = useUser();
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    if (!isSignedIn) {
      navigate('/');
      return;
    }

    const initializeUser = async () => {
      if (user) {
        try {
          await createUserInDatabase(user);
          setIsLoading(false);
        } catch (error) {
          console.error('Failed to initialize user:', error);
          // If we can't create the user, redirect to home
          navigate('/');
        }
      }
    };

    initializeUser();
  }, [isSignedIn, navigate, user]);

  if (!isSignedIn || !user || isLoading) {
    return <div className="min-vh-100 d-flex align-items-center justify-content-center">
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>;
  }

  return (
    <div className="min-vh-100 bg-light">
      <Navbar bg="white" expand="lg" className="shadow-sm mb-4">
        <Container>
          <Navbar.Brand href="/dashboard">PawTracker</Navbar.Brand>
          <div className="ms-auto d-flex align-items-center gap-3">
            <span>Welcome, {user.firstName || 'User'}!</span>
            <UserButton />
          </div>
        </Container>
      </Navbar>

      <Container>
        <Row>
          <Col>
            <h1 className="mb-4">My Pets</h1>
            <PetGrid />
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default DashboardPage;
