import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from 'react-bootstrap';
import '../styles/BackButton.css';

interface BackButtonProps {
  onClick: () => void;
  className?: string;
}

const BackButton: React.FC<BackButtonProps> = ({ onClick, className = '' }) => {
  return (
    <Button
      onClick={onClick}
      className={`custom-back-button ${className}`}
      variant="link"
    >
      <ArrowLeft size={24} />
      <span>Back</span>
    </Button>
  );
};

export default BackButton;
