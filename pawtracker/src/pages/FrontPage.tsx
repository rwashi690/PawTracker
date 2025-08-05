import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SignInButton, SignUpButton, useUser } from '@clerk/clerk-react';
import { Container } from 'react-bootstrap';
import PawButton from '../components/PawButton';
import '../styles/FrontPage.css';

const FrontPage: React.FC = () => {
  const navigate = useNavigate();
  const { isSignedIn } = useUser();

  React.useEffect(() => {
    if (isSignedIn) {
      navigate('/dashboard');
    }
  }, [isSignedIn, navigate]);

  return (
    <Container
      fluid
      className="min-vh-100 d-flex align-items-center justify-content-center bg-light"
    >
      <div className="content-container">
        <h1>Welcome to PawTracker!</h1>
        <p>Keep track of your pets' information in one place</p>
        <div className="button-container">
          {!isSignedIn ? (
            <>
              <SignInButton mode="modal">
                <PawButton>
                  Sign In
                </PawButton>
              </SignInButton>
              <SignUpButton mode="modal">
                <PawButton>
                  Create Account
                </PawButton>
              </SignUpButton>
            </>
          ) : (
            <PawButton
              onClick={() => navigate('/dashboard')}
              className="mt-3"
            >
              Go to Dashboard
            </PawButton>
          )}
        </div>
      </div>
    </Container>
  );
};

export default FrontPage;
