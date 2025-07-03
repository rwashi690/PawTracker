import React, { useState, useEffect } from 'react';
import {
  Container,
  Row,
  Col,
  Button,
  Form,
  ListGroup,
  Alert,
} from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import DropdownComponent from '../components/DropdownComponent';
import {
  fetchPet,
  updatePet,
  deletePet,
  fetchDailyTasks,
  createDailyTask,
  deleteDailyTask,
  type Pet,
  type DailyTask,
} from '../utils/fetchPets';

const SettingsPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getToken } = useAuth();

  const [pet, setPet] = useState<Pet | null>(null);
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [newTask, setNewTask] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const sexOptions = ['Male', 'Female'];
  const animalTypeOptions = [
    'Service Animal',
    'Therapy Animal',
    'Emotional Support Animal',
  ];
  const speciesOptions = ['Canine', 'Feline', 'Other'];

  useEffect(() => {
    const loadPetAndTasks = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const [petData, tasksData] = await Promise.all([
          fetchPet(id, getToken),
          fetchDailyTasks(id!, getToken),
        ]);

        setPet(petData);
        setTasks(tasksData);
      } catch (err: any) {
        console.error('Error loading pet data:', err);
        setError(err.message || 'Failed to load pet data');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      loadPetAndTasks();
    }
  }, [id, getToken]);

  const handleAddTask = async () => {
    if (!newTask.trim() || !id) return;

    try {
      const task = await createDailyTask(id, newTask.trim(), getToken);
      setTasks([...tasks, task]);
      setNewTask('');
    } catch (err: any) {
      setError(err.message || 'Failed to add task');
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    try {
      await deleteDailyTask(taskId.toString(), getToken);
      setTasks(tasks.filter((task) => task.id !== taskId));
    } catch (err: any) {
      setError(err.message || 'Failed to delete task');
    }
  };

  const handleUpdatePet = async (updates: Partial<Pet>) => {
    if (!id || !pet) return;

    try {
      const updatedPet = await updatePet(id, updates, getToken);
      setPet(updatedPet);
    } catch (err: any) {
      setError(err.message || 'Failed to update pet');
    }
  };

  const handleDeletePet = async () => {
    if (!id) return;

    if (
      window.confirm(
        'Are you sure you want to delete this pet? This action cannot be undone.'
      )
    ) {
      try {
        await deletePet(id, getToken);
        navigate('/dashboard');
      } catch (err: any) {
        setError(err.message || 'Failed to delete pet');
      }
    }
  };

  if (error) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  if (isLoading || !pet) {
    return (
      <Container className="text-center mt-4">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      {error && (
        <Alert variant="danger" className="mb-3">
          {error}
        </Alert>
      )}

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <Button
          variant="link"
          className="back-button"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={24} />
          Back
        </Button>
        <div className="d-flex align-items-center gap-2">
          <img
            src={`http://localhost:3001${pet.image_url}`}
            alt={pet.name}
            className="rounded-circle"
            style={{ width: '40px', height: '40px', objectFit: 'cover' }}
          />
          <h4 className="mb-0">{pet.name}'s Settings</h4>
        </div>
      </div>

      {/* Content */}
      <Row>
        {/* Left: Daily Tasks */}
        <Col md={6} className="mb-4">
          <h5>Daily Tasks</h5>
          <ListGroup>
            {tasks.map((task) => (
              <ListGroup.Item
                key={task.id}
                className="d-flex justify-content-between align-items-center"
              >
                {task.task_name}
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={() => handleDeleteTask(task.id)}
                >
                  ×
                </Button>
              </ListGroup.Item>
            ))}
          </ListGroup>
          <Form className="mt-3 d-flex gap-2">
            <Form.Control
              type="text"
              placeholder="Add new task"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
            />
            <Button onClick={handleAddTask}>Add</Button>
          </Form>
        </Col>

        {/* Right: Edit Pet Info */}
        <Col md={6}>
          <h5>Edit Pet Information</h5>
          <DropdownComponent
            label="Sex"
            options={sexOptions}
            value={pet.sex || ''}
            onChange={(value) => handleUpdatePet({ sex: value })}
          />
          <DropdownComponent
            label="Animal Type"
            options={animalTypeOptions}
            value={pet.animal_type || ''}
            onChange={(value) => handleUpdatePet({ animal_type: value })}
          />
          <DropdownComponent
            label="Species"
            options={speciesOptions}
            value={pet.species || ''}
            onChange={(value) => handleUpdatePet({ species: value })}
          />
          <Button variant="danger" className="mt-3" onClick={handleDeletePet}>
            Delete Pet
          </Button>
        </Col>
      </Row>
    </Container>
  );
};

export default SettingsPage;
