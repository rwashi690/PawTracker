import React, { useState, useEffect, useCallback } from 'react';
import { Preventative } from '../types/preventative';
import { Button, Form, Modal, Table, Alert } from 'react-bootstrap';

import { useAuth } from '@clerk/clerk-react';

interface MonthlyPreventativesProps {
  petId: number;
}

const MonthlyPreventatives: React.FC<MonthlyPreventativesProps> = ({ petId }) => {
  const { getToken } = useAuth();
  const [preventatives, setPreventatives] = useState<Preventative[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    due_day: 1,
    notes: ''
  });

  const makeAuthenticatedRequest = useCallback(async (url: string, options: RequestInit = {}) => {
    const token = await getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Request failed: ${response.statusText}`);
    }

    return response.json();
  }, [getToken]);

  const fetchPreventatives = useCallback(async () => {
    try {
      const data = await makeAuthenticatedRequest(`http://localhost:3001/api/preventatives/pet/${petId}`);
      setPreventatives(data);
    } catch (err) {
      setError('Failed to load preventatives');
    }
  }, [petId, makeAuthenticatedRequest]);

  useEffect(() => {
    fetchPreventatives();
  }, [petId, fetchPreventatives]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await makeAuthenticatedRequest('http://localhost:3001/api/preventatives', {
        method: 'POST',
        body: JSON.stringify({
        pet_id: petId,
        ...formData
      })
      });
      setShowModal(false);
      setFormData({ name: '', due_day: 1, notes: '' });
      fetchPreventatives();
    } catch (err) {
      setError('Failed to add preventative');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this preventative?')) {
      try {
        await makeAuthenticatedRequest(`http://localhost:3001/api/preventatives/${id}`, {
          method: 'DELETE'
        });
        fetchPreventatives();
      } catch (err) {
        setError('Failed to delete preventative');
      }
    }
  };

  return (
    <div className="my-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3>Monthly Preventatives</h3>
        <Button variant="primary" onClick={() => setShowModal(true)}>
          Add Preventative
        </Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <Table striped bordered hover>
        <thead>
          <tr>
            <th>Name</th>
            <th>Due Day</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          {preventatives.map((preventative) => (
            <tr key={preventative.id}>
              <td>{preventative.name}</td>
              <td>{preventative.due_day}</td>
              <td>{preventative.notes}</td>
              <td>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDelete(preventative.id)}
                >
                  Delete
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add Monthly Preventative</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Due Day (1-31)</Form.Label>
              <Form.Control
                type="number"
                min="1"
                max="31"
                value={formData.due_day}
                onChange={(e) => setFormData({ ...formData, due_day: parseInt(e.target.value) })}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Notes</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </Form.Group>
            <Button variant="primary" type="submit">
              Add Preventative
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default MonthlyPreventatives;
