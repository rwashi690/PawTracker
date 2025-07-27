import React from 'react';
import { Button, ButtonProps } from 'react-bootstrap';
import '../styles/PawButton.css';

interface PawButtonProps extends Omit<ButtonProps, 'variant'> {
  variant?: 'primary' | 'secondary' | 'danger';
}

const PawButton: React.FC<PawButtonProps> = ({ variant = 'primary', className = '', ...props }) => {
  // Map our custom variants to Bootstrap's variants
  const getBootstrapVariant = () => {
    switch (variant) {
      case 'danger':
        return 'danger';
      case 'secondary':
        return 'secondary';
      case 'primary':
      default:
        return 'primary';
    }
  };

  return (
    <Button
      {...props}
      variant={getBootstrapVariant()}
      className={`paw-button ${className}`}
    />
  );
};

export default PawButton;
