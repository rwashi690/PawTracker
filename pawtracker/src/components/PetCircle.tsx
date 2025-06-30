import React from 'react';
import { Image } from 'react-bootstrap';
import '../styles/PetCircle.css';

interface PetCircleProps {
  imageUrl?: string;
  name?: string;
  isAddButton?: boolean;
  onClick?: () => void;
}

const PetCircle: React.FC<PetCircleProps> = ({ imageUrl, name, isAddButton, onClick }) => {
  return (
    <div className="text-center">
      <div className={`pet-circle ${isAddButton ? 'add-button' : ''}`} onClick={onClick}>
        {isAddButton ? (
          <i className="bi bi-plus-lg"></i>
        ) : (
          imageUrl && <Image src={imageUrl} alt={name} />
        )}
      </div>
      {name && <div className="pet-name">{name}</div>}
    </div>
  );
};

export default PetCircle;
