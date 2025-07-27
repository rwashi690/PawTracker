// src/components/PetGrid.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { API_URL } from '../config';
import { Container, Row, Col, Modal, Form, Alert, Spinner } from 'react-bootstrap';
import PawButton from './PawButton';
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
      const res = await fetch(`${API_URL}/api/pets`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch pets');
      setPets(await res.json());
    } catch (err) {
      console.error('Error fetching pets:', err);
      setError('Failed to load pets. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [getToken]);

  useEffect(() => { fetchPets(); }, [fetchPets]);

  const handleAddPet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPetName.trim() || !selectedImage) return;

    const formData = new FormData();
    formData.append('name', newPetName);
    formData.append('image', selectedImage);

    try {
      setIsLoading(true);
      setError(null);
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');

      const res = await fetch(`${API_URL}/api/pets`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to add pet');
      }

      const newPet = await res.json();
      setPets([...pets, newPet]);
      setShowModal(false);
      setNewPetName('');
      setSelectedImage(null);
    } catch (err) {
      console.error('Error adding pet:', err);
      setError(err instanceof Error ? err.message : 'Failed to add pet');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedImage(e.target.files[0]);
    }
  };

  return (
    <div className="pet-grid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>My Pets</h2>
        <PawButton onClick={() => setShowModal(true)}>+ Add Pet</PawButton>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {isLoading ? (
        <div className="text-center">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      ) : pets.length === 0 ? (
        <div className="text-center py-5">
          <p>No pets added yet. Add your first pet!</p>
        </div>
      ) : (
        <Row xs={1} sm={2} md={3} lg={4} className="g-4">
          {pets.map((pet) => (
            <Col key={pet.id}>
              <PetCircle pet={pet} onUpdate={fetchPets} />
            </Col>
          ))}
        </Row>
      )}

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add New Pet</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleAddPet}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Pet Name</Form.Label>
              <Form.Control
                type="text"
                value={newPetName}
                onChange={(e) => setNewPetName(e.target.value)}
                placeholder="Enter pet name"
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Pet Image</Form.Label>
              <Form.Control
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                required
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <PawButton variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </PawButton>
            <PawButton type="submit" disabled={isLoading}>
              {isLoading ? 'Adding...' : 'Add Pet'}
            </PawButton>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default PetGrid;
