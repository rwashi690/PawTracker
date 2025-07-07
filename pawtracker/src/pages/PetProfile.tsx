import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Container, Row, Col, Alert, Button, Card } from 'react-bootstrap';
import Calendar from 'react-calendar';
import { useAuth } from '@clerk/clerk-react';
import 'react-calendar/dist/Calendar.css';
import CircularCheckButton from '../components/CircularCheckButton';

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

const PERIWINKLE = '#CCCCFF';

const PetProfile: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { getToken } = useAuth();

  const [pet, setPet] = React.useState<Pet | null>(null);
  const [tasks, setTasks] = React.useState<DailyTask[]>([]);
  const [completedTasks, setCompletedTasks] = React.useState<TaskCompletion[]>([]);
  const [selectedDate, setSelectedDate] = React.useState(() => {
    const now = new Date();
    // Keep current month and year
    return now;
  });
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const [petData, tasksData] = await Promise.all([
          fetchPet(id, getToken),
          fetchDailyTasks(id, getToken, selectedDate)
        ]);
        setPet(petData);
        setTasks(tasksData);
      } catch (err: any) {
        console.error('Error fetching pet data:', err);
        setError(err.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, getToken, selectedDate]);

  React.useEffect(() => {
    const fetchCompletions = async () => {
      if (!tasks.length) return;
      try {
        const dateStr = selectedDate.toISOString().split('T')[0];
        const token = await getToken();
        if (!token) return;
        const completions = await Promise.all(
          tasks.map(async task => {
            const resp = await fetch(
              `http://localhost:3001/api/tasks/${task.id}/completions/${dateStr}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
                credentials: 'include',
              }
            );
            // No need to check for 404 since backend always returns 200 with null for no completions
            if (!resp.ok) throw new Error(resp.statusText);
            return resp.json();
          })
        );
        setCompletedTasks(completions.filter(Boolean) as TaskCompletion[]);
      } catch (err) {
        console.error(err);
      }
    };
    fetchCompletions();
  }, [tasks, selectedDate, getToken]);

  const handleComplete = async (task: DailyTask) => {
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const completion = await markTaskComplete(task.id.toString(), dateStr, getToken);
      setCompletedTasks(prev => [...prev, completion]);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to mark complete');
      setTimeout(() => setError(null), 5000);
    }
  };

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
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)} className="mb-4">
          {error}
        </Alert>
      )}

      {/* Header with back/settings */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div className="d-flex align-items-center">
          <BackButton onClick={() => navigate('/dashboard')} />
          <h1 className="mb-0 ms-3">{pet.name}'s Profile</h1>
        </div>
        <SettingsButton onClick={() => navigate(`/pet/${pet.id}/settings`)} />
      </div>

      {/* Centered Pet Image */}
      <div className="text-center mb-4">
        <img
          src={`http://localhost:3001${pet.image_url}`}
          alt={pet.name}
          className="rounded-circle"
          style={{
            width: '150px',
            height: '150px',
            objectFit: 'cover',
            border: `4px solid ${PERIWINKLE}`
          }}
        />
      </div>

      <Row>
        {/* Tasks Column */}
        <Col md={6} className="mb-4">
          <Card>
            <Card.Header
              className="d-flex align-items-center"
              style={{ backgroundColor: PERIWINKLE, color: '#000' }}
            >
              <h5 className="mb-0">
                Today's Tasks – {selectedDate.toLocaleDateString()}
              </h5>
            </Card.Header>
            <Card.Body>
              {tasks.length === 0 ? (
                <p className="text-muted">No tasks added yet. Add tasks in settings.</p>
              ) : (
                tasks.map(task => {
                  const done = completedTasks.some(c => c.task_id === task.id);
                  const isPreventative = task.task_type === 'preventative';
                  return (
                    <div
                      key={task.id}
                      className="d-flex align-items-center justify-content-between mb-2 p-2 border rounded"
                      style={{
                        backgroundColor: isPreventative ? '#fff3cd' : 'transparent',
                        borderColor: isPreventative ? '#ffeeba' : undefined
                      }}
                    >
                      <div>
                        <span className={done ? 'text-muted text-decoration-line-through' : ''}>
                          {task.task_name}
                        </span>
                        {isPreventative && (
                          <span className="ms-2 badge bg-warning text-dark">Preventative</span>
                        )}
                      </div>
                      <div style={{ flexShrink: 0 }}>
                        <CircularCheckButton
                          onClick={() => handleComplete(task)}
                          ariaLabel={done ? 'Done' : 'Mark Complete'}
                          disabled={done}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Calendar Column */}
        <Col md={6} className="mb-4">
          <Card>
            <Card.Header style={{ backgroundColor: PERIWINKLE, color: '#000' }}>
              <h5 className="mb-0">Task Calendar</h5>
            </Card.Header>
            <Card.Body>
              <Calendar
                onChange={(value) => {
                  if (value instanceof Date) {
                    console.log('Calendar selected date:', value);
                    console.log('Calendar selected date (ISO):', value.toISOString());
                    console.log('Calendar selected date (local):', value.toLocaleString());
                    console.log('Calendar selected day:', value.getDate());
                    setSelectedDate(value);
                  }
                }}
                value={selectedDate}
                className="w-100"
                tileClassName={({ date }) => {
                  const dateStr = date.toISOString().split('T')[0];
                  const hasDone = completedTasks.some(
                    c => c.completion_date.split('T')[0] === dateStr
                  );
                  return hasDone ? 'bg-success text-white rounded' : '';
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