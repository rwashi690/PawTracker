import React, { useState, useEffect, useCallback } from 'react';
import { Container, Modal, Form, Button, Alert } from 'react-bootstrap';
import { useAuth } from '@clerk/clerk-react';
import PetCircle from './PetCircle';
import '../styles/PetGrid.css';

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

  const fetchPets = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const token = await getToken();
      if (!token) {
        setError('Not authenticated. Please sign in.');
        return;
      }
      const response = await fetch('http://localhost:3001/api/pets', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch pets');
      }
      const data = await response.json();
      setPets(data);
    } catch (error) {
      console.error('Error fetching pets:', error);
      setError('Failed to load pets. Please try refreshing the page.');
    } finally {
      setIsLoading(false);
    }
  }, [getToken, setError, setPets]);

  useEffect(() => {
    fetchPets();
  }, [fetchPets]);

  const handleAddPet = () => {
    setShowModal(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedImage(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedImage || !newPetName) return;

    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('image', selectedImage);
    formData.append('name', newPetName);

    try {
      const token = await getToken();
      if (!token) {
        setError('Not authenticated. Please sign in.');
        return;
      }

      // No Content-Type header needed for FormData, browser will set it automatically
      const response = await fetch('http://localhost:3001/api/pets', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
        credentials: 'include'
      });
      
      if (response.status === 404) {
        throw new Error('User not found. Please make sure you are properly signed in.');
      }
      
      if (!response.ok) {
        throw new Error('Failed to add pet');
      }

      const newPet = await response.json();
      setPets([...pets, newPet]);
      setShowModal(false);
      setNewPetName('');
      setSelectedImage(null);
    } catch (error) {
      console.error('Error adding pet:', error);
      setError('Failed to add pet. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container>
      <div className="pet-grid">
        {error && (
          <Alert variant="danger" className="w-100" onClose={() => setError(null)} dismissible>
            {error}
          </Alert>
        )}
        
        {isLoading ? (
          <div className="text-center w-100 py-4">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading pets...</span>
            </div>
          </div>
        ) : (
          <>
            {pets.length === 0 ? (
              <div className="text-center w-100 py-4">
                <p className="text-muted mb-3">No pets added yet.</p>
                <Button variant="primary" onClick={handleAddPet}>
                  Add Your First Pet
                </Button>
              </div>
            ) : (
              <>
                {pets.map((pet) => (
                  <PetCircle
                    key={pet.id}
                    imageUrl={`http://localhost:3001${pet.image_url}`}
                    name={pet.name}
                  />
                ))}
                <PetCircle isAddButton onClick={handleAddPet} />
              </>
            )}
          </>
        )}
      </div>

      <Modal show={showModal} onHide={() => setShowModal(false)}>
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
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPetName(e.target.value)}
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
            <div className="modal-buttons">
              <Button variant="secondary" onClick={() => setShowModal(false)} className="w-100">
                Cancel
              </Button>
              <Button variant="primary" type="submit" disabled={isLoading} className="w-100">
                {isLoading ? 'Adding...' : 'Add Pet'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default PetGrid;