import React from 'react';
import { Button, ButtonProps } from 'react-bootstrap';
import '../styles/PawButton.css';

interface PawButtonProps extends Omit<ButtonProps, 'variant'> {
  variant?: 'primary' | 'danger';
}

const PawButton: React.FC<PawButtonProps> = ({ variant = 'primary', className = '', ...props }) => {
  return (
    <Button
      {...props}
      variant={variant === 'danger' ? 'danger' : 'primary'}
      className={`paw-button ${className}`}
    />
  );
};

export default PawButton;
