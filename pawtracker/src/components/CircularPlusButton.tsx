import React from 'react';
import { Plus } from 'lucide-react';
import PawButton from './PawButton';

interface CircularPlusButtonProps {
  onClick: () => void;
  ariaLabel?: string;
}

const CircularPlusButton: React.FC<CircularPlusButtonProps> = ({ 
  onClick,
  ariaLabel = 'Add'
}) => {
  return (
    <PawButton
      onClick={onClick}
      aria-label={ariaLabel}
      className="circular"
    >
      <Plus size={14} strokeWidth={2.5} />
    </PawButton>
  );
};

export default CircularPlusButton;