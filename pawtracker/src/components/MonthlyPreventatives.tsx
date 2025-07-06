import React, { useState, useEffect, useCallback } from 'react';
import { Preventative } from '../types/preventative';
import { Button, Form, ListGroup, Alert } from 'react-bootstrap';
import { useAuth } from '@clerk/clerk-react';
import CircularPlusButton from './CircularPlusButton';

interface MonthlyPreventativesProps {
  petId: number;
}

const MonthlyPreventatives: React.FC<MonthlyPreventativesProps> = ({ petId }) => {
  const { getToken } = useAuth();
  const [preventatives, setPreventatives] = useState<Preventative[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    due_day: 1,
  });

  const makeAuthenticatedRequest = useCallback(
    async (url: string, options: RequestInit = {}) => {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');
      const response = await fetch(url, {
        ...options,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
        credentials: 'include',
      });
      if (!response.ok) throw new Error(`Request failed: ${response.statusText}`);
      return response.json();
    },
    [getToken]
  );

  const fetchPreventatives = useCallback(async () => {
    try {
      const data = await makeAuthenticatedRequest(
        `http://localhost:3001/api/preventatives/pet/${petId}`
      );
      setPreventatives(data);
    } catch {
      setError('Failed to load preventatives');
    }
  }, [petId, makeAuthenticatedRequest]);

  useEffect(() => {
    fetchPreventatives();
  }, [fetchPreventatives]);

  const handleAdd = async () => {
    if (!formData.name) return;
  
    // validation popup
    if (formData.due_day < 1 || formData.due_day > 31) {
      window.alert('Please enter a day between 1 and 31');
      return;
    }
  
    try {
      await makeAuthenticatedRequest('http://localhost:3001/api/preventatives', {
        method: 'POST',
        body: JSON.stringify({
          pet_id: petId,
          name: formData.name,
          due_day: formData.due_day,
        }),
      });
      setFormData({ name: '', due_day: 1 });
      fetchPreventatives();
    } catch {
      setError('Failed to add preventative');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this preventative?')) return;
    try {
      await makeAuthenticatedRequest(
        `http://localhost:3001/api/preventatives/${id}`,
        { method: 'DELETE' }
      );
      fetchPreventatives();
    } catch {
      setError('Failed to delete preventative');
    }
  };

  return (
    <div className="my-4">
      <h5>Monthly Preventatives</h5>

      {error && <Alert variant="danger">{error}</Alert>}

      <ListGroup className="mb-3">
        {preventatives.map((p) => (
          <ListGroup.Item
            key={p.id}
            className="d-flex justify-content-between align-items-center"
          >
            <div>
              <strong>{p.name}</strong>{' '}
              <small className="text-muted">(Day of the Month: {p.due_day})</small>
            </div>
            <Button
              variant="outline-danger"
              size="sm"
              onClick={() => handleDelete(p.id)}
            >
              ×
            </Button>
          </ListGroup.Item>
        ))}
      </ListGroup>

      <Form className="mt-3">
  <div className="d-flex align-items-center gap-2">
    <Form.Control
      size="sm"
      type="text"
      placeholder="Preventative Name"
      value={formData.name}
      onChange={(e) =>
        setFormData({ ...formData, name: e.target.value })
      }
      className="flex-grow-1"
    />
    <Form.Control
      size="sm"
      type="number"
      min={1}
      max={31}
      placeholder="Day"
      value={formData.due_day}
      onChange={(e) =>
        setFormData({
          ...formData,
          due_day: parseInt(e.target.value, 10) || 1,
        })
      }
      style={{ width: '4rem' }}
    />
    <div style={{ flexShrink: 0 }}>
      <CircularPlusButton onClick={handleAdd} />
    </div>
  </div>
</Form>
    </div>
  );
};

export default MonthlyPreventatives;