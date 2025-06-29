import React from 'react';
import { UserButton, useUser } from '@clerk/clerk-react';
import { Container, Row, Col, Navbar } from 'react-bootstrap';
import PetGrid from '../components/PetGrid';

const Dashboard: React.FC = () => {
  const { user } = useUser();

  return (
    <div className="min-vh-100 bg-light">
      <Navbar bg="white" expand="lg" className="shadow-sm mb-4">
        <Container>
          <Navbar.Brand href="/dashboard">PawTracker</Navbar.Brand>
          <div className="ms-auto d-flex align-items-center gap-3">
            <span>Welcome, {user?.firstName || 'User'}!</span>
            <UserButton afterSignOutUrl="/" />
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

export default Dashboard;
