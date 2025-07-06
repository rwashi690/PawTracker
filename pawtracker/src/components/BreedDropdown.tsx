import React, { useEffect, useState } from 'react';
import { Form } from 'react-bootstrap';

interface BreedDropdownProps {
  species: string;
  value: string;
  onChange: (value: string) => void;
}

interface Breed {
  id: string;
  name: string;
}

const defaultBreeds = {
  canine: [
    { id: 'lab', name: 'Labrador Retriever' },
    { id: 'german', name: 'German Shepherd' },
    { id: 'golden', name: 'Golden Retriever' },
    { id: 'bulldog', name: 'Bulldog' },
    { id: 'beagle', name: 'Beagle' },
    { id: 'poodle', name: 'Poodle' },
    { id: 'rottweiler', name: 'Rottweiler' },
    { id: 'yorkshire', name: 'Yorkshire Terrier' },
    { id: 'boxer', name: 'Boxer' },
    { id: 'other', name: 'Other' },
  ],
  feline: [
    { id: 'persian', name: 'Persian' },
    { id: 'siamese', name: 'Siamese' },
    { id: 'maine', name: 'Maine Coon' },
    { id: 'ragdoll', name: 'Ragdoll' },
    { id: 'bengal', name: 'Bengal' },
    { id: 'sphynx', name: 'Sphynx' },
    { id: 'british', name: 'British Shorthair' },
    { id: 'abyssinian', name: 'Abyssinian' },
    { id: 'russian', name: 'Russian Blue' },
    { id: 'other', name: 'Other' },
  ],
};

const BreedDropdown: React.FC<BreedDropdownProps> = ({
  species,
  value,
  onChange,
}) => {
  const [breeds, setBreeds] = useState<Breed[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchBreeds = async () => {
      setIsLoading(true);
      try {
        const normalizedSpecies = species.toLowerCase();
        
        if (normalizedSpecies === 'canine') {
          setBreeds(defaultBreeds.canine);
          try {
            const response = await fetch('https://api.thedogapi.com/v1/breeds', {
              headers: {
                'x-api-key': process.env.REACT_APP_DOG_API_KEY || '',
              },
            });
            const data = await response.json();
            if (Array.isArray(data) && data.length > 0) {
              setBreeds(data.map((breed: any) => ({ 
                id: breed.id,
                name: breed.name 
              })));
            }
          } catch (apiError) {
            console.error('Error fetching dog breeds from API:', apiError);
            // Keep using default breeds
          }
        } else if (normalizedSpecies === 'feline') {
          setBreeds(defaultBreeds.feline);
          try {
            const response = await fetch('https://api.thecatapi.com/v1/breeds', {
              headers: {
                'x-api-key': process.env.REACT_APP_CAT_API_KEY || '',
              },
            });
            const data = await response.json();
            if (Array.isArray(data) && data.length > 0) {
              setBreeds(data.map((breed: any) => ({ 
                id: breed.id,
                name: breed.name 
              })));
            }
          } catch (apiError) {
            console.error('Error fetching cat breeds from API:', apiError);
            // Keep using default breeds
          }
        } else {
          setBreeds([]);
        }
      } catch (error) {
        console.error('Error setting breeds:', error);
        setBreeds([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBreeds();
  }, [species]);

  // Always render the dropdown if we have a valid species
  const normalizedSpecies = species?.toLowerCase() || '';
  const showDropdown = ['canine', 'feline'].includes(normalizedSpecies);
  
  if (!showDropdown) {
    return null;
  }

  console.log('BreedDropdown rendering:', { species, breeds, value }); // Debug log

  return (
    <Form.Group className="mb-3">
      <Form.Label>Breed</Form.Label>
      <Form.Select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={isLoading}
        title={`Select ${species} breed`}
      >
        <option value="">Select breed</option>
        {breeds.map((breed) => (
          <option key={breed.id} value={breed.name}>
            {breed.name}
          </option>
        ))}
      </Form.Select>
    </Form.Group>
  );
};

export default BreedDropdown;
