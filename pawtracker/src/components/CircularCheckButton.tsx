import React from 'react';
import { Check } from 'lucide-react';
import PawButton from './PawButton';

interface CircularCheckButtonProps {
  onClick: () => void;
  ariaLabel?: string;
  disabled?: boolean;
}

const CircularCheckButton: React.FC<CircularCheckButtonProps> = ({
  onClick,
  ariaLabel = 'Complete',
  disabled = false
}) => (
  <PawButton
    onClick={onClick}
    aria-label={ariaLabel}
    className="circular"
    disabled={disabled}
  >
    <Check size={14} strokeWidth={2.5} />
  </PawButton>
);

export default CircularCheckButton;