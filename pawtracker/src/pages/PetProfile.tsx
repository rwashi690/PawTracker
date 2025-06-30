import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Container, Button, Alert } from 'react-bootstrap';
import { ArrowLeft, Settings } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import '../styles/PetProfile.css';

interface Pet {
  id: number;
  name: string;
  image_url: string;
}

const PetProfile: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { getToken } = useAuth();
  const [pet, setPet] = React.useState<Pet | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchPet = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const token = await getToken();
        if (!token) {
          setError('Not authenticated. Please sign in.');
          return;
        }

        const response = await fetch(`http://localhost:3001/api/pets/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error('Failed to fetch pet details');
        }

        const data = await response.json();
        setPet(data);
      } catch (error) {
        console.error('Error fetching pet:', error);
        setError('Failed to load pet details');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchPet();
    }
  }, [id, getToken]);

  if (error) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  if (isLoading || !pet) {
    return (
      <Container className="text-center mt-4">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </Container>
    );
  }

  return (
    <Container fluid className="pet-profile">
      <div className="profile-header">
        <Button 
          variant="link" 
          className="back-button"
          onClick={() => navigate('/dashboard')}
        >
          <ArrowLeft size={24} />
          Back
        </Button>
        <h1 className="pet-name">{pet.name}'s Page</h1>
        <Button 
          variant="link" 
          className="settings-button"
          onClick={() => {/* TODO: Add settings functionality */}}
        >
          <Settings size={24} />
        </Button>
      </div>
      <div className="profile-image-container">
        <img 
          src={`http://localhost:3001${pet.image_url}`} 
          alt={pet.name} 
          className="profile-image"
        />
      </div>
    </Container>
  );
};

export default PetProfile;
