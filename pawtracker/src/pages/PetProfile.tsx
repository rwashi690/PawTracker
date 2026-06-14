import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { API_URL } from '../config';
import { Container, Row, Col, Alert, Card } from 'react-bootstrap';
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
  unmarkTaskComplete,

  type Pet,
  type Task,
  type TaskCompletion
} from '../utils/fetchPets';
import PawButton from '../components/PawButton';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';

const PERIWINKLE = '#CCCCFF';

const PetProfile: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { getToken, sessionId } = useAuth();

  const [pet, setPet] = React.useState<Pet | null>(null);
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [completedTasks, setCompletedTasks] = React.useState<TaskCompletion[]>([]);
  const [selectedDate, setSelectedDate] = React.useState(() => {
    const now = new Date();
    // Keep current month and year
    return now;
  });
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  // Maintain a user-defined order for tasks (persisted per pet via localStorage)
  const [orderedTasks, setOrderedTasks] = React.useState<Task[]>([]);

  // Load and apply saved order whenever tasks or pet id changes
  React.useEffect(() => {
    if (!id) {
      setOrderedTasks(tasks);
      return;
    }
    const key = `taskOrder:${id}`;
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const savedOrder: string[] = JSON.parse(saved);
        const idToTask = new Map(tasks.map(t => [t.id, t] as const));
        const inSavedOrder = savedOrder
          .map(taskId => idToTask.get(taskId))
          .filter((t): t is Task => Boolean(t));
        const remaining = tasks.filter(t => !savedOrder.includes(t.id));
        setOrderedTasks([...inSavedOrder, ...remaining]);
      } else {
        setOrderedTasks(tasks);
      }
    } catch (e) {
      console.warn('Failed to parse saved task order, using default order.', e);
      setOrderedTasks(tasks);
    }
  }, [tasks, id]);

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const updated = Array.from(orderedTasks);
    const [moved] = updated.splice(result.source.index, 1);
    updated.splice(result.destination.index, 0, moved);
    setOrderedTasks(updated);
    if (id) {
      const key = `taskOrder:${id}`;
      localStorage.setItem(key, JSON.stringify(updated.map(t => t.id)));
    }
  };

  // Ensure we use local date (YYYY-MM-DD) to avoid timezone off-by-one
  const formatDateLocal = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

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
        const dateStr = formatDateLocal(selectedDate);
        const token = await getToken();
        if (!token) return;
        const completions = await Promise.all(
          tasks.map(async task => {
            const resp = await fetch(
              `${API_URL}/api/tasks/${task.id}/completions/${dateStr}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json',
                  ...(sessionId ? { 'Clerk-Session-Id': sessionId } : {}),
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
  }, [tasks, selectedDate, getToken, sessionId]);

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
        {pet.image_url ? (
          <img
            src={pet.image_url.startsWith('http') ? pet.image_url : `${API_URL}${pet.image_url}`}
            alt={pet.name}
            className="rounded-circle"
            style={{
              width: '150px',
              height: '150px',
              objectFit: 'cover',
              border: `4px solid ${PERIWINKLE}`
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
              border: `4px solid ${PERIWINKLE}`
            }}
          >
            {pet.name?.charAt(0).toUpperCase() || '?'}
          </div>
        )}
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
                (() => {
                  const dateStr = formatDateLocal(selectedDate);
                  return (
                    <DragDropContext onDragEnd={onDragEnd}>
                      <Droppable droppableId="tasksDroppable">
                        {(dropProvided) => (
                          <div ref={dropProvided.innerRef} {...dropProvided.droppableProps}>
                            {orderedTasks.map((task, index) => {
                              const isPreventative = typeof task.id === 'string' && task.id.startsWith('p_');
                              const done = completedTasks.some(c => c.task_id === task.id && c.completion_date.split('T')[0] === dateStr);
                              return (
                                <Draggable key={task.id} draggableId={task.id} index={index}>
                                  {(dragProvided, snapshot) => (
                                    <div
                                      ref={dragProvided.innerRef}
                                      {...dragProvided.draggableProps}
                                      {...dragProvided.dragHandleProps}
                                      className={`d-flex align-items-center justify-content-between mb-2 p-2 border rounded ${isPreventative ? 'bg-warning bg-opacity-10 border-warning' : ''}`}
                                      style={{
                                        ...dragProvided.draggableProps.style,
                                        backgroundColor: snapshot.isDragging ? '#f8f9fa' : undefined,
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
                                      <div className="flex-shrink-0">
                                        <CircularCheckButton
                                          onClick={async () => {
                                            try {
                                              if (!done) {
                                                const completion = await markTaskComplete(task.id, formatDateLocal(selectedDate), getToken);
                                                if (completion) {
                                                  setCompletedTasks(prev => [...prev, completion]);
                                                }
                                              } else {
                                                await unmarkTaskComplete(task.id, formatDateLocal(selectedDate), getToken);
                                                setCompletedTasks(prev =>
                                                  prev.filter(
                                                    c => !(c.task_id === task.id && c.completion_date.split('T')[0] === formatDateLocal(selectedDate))
                                                  )
                                                );
                                              }
                                            } catch (err) {
                                              console.error('Error toggling task completion:', err);
                                              setError('Failed to toggle task completion');
                                            }
                                          }}
                                          ariaLabel={done ? 'Undo Complete' : 'Mark Complete'}
                                          disabled={false}
                                        />
                                      </div>
                                    </div>
                                  )}
                                </Draggable>
                              );
                            })}
                            {dropProvided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </DragDropContext>
                  );
                })()
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
                  const dateStr = formatDateLocal(date);
                  const hasDone = completedTasks.some(
                    c => c.completion_date.split('T')[0] === dateStr
                  );
                  return hasDone ? 'bg-success text-white rounded' : '';
                }}
              />
            </Card.Body>
          </Card>
          <Card>
            <Card.Header style={{ backgroundColor: PERIWINKLE, color: '#000' }}>
              <h5 className="mb-0">Additional Pages</h5>
            </Card.Header>
            <Card.Body>
            <PawButton onClick={() => navigate(`/pet/${pet.id}/files`)}>
                Files
              </PawButton>
              <PawButton onClick={() => navigate(`/pet/${pet.id}/shots`)}>
                Immunizations
              </PawButton>
            {pet.is_working_dog && pet.animal_type === 'Service Animal' && (
              <PawButton onClick={() => navigate(`/pet/${pet.id}/servicetasks`)}>
                Service Dog Tasks
              </PawButton>
            )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default PetProfile;