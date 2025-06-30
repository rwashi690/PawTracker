import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SignInButton, SignUpButton, useUser } from '@clerk/clerk-react';
import { Container, Row, Col, Button } from 'react-bootstrap';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { isSignedIn } = useUser();

  React.useEffect(() => {
    if (isSignedIn) {
      navigate('/dashboard');
    }
  }, [isSignedIn, navigate]);

  return (
    <Container fluid className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <Row className="w-100">
        <Col xs={12} md={6} className="mx-auto text-center">
          <h1 className="display-4 mb-4">🐾 PawTracker</h1>
          <p className="lead mb-5">
            Keep track of your pets' information in one place
          </p>
          {!isSignedIn ? (
            <div className="d-flex flex-column align-items-center gap-3">
              <SignInButton mode="modal">
                <Button variant="primary" size="lg" className="px-4">
                  Sign In
                </Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button variant="outline-primary" size="lg" className="px-4">
                  Create Account
                </Button>
              </SignUpButton>
            </div>
          ) : (
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate('/dashboard')}
              className="px-4"
            >
              Go to Dashboard
            </Button>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default HomePage;
