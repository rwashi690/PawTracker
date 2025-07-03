import React from 'react';
import { useParams } from 'react-router-dom';

const Settings: React.FC = () => {
  const { id } = useParams();

  return (
    <div className="container mt-4">
      <h1>Pet Settings</h1>
      <p>Settings for pet ID: {id}</p>
    </div>
  );
};

export default Settings;
