import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Container, Alert, Image } from 'react-bootstrap';
import { useAuth } from '@clerk/clerk-react';
import { fetchPet, Pet } from '../utils/fetchPets';
import { ArrowLeft } from 'lucide-react';

const Settings: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
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
    <Container className="mt-4">
      <div className="d-flex align-items-center mb-4">
        <Button
          variant="link"
          className="back-button"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={24} />
          Back
        </Button>
        <div className="ms-auto d-flex align-items-center">
          <h3 className="mb-0 me-2">{pet.name}'s Settings</h3>
          <Image
            src={`http://localhost:3001${pet.image_url}`}
            roundedCircle
            width={40}
            height={40}
            alt={`${pet.name}'s profile`}
          />
        </div>
      </div>

      {/* Future settings UI will go here */}
    </Container>
  );
};

export default Settings;
