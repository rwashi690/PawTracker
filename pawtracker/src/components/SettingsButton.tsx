import React from 'react';
import { Settings } from 'lucide-react';
import { Button } from 'react-bootstrap';
import '../styles/SettingsButton.css';

interface SettingsButtonProps {
  onClick: () => void;
  className?: string;
}

const SettingsButton: React.FC<SettingsButtonProps> = ({ onClick, className = '' }) => {
  return (
    <Button
      onClick={onClick}
      className={`custom-settings-button ${className}`}
      variant="link"
    >
      <Settings size={24} />
    </Button>
  );
};

export default SettingsButton;
