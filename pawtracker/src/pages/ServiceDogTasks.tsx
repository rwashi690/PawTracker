import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Button, Card, Spinner, Alert, Form, Modal } from 'react-bootstrap';
import { useAuth } from '@clerk/clerk-react';
import BackButton from '../components/BackButton';
import { API_URL } from '../config';
import CircularPlusButton from '../components/CircularPlusButton';
import PawButton from '../components/PawButton';

interface ServiceDogTask {
  id: number;
  pet_id: string;
  task_name: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

const ServiceDogTasks = () => {
  const { petId } = useParams<{ petId: string }>();
  const [pet, setPet] = useState<{ id: string; name: string; image_url: string | null } | null>(null);
  const [tasks, setTasks] = useState<ServiceDogTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [petLoading, setPetLoading] = useState(true);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTask, setEditingTask] = useState<ServiceDogTask | null>(null);
  const [editForm, setEditForm] = useState<{ task_name: string; notes: string | null }>({ task_name: '', notes: null });
  const [newTask, setNewTask] = useState<Omit<ServiceDogTask, 'id' | 'pet_id' | 'created_at' | 'updated_at'>>({
    task_name: '',
    notes: null
  });
  const { getToken, sessionId } = useAuth();
  const navigate = useNavigate();

  // Keep a single source of truth for overall loading state
  useEffect(() => {
    setLoading(petLoading || tasksLoading);
  }, [petLoading, tasksLoading]);

  // Fetch pet data
  useEffect(() => {
    const fetchPetData = async () => {
      if (!petId) {
        setError('No pet ID provided');
        setPetLoading(false);
        return;
      }

      try {
        const token = await getToken();
        console.log('Fetching pet data with token:', token ? 'Token exists' : 'No token');
        if (!token) {
          throw new Error('No auth token available');
        }
        const authToken = token as string;
        
        const petHeaders: Record<string, string> = {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        };
        if (sessionId) petHeaders['Clerk-Session-Id'] = sessionId;

        const response = await fetch(`${API_URL}/api/pets/${petId}`, {
          headers: petHeaders,
          credentials: 'include', // Important for sending cookies
        });
        
        console.log('Pet data response status:', response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Error response:', errorText);
          throw new Error(`Failed to fetch pet data (${response.status} ${response.statusText})`);
        }
        
        const petData = await response.json();
        console.log('Pet data received:', petData);
        setPet(petData);
      } catch (err) {
        console.error('Error fetching pet data:', err);
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(`Failed to load pet data: ${message}`);
      } finally {
        setPetLoading(false);
      }
    };

    fetchPetData();
  }, [petId, getToken, sessionId]);

