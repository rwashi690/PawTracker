// src/components/PetGrid.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Modal, Form, Alert, Spinner } from 'react-bootstrap';
import PawButton from './PawButton';
import { useAuth, useUser } from '@clerk/clerk-react';
import PetCircle from './PetCircle';
import '../styles/PetGrid.css';
import { API_URL } from '../config';

interface Pet {
  id: number;
  name: string;
  image_url: string;
  created_at: string;
  updated_at: string;
}

const PetGrid: React.FC = () => {
  const { getToken } = useAuth();
  const [pets, setPets] = useState<Pet[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [newPetName, setNewPetName] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { isSignedIn } = useUser();
  
  const fetchPets = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // First, ensure user is signed in
      if (!isSignedIn) {
        console.log('User not signed in, not fetching pets');
        return;
      }
      
      // Get the authentication token
      const token = await getToken();
      console.log('Auth token retrieved');
      
      if (!token) {
        console.error('No token available');
        return;
      }
      
      console.log('Fetching pets from:', `${API_URL}/api/pets`);
      
      const res = await fetch(`${API_URL}/api/pets`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Clerk-Session-Id': 'true'
        },
        credentials: 'include',
      });

      console.log('Response status:', res.status, res.statusText);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Error response:', errorText);
        
        if (res.status === 401) {
          setError('Your session has expired. Please sign in again.');
          return;
        }
        
        throw new Error(`Failed to fetch pets: ${res.status} ${res.statusText}`);
      }
      
      const data = await res.json();
      console.log('Pets data received:', data);
      setPets(data);
      
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load pets';
      console.error('Error in fetchPets:', errorMsg, err);
      
      if (errorMsg.includes('401') || errorMsg.includes('token')) {
        setError('Your session has expired. Please sign in again.');
      } else {
        setError('Failed to load pets. Please try again later.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [getToken, isSignedIn]);


  useEffect(() => { fetchPets(); }, [fetchPets]);

  const handleAddPet = () => setShowModal(true);
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setSelectedImage(e.target.files[0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPetName || !selectedImage) return;

    setIsLoading(true);
    setError(null);

    try {
      const token = await getToken();
      if (!token) {
        console.error('No authentication token available');
        setError('Please sign in to add a pet');
        return;
      }
      
      const formData = new FormData();
      formData.append('name', newPetName);
      formData.append('image', selectedImage);

      const res = await fetch(`${API_URL}/api/pets`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Clerk-Session-Id': 'true'
        },
        body: formData,
        credentials: 'include',
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Error adding pet:', res.status, errorText);
        
        if (res.status === 401) {
          setError('Your session has expired. Please sign in again.');
          return;
        }
        
        throw new Error(errorText || 'Failed to add pet');
      }

      const addedPet = await res.json();
      setPets((currentPets) => [...currentPets, addedPet]);
      setShowModal(false);
      setNewPetName('');
      setSelectedImage(null);
      
      // Refresh the pets list
      fetchPets();
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to add pet';
      console.error('Error in handleSubmit:', errorMsg, error);
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container className="py-4">
      {error && (
        <Alert variant="danger" onClose={() => setError(null)} dismissible>
          {error}
        </Alert>
      )}

      {isLoading && pets.length === 0 ? (
        <div className="text-center my-5">
          <Spinner animation="border" role="status" />
        </div>
      ) : pets.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-muted mb-3">No pets added yet.</p>
          <PawButton onClick={handleAddPet} className="btn-primary">
            Add Pet
          </PawButton>
        </div>
      ) : (
        <Row className="g-3">
          {pets.map((pet) => (
            <Col key={pet.id} xs={12} sm="auto">
              <PetCircle
                id={pet.id}
                imageUrl={`${API_URL}${pet.image_url}`}
                name={pet.name}
              />
            </Col>
          ))}
          <Col xs={12} sm="auto">
            <PetCircle isAddButton onClick={handleAddPet} />
          </Col>
        </Row>
      )}

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Add New Pet</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Pet Name</Form.Label>
              <Form.Control
                type="text"
                value={newPetName}
                onChange={(e) => setNewPetName(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Pet Photo</Form.Label>
              <Form.Control
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                required
              />
            </Form.Group>

            <div className="d-flex gap-2">
              <PawButton onClick={() => setShowModal(false)} className="flex-fill">
                Cancel
              </PawButton>
              <PawButton type="submit" disabled={isLoading} className="flex-fill">
                {isLoading ? 'Adding…' : 'Add Pet'}
              </PawButton>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default PetGrid;