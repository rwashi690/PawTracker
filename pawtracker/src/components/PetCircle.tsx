import React from 'react';
import { Image } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import '../styles/PetCircle.css';

interface PetCircleProps {
  id?: number;
  imageUrl?: string;
  name?: string;
  isAddButton?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

const PetCircle: React.FC<PetCircleProps> = ({
  id,
  imageUrl,
  name,
  isAddButton,
  size = 'md', // Default to medium size
  onClick,
}) => {
  const navigate = useNavigate();
  return (
    <div className="text-center">
      <div
        className={`pet-circle ${isAddButton ? 'add-button' : ''} ${size}`}
        onClick={isAddButton ? onClick : () => id && navigate(`/pet/${id}`)}
      >
        {isAddButton ? (
          <i className="bi bi-plus-lg"></i>
        ) : (
          imageUrl && (
            <>
              {console.log('Loading image from URL:', imageUrl)}
              <Image src={imageUrl} alt={name} onError={(e) => {
                console.error('Image failed to load:', imageUrl);
                console.error('Error event:', e);
              }} />
            </>
          )
        )}
      </div>
      {name && <div className="pet-name">{name}</div>}
    </div>
  );
};

export default PetCircle;