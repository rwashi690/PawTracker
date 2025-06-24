import React, { useState } from 'react';
import { Container, Modal, Form, Button } from 'react-bootstrap';
import PetCircle from './PetCircle';
import '../styles/PetGrid.css';

interface Pet {
  id: number;
  name: string;
  imageUrl: string;
}

const PetGrid: React.FC = () => {
  const [pets, setPets] = useState<Pet[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [newPetName, setNewPetName] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

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

    // Create FormData for file upload
    const formData = new FormData();
    formData.append('image', selectedImage);
    formData.append('name', newPetName);

    try {
      // TODO: Replace with actual API endpoint
      const response = await fetch('/api/pets', {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        const newPet = await response.json();
        setPets([...pets, newPet]);
        setShowModal(false);
        setNewPetName('');
        setSelectedImage(null);
      }
    } catch (error) {
      console.error('Error adding pet:', error);
    }
  };

  return (
    <Container>
      <div className="pet-grid">
        {pets.map((pet) => (
          <PetCircle
            key={pet.id}
            imageUrl={pet.imageUrl}
            name={pet.name}
          />
        ))}
        <PetCircle isAddButton onClick={handleAddPet} />
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
            <div className="d-flex justify-content-end gap-2">
              <Button variant="secondary" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                Add Pet
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default PetGrid;
