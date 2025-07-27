import React from 'react';
import { Image } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import '../styles/PetCircle.css';

interface Pet {
  id: number;
  name: string;
  image_url: string;
  created_at: string;
  updated_at: string;
}

interface PetCircleProps {
  pet: Pet;
  onUpdate: () => Promise<void>;
}

const PetCircle: React.FC<PetCircleProps> = ({ pet, onUpdate }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/pet/${pet.id}`);
  };

  return (
    <div className="pet-circle" onClick={handleClick}>
      <div className="pet-image-container">
        {pet.image_url ? (
          <Image src={pet.image_url} alt={pet.name} roundedCircle fluid />
        ) : (
          <div className="pet-initial">{pet.name?.charAt(0).toUpperCase()}</div>
        )}
      </div>
      <div className="pet-name">{pet.name}</div>
    </div>
  );
};

export default PetCircle;
