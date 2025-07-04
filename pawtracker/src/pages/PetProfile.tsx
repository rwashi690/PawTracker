import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Container, Alert } from 'react-bootstrap';
import BackButton from '../components/BackButton';
import SettingsButton from '../components/SettingsButton';
import { useAuth } from '@clerk/clerk-react';
import '../styles/PetProfile.css';
import { fetchPet, Pet } from '../utils/fetchPets';

const PetProfile: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { getToken } = useAuth();
  const [pet, setPet] = React.useState<Pet | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const loadPet = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const data = await fetchPet(id, getToken);
        setPet(data);
      } catch (err: any) {
        console.error('Error fetching pet:', err);
        setError(err.message || 'Failed to load pet details');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      loadPet();
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
        <BackButton
          onClick={() => navigate('/dashboard')}
          className="back-button"
        />
        <h1 className="pet-name">{pet.name}'s Page</h1>
        <SettingsButton
          onClick={() => navigate(`/pet/${pet.id}/settings`)}
          className="settings-button"
        />
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
