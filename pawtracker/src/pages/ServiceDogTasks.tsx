import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Button, Card, Spinner, Alert, Table, Form, Modal } from 'react-bootstrap';
import { useAuth } from '@clerk/clerk-react';
import BackButton from '../components/BackButton';
import { API_URL } from '../config';

interface ServiceDogTask {
  id: number;
  pet_id: number;
  task_name: string;
  description: string;
  frequency: string;
  last_completed: string;
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
  const [newTask, setNewTask] = useState<Omit<ServiceDogTask, 'id' | 'pet_id'>>({
    task_name: '',
    description: '',
    frequency: 'daily',
    last_completed: new Date().toISOString().split('T')[0]
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
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newTask,
          pet_id: petId,
          last_completed: newTask.last_completed || new Date().toISOString().split('T')[0]
        })
      });

      if (!response.ok) {
        throw new Error('Failed to add task');
      }

      const addedTask = await response.json();
      setTasks([...tasks, addedTask]);
      setShowAddModal(false);
      setNewTask({
        task_name: '',
        description: '',
        frequency: 'daily',
        last_completed: new Date().toISOString().split('T')[0]
      });
    } catch (err) {
      console.error('Error adding task:', err);
      setError('Failed to add task');
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
        <Card.Header as="h5" className="d-flex justify-content-between align-items-center">
          <span>Task List</span>
          <Button 
            variant="primary" 
            size="sm"
            onClick={() => setShowAddModal(true)}
          >
            + Add Task
          </Button>
        </Card.Header>
        <Card.Body>
          {tasks.length === 0 ? (
            <Alert variant="info">No service dog tasks found for this pet.</Alert>
          ) : (
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>Task Name</th>
                  <th>Description</th>
                  <th>Frequency</th>
                  <th>Last Completed</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr key={task.id}>
                    <td>{task.task_name}</td>
                    <td>{task.description}</td>
                    <td>{task.frequency}</td>
                    <td>{new Date(task.last_completed).toLocaleDateString()}</td>
                    <td>
                      <Button 
                        variant="outline-primary" 
                        size="sm" 
                        onClick={() => navigate(`/pet/${petId}/servicetasks/${task.id}`)}
                      >
                        View/Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
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
              <Form.Label>Description</Form.Label>
              <Form.Control 
                as="textarea" 
                rows={3} 
                value={newTask.description}
                onChange={(e) => setNewTask({...newTask, description: e.target.value})}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Frequency</Form.Label>
              <Form.Select 
                value={newTask.frequency}
                onChange={(e) => setNewTask({...newTask, frequency: e.target.value as any})}
                aria-label="Select task frequency"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="as_needed">As Needed</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Last Completed</Form.Label>
              <Form.Control 
                type="date" 
                value={newTask.last_completed}
                onChange={(e) => setNewTask({...newTask, last_completed: e.target.value})}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Add Task
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default ServiceDogTasks;