  useEffect(() => {
    const fetchTasks = async () => {
      if (!petId) {
        setError('No pet ID provided');
        setTasksLoading(false);
        return;
      }

      try {
        const token = await getToken();
        console.log('Fetching tasks with token:', token ? 'Token exists' : 'No token');
        const authToken = token as string;
        
        const taskHeaders: Record<string, string> = {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        };
        if (sessionId) taskHeaders['Clerk-Session-Id'] = sessionId;

        const response = await fetch(`${API_URL}/api/service-dog-tasks/pet/${petId}/servicetasks`, {
          headers: taskHeaders,
          credentials: 'include', // Important for sending cookies
        });
        
        console.log('Tasks response status:', response.status);
        
        if (!response.ok && response.status !== 404) {
          const errorText = await response.text();
          console.error('Error response:', errorText);
          throw new Error(`Failed to fetch service dog tasks`);
        }
        
        // If 404, it means no tasks exist yet (which is fine)
        const data = response.status === 404 ? [] : await response.json();
        console.log('Tasks data received:', data);
        
        setTasks(Array.isArray(data) ? data : []);
        setError(''); // Clear any previous errors
      } catch (err) {
        console.error('Error fetching service dog tasks:', err);
        // Don't show an error for empty task lists; only non-404 reach here.
        setError(`Failed to load service dog tasks. You can still add new tasks.`);
      } finally {
        setTasksLoading(false);
      }
    };

    if (!petLoading) {
      fetchTasks();
    }
  }, [getToken, petId, petLoading, sessionId]);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/api/service-dog-tasks/pet/${petId}/servicetasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...(sessionId && { 'Clerk-Session-Id': sessionId })
        },
        body: JSON.stringify({
          task_name: newTask.task_name,
          notes: newTask.notes
        }),
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add service dog task');
      }

      const addedTask = await response.json();
      setTasks([addedTask, ...tasks]);
      setNewTask({ task_name: '', notes: null });
      setShowAddModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add service dog task');
    }
  };

  // Open Edit modal prefilled with the selected task
  const openEdit = (task: ServiceDogTask) => {
    setEditingTask(task);
    setEditForm({ task_name: task.task_name, notes: task.notes });
    setShowEditModal(true);
  };

  // Update an existing service dog task
  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask || !petId) return;
    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/api/service-dog-tasks/pet/${petId}/servicetasks/${editingTask.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...(sessionId && { 'Clerk-Session-Id': sessionId })
        },
        body: JSON.stringify({
          task_name: editForm.task_name,
          notes: editForm.notes,
        }),
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to update service dog task');
      }

      const updated: ServiceDogTask = await response.json();
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      setShowEditModal(false);
      setEditingTask(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update service dog task');
    }
  };

  // Delete a service dog task
  const handleDeleteTask = async (taskId: number) => {
    if (!petId) return;
    const confirmed = window.confirm('Delete this service dog task? This cannot be undone.');
    if (!confirmed) return;
    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/api/service-dog-tasks/pet/${petId}/servicetasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          ...(sessionId && { 'Clerk-Session-Id': sessionId }),
        },
        credentials: 'include',
      });

      if (!response.ok && response.status !== 204) {
        const text = await response.text();
        throw new Error(text || 'Failed to delete service dog task');
      }

      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete service dog task');
    }
  };

  // Show loading state only if we're still loading and there's no error
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
        <h2 className="mb-0 ms-3">{pet?.name}'s Service Dog Tasks</h2>
      </div>
      
      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
          <div className="mt-2">
            <Button variant="outline-secondary" size="sm" onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </Alert>
      )}
      {/* Pet Image and Info */}
      {pet && (
        <div className="text-center mb-4">
          {pet.image_url ? (
            <img
              src={pet.image_url.startsWith('http') ? pet.image_url : `${API_URL}${pet.image_url}`}
              alt={pet.name}
              className="rounded-circle"
              style={{
                width: '150px',
                height: '150px',
                objectFit: 'cover',
                border: '4px solid #CCCCFF'
              }}
            />
          ) : (
            <div 
              className="rounded-circle d-flex align-items-center justify-content-center mx-auto"
              style={{
                width: '150px',
                height: '150px',
                backgroundColor: '#f0f0f0',
                color: '#666',
                fontSize: '48px',
                border: '4px solid #CCCCFF'
              }}
            >
              {pet.name?.charAt(0).toUpperCase() || '?'}
            </div>
          )}
        </div>
      )}
      <Card className="mb-4">
        <Card.Header as="h5" className="d-flex justify-content-between align-items-center p-3">
          <div className="flex-grow-1">Task List</div>
          <div className="flex-shrink-0">
            <CircularPlusButton onClick={() => setShowAddModal(true)} />
          </div>
        </Card.Header>
        <Card.Body>
          {tasks.length === 0 ? (
            <Alert variant="info">No service dog tasks found for this pet.</Alert>
          ) : (
            <div>
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="d-flex align-items-center justify-content-between mb-2 p-2 border rounded"
                >
                  <div>
                    <span>{task.task_name}</span>
                  </div>
                  <div className="d-flex gap-2">
                    <PawButton size="sm" onClick={() => openEdit(task)}>
                      View/Edit
                    </PawButton>
                    <PawButton variant="danger" size="sm" onClick={() => handleDeleteTask(task.id)}>
                      Delete
                    </PawButton>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Add Task Modal */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add New Task</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleAddTask}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Task Name</Form.Label>
              <Form.Control 
                type="text" 
                value={newTask.task_name}
                onChange={(e) => setNewTask({...newTask, task_name: e.target.value})}
                required 
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Notes</Form.Label>
              <Form.Control 
                as="textarea" 
                rows={3} 
                value={newTask.notes || ''}
                onChange={(e) => setNewTask({...newTask, notes: e.target.value || null})}
                placeholder="Additional details about this service task (optional)"
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>

            <Button variant="primary" type="submit">
              Add Task
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Edit Task Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Task</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleUpdateTask}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Task Name</Form.Label>
              <Form.Control
                type="text"
                value={editForm.task_name}
                onChange={(e) => setEditForm({ ...editForm, task_name: e.target.value })}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Notes</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={editForm.notes || ''}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value || null })}
                placeholder="Additional details about this service task (optional)"
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="primary" type="submit">
              Save Changes
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default ServiceDogTasks;
