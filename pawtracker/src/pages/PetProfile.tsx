import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Container, Row, Col, Alert, Button, Card } from 'react-bootstrap';
import Calendar from 'react-calendar';
import { useAuth } from '@clerk/clerk-react';
import 'react-calendar/dist/Calendar.css';

import BackButton from '../components/BackButton';
import SettingsButton from '../components/SettingsButton';
import {
  fetchPet,
  fetchDailyTasks,
  markTaskComplete,
  type Pet,
  type DailyTask,
  type TaskCompletion
} from '../utils/fetchPets';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const PetProfile: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { getToken } = useAuth();

  const [pet, setPet] = React.useState<Pet | null>(null);
  const [tasks, setTasks] = React.useState<DailyTask[]>([]);
  const [completedTasks, setCompletedTasks] = React.useState<TaskCompletion[]>([]);
  const [selectedDate, setSelectedDate] = React.useState<Date>(new Date());
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  // Fetch pet and tasks data
  React.useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const [petData, tasksData] = await Promise.all([
          fetchPet(id, getToken),
          fetchDailyTasks(id, getToken),
        ]);
        setPet(petData);
        setTasks(tasksData);
      } catch (err: any) {
        setError(err.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, getToken]);

  // Fetch task completions for the selected date
  React.useEffect(() => {
    const fetchCompletions = async () => {
      if (!tasks.length) return;
      
      try {
        const dateStr = selectedDate.toISOString().split('T')[0];
        const token = await getToken();
        if (!token) return;

        const completions = await Promise.all(
          tasks.map(async task => {
            const response = await fetch(
              `${BASE_URL}/tasks/${task.id}/completions/${dateStr}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
                credentials: 'include',
              }
            );
            if (!response.ok) {
              if (response.status === 404) return null;
              throw new Error(`Failed to fetch completion: ${response.statusText}`);
            }
            return response.json();
          })
        );
        setCompletedTasks(completions.filter(Boolean));
      } catch (err) {
        console.error('Error fetching completions:', err);
      }
    };

    fetchCompletions();
  }, [tasks, selectedDate, getToken]);

  const handleComplete = async (task: DailyTask) => {
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const completion = await markTaskComplete(task.id.toString(), dateStr, getToken);
      setCompletedTasks(prev => [...prev, completion]);
      // Clear any existing error
      setError(null);
    } catch (err: any) {
      console.error('Error completing task:', err);
      // Show the specific error message from the server if available
      setError(err.message || 'Failed to mark task as complete');
      // Remove the error after 5 seconds
      setTimeout(() => setError(null), 5000);
    }
  };

  // Show error as a dismissible alert at the top if present
  const errorAlert = error ? (
    <Alert 
      variant="danger" 
      dismissible 
      onClose={() => setError(null)}
      className="mb-4"
    >
      {error}
    </Alert>
  ) : null;

  if (loading || !pet) {
    return (
      <Container className="text-center mt-4">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      {errorAlert}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div className="d-flex align-items-center">
          <BackButton onClick={() => navigate('/dashboard')} />
          <h1 className="mb-0 ms-3">{pet.name}'s Profile</h1>
        </div>
        <SettingsButton onClick={() => navigate(`/pet/${pet.id}/settings`)} />
      </div>

      <Row>
        <Col md={6} className="mb-4">
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center bg-primary text-white">
              <h5 className="mb-0">Daily Tasks</h5>
              <span>{selectedDate.toLocaleDateString()}</span>
            </Card.Header>
            <Card.Body>
              {tasks.length === 0 ? (
                <p className="text-muted">No tasks added yet. Add tasks in settings.</p>
              ) : (
                tasks.map(task => {
                  const isCompleted = completedTasks.some(c => c.task_id === task.id);
                  return (
                    <div key={task.id} className="d-flex align-items-center justify-content-between mb-2 p-2 border rounded">
                      <span className={isCompleted ? 'text-muted text-decoration-line-through' : ''}>
                        {task.task_name}
                      </span>
                      <Button
                        variant={isCompleted ? "success" : "outline-primary"}
                        size="sm"
                        disabled={isCompleted}
                        onClick={() => handleComplete(task)}
                      >
                        {isCompleted ? '✓ Done' : 'Mark Complete'}
                      </Button>
                    </div>
                  );
                })
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col md={6} className="mb-4">
          <Card>
            <Card.Header className="bg-primary text-white">
              <h5 className="mb-0">Task Calendar</h5>
            </Card.Header>
            <Card.Body>
              <Calendar
                onChange={(value) => {
                  if (value instanceof Date) {
                    setSelectedDate(value);
                  }
                }}
                value={selectedDate}
                className="w-100"
                tileClassName={({ date }) => {
                  const dateStr = date.toISOString().split('T')[0];
                  const hasCompletions = completedTasks.some(
                    c => c.completion_date.split('T')[0] === dateStr
                  );
                  return hasCompletions ? 'bg-success text-white rounded' : '';
                }}
              />
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default PetProfile;