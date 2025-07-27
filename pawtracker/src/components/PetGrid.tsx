// src/components/PetGrid.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Modal, Form, Alert, Spinner } from 'react-bootstrap';
import PawButton from './PawButton';
import { useAuth } from '@clerk/clerk-react';
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
      if (!token) throw new Error('Not authenticated');
      const form = new FormData();
      form.append('name', newPetName);
      form.append('image', selectedImage);

      const res = await fetch(`${API_URL}/api/pets`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to add pet');

      const addedPet = await res.json();
      setPets((ps) => [...ps, addedPet]);
      setShowModal(false);
      setNewPetName('');
      setSelectedImage(null);
    } catch (err) {
      console.error('Error adding pet:', err);
      setError('Failed to add pet. Please try again.');
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