import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Card, Spinner, Alert, Form, Modal, Button } from 'react-bootstrap';
import { useAuth } from '@clerk/clerk-react';
import BackButton from '../components/BackButton';
import CircularPlusButton from '../components/CircularPlusButton';
import PawButton from '../components/PawButton';
import { API_URL } from '../config';

interface Shot {
  id: number;
  pet_id: number;
  shot_name: string;
  date_given: string; // ISO date string
  vet_clinic: string | null;
  created_at: string;
  updated_at: string;
}

const Shots: React.FC = () => {
  const { petId } = useParams<{ petId: string }>();
  const navigate = useNavigate();
  const { getToken, sessionId } = useAuth();

  const [pet, setPet] = useState<{ id: string; name: string; image_url: string | null } | null>(null);
  const [shots, setShots] = useState<Shot[]>([]);
  const [loading, setLoading] = useState(true);
  const [petLoading, setPetLoading] = useState(true);
  const [shotsLoading, setShotsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingShot, setEditingShot] = useState<Shot | null>(null);

  const [newShot, setNewShot] = useState<{ shot_name: string; date_given: string; vet_clinic: string | null }>({
    shot_name: '',
    date_given: '',
    vet_clinic: ''
  });
  const [editForm, setEditForm] = useState<{ shot_name: string; date_given: string; vet_clinic: string | null }>({
    shot_name: '',
    date_given: '',
    vet_clinic: ''
  });

  useEffect(() => {
    setLoading(petLoading || shotsLoading);
  }, [petLoading, shotsLoading]);

  // Fetch pet
  useEffect(() => {
    const fetchPet = async () => {
      if (!petId) {
        setError('No pet ID provided');
        setPetLoading(false);
        return;
      }
      try {
        const token = await getToken();
        if (!token) throw new Error('No auth token available');
        const headers: Record<string, string> = {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        };
        if (sessionId) headers['Clerk-Session-Id'] = sessionId;
        const resp = await fetch(`${API_URL}/api/pets/${petId}`, {
          headers,
          credentials: 'include'
        });
        if (!resp.ok) throw new Error('Failed to fetch pet');
        const data = await resp.json();
        setPet(data);
      } catch (e: any) {
        setError(e.message || 'Failed to load pet');
      } finally {
        setPetLoading(false);
      }
    };
    fetchPet();
  }, [petId, getToken, sessionId]);

  // Fetch shots
  useEffect(() => {
    const fetchShots = async () => {
      if (!petId) {
        setError('No pet ID provided');
        setShotsLoading(false);
        return;
      }
      try {
        const token = await getToken();
        const headers: Record<string, string> = {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        };
        if (sessionId) headers['Clerk-Session-Id'] = sessionId;
        const resp = await fetch(`${API_URL}/api/shots/pet/${petId}/shots`, {
          headers,
          credentials: 'include'
        });
        if (!resp.ok && resp.status !== 404) throw new Error('Failed to fetch shots');
        const data = resp.status === 404 ? [] : await resp.json();
        setShots(Array.isArray(data) ? data : []);
      } catch (e: any) {
        setError('Failed to load shots');
      } finally {
        setShotsLoading(false);
      }
    };
    if (!petLoading) fetchShots();
  }, [petId, getToken, sessionId, petLoading]);

  // Add shot
  const handleAddShot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!petId) return;
    try {
      const token = await getToken();
      const resp = await fetch(`${API_URL}/api/shots/pet/${petId}/shots`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          ...(sessionId && { 'Clerk-Session-Id': sessionId })
        },
        body: JSON.stringify(newShot),
        credentials: 'include'
      });
      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to add shot');
      }
      const created: Shot = await resp.json();
      setShots(prev => [created, ...prev]);
      setShowAddModal(false);
      setNewShot({ shot_name: '', date_given: '', vet_clinic: '' });
    } catch (e: any) {
      setError(e.message || 'Failed to add shot');
    }
  };

  // Open edit
  const openEdit = (shot: Shot) => {
    setEditingShot(shot);
    setEditForm({ shot_name: shot.shot_name, date_given: shot.date_given.split('T')[0], vet_clinic: shot.vet_clinic });
    setShowEditModal(true);
  };

  // Update shot
  const handleUpdateShot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingShot || !petId) return;
    try {
      const token = await getToken();
      const resp = await fetch(`${API_URL}/api/shots/pet/${petId}/shots/${editingShot.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          ...(sessionId && { 'Clerk-Session-Id': sessionId })
        },
        body: JSON.stringify(editForm),
        credentials: 'include'
      });
      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to update shot');
      }
      const updated: Shot = await resp.json();
      setShots(prev => prev.map(s => (s.id === updated.id ? updated : s)));
      setShowEditModal(false);
      setEditingShot(null);
    } catch (e: any) {
      setError(e.message || 'Failed to update shot');
    }
  };

  // Delete shot
  const handleDeleteShot = async (shotId: number) => {
    if (!petId) return;
    const confirmed = window.confirm('Delete this shot record? This cannot be undone.');
    if (!confirmed) return;
    try {
      const token = await getToken();
      const resp = await fetch(`${API_URL}/api/shots/pet/${petId}/shots/${shotId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          ...(sessionId && { 'Clerk-Session-Id': sessionId })
        },
        credentials: 'include'
      });
      if (!resp.ok && resp.status !== 204) {
        const text = await resp.text();
        throw new Error(text || 'Failed to delete shot');
      }
      setShots(prev => prev.filter(s => s.id !== shotId));
    } catch (e: any) {
      setError(e.message || 'Failed to delete shot');
    }
  };

  if (loading && !error) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <div className="d-flex align-items-center mb-4">
        <BackButton onClick={() => navigate(`/pet/${petId}`)} />
        <h2 className="mb-0 ms-3">{pet?.name}'s Immunizations</h2>
      </div>

      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}

      {/* List */}
      <Card className="mb-4">
        <Card.Header as="h5" className="d-flex justify-content-between align-items-center p-3">
          <div className="flex-grow-1">Shot Records</div>
          <div className="flex-shrink-0">
            <CircularPlusButton onClick={() => setShowAddModal(true)} />
          </div>
        </Card.Header>
        <Card.Body>
          {shots.length === 0 ? (
            <Alert variant="info">No immunization records found for this pet.</Alert>
          ) : (
            <div>
              {shots.map(shot => (
                <div key={shot.id} className="d-flex align-items-center justify-content-between mb-2 p-2 border rounded">
                  <div>
                    <div>{shot.shot_name}</div>
                    <small className="text-muted">{new Date(shot.date_given).toLocaleDateString()} {shot.vet_clinic ? `• ${shot.vet_clinic}` : ''}</small>
                  </div>
                  <div className="d-flex gap-2">
                    <PawButton size="sm" onClick={() => openEdit(shot)}>View/Edit</PawButton>
                    <PawButton variant="danger" size="sm" onClick={() => handleDeleteShot(shot.id)}>Delete</PawButton>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Add Modal */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add Shot Record</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleAddShot}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Shot Name</Form.Label>
              <Form.Control type="text" value={newShot.shot_name} onChange={(e) => setNewShot({ ...newShot, shot_name: e.target.value })} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Date Given</Form.Label>
              <Form.Control type="date" value={newShot.date_given} onChange={(e) => setNewShot({ ...newShot, date_given: e.target.value })} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Vet / Clinic</Form.Label>
              <Form.Control type="text" value={newShot.vet_clinic || ''} onChange={(e) => setNewShot({ ...newShot, vet_clinic: e.target.value || '' })} placeholder="Optional" />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="primary" type="submit">Add Shot</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Edit Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Shot</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleUpdateShot}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Shot Name</Form.Label>
              <Form.Control type="text" value={editForm.shot_name} onChange={(e) => setEditForm({ ...editForm, shot_name: e.target.value })} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Date Given</Form.Label>
              <Form.Control type="date" value={editForm.date_given} onChange={(e) => setEditForm({ ...editForm, date_given: e.target.value })} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Vet / Clinic</Form.Label>
              <Form.Control type="text" value={editForm.vet_clinic || ''} onChange={(e) => setEditForm({ ...editForm, vet_clinic: e.target.value || '' })} placeholder="Optional" />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="primary" type="submit">Save Changes</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default Shots;
