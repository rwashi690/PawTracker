import React, { useState, useEffect } from 'react';
import MonthlyPreventatives from '../components/MonthlyPreventatives';
import {
  Container,
  Row,
  Col,
  Button,
  Form,
  ListGroup,
  Alert,
  Toast,
} from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import BackButton from '../components/BackButton';
import { useAuth } from '@clerk/clerk-react';
import DropdownComponent from '../components/DropdownComponent';
import BreedDropdown from '../components/BreedDropdown';
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
import CircularPlusButton from '../components/CircularPlusButton';
import DateDropdowns from '../components/DateDropdowns';
import PawButton from '../components/PawButton';



const SettingsPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getToken } = useAuth();

  const [pet, setPet] = useState<Pet | null>(null);
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [newTask, setNewTask] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Date state
  const [birthMonth, setBirthMonth] = useState<number>(0);
  const [birthDay, setBirthDay] = useState<number>(0);
  const [birthYear, setBirthYear] = useState<number>(0);

  // Adoption state
  const [adoptionMonth, setAdoptionMonth] = useState<number>(0);
  const [adoptionDay, setAdoptionDay] = useState<number>(0);
  const [adoptionYear, setAdoptionYear] = useState<number>(0);

  const animalTypeOptions = [
    'Service Animal',
    'Therapy Animal',
    'Emotional Support Animal',
  ];
  const speciesOptions = ['Canine', 'Feline', 'Other'];

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;

      try {
        setIsLoading(true);
        const [petData, tasksData] = await Promise.all([
          fetchPet(id, getToken),
          fetchDailyTasks(id, getToken),
        ]);
        setPet(petData);
        setTasks(tasksData);

        // Initialize birth date if available
        if (petData.birthdate) {
          const birthDate = new Date(petData.birthdate);
          setBirthYear(birthDate.getFullYear());
          setBirthMonth(birthDate.getMonth() + 1);
          setBirthDay(birthDate.getDate());
        }

        // Initialize adoption date if available
        if (petData.adoption_date) {
          const adoptionDate = new Date(petData.adoption_date);
          setAdoptionYear(adoptionDate.getFullYear());
          setAdoptionMonth(adoptionDate.getMonth() + 1);
          setAdoptionDay(adoptionDate.getDate());
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
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

  const handleUpdatePet = async (updates?: Partial<Pet>) => {
    if (!pet || !id) return;

    try {
      const formUpdates: Partial<Pet> = updates || {
        birthdate: birthYear ? `${birthYear}-${birthMonth.toString().padStart(2, '0')}-${birthDay.toString().padStart(2, '0')}` : undefined,
        is_adopted: pet.is_adopted,
        adoption_date: adoptionYear ? `${adoptionYear}-${adoptionMonth.toString().padStart(2, '0')}-${adoptionDay.toString().padStart(2, '0')}` : undefined,
        is_working_dog: pet.is_working_dog,
        animal_type: pet.animal_type,
        sex: pet.sex,
        species: pet.species
      };

      setError('');
      await updatePet(id, formUpdates, getToken);
      setPet({ ...pet, ...formUpdates });
      setShowToast(true);
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

      <div className="d-flex justify-content-between align-items-center mb-4">
        <BackButton onClick={() => navigate(-1)} />
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

      <Row>
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

          <Form className="mt-3">
            <div className="d-flex align-items-center gap-2">
              <Form.Control
                size="sm"
                type="text"
                placeholder="New task"
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                className="flex-grow-1"
              />
              <div style={{ flexShrink: 0 }}>
                <CircularPlusButton onClick={handleAddTask} />
              </div>
            </div>
          </Form>
          {id && <MonthlyPreventatives petId={parseInt(id)} />}
        </Col>

        <Col md={6}>
          <h5 className="mb-3">Pet Information</h5>

          <Row className="mb-3">
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Sex</Form.Label>
                <Form.Select
                  value={pet.sex || ''}
                  onChange={(e) => handleUpdatePet({ sex: e.target.value })}
                  title="Select pet sex"
                >
                  <option value="">Select sex</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </Form.Select>
              </Form.Group>

              <BreedDropdown
                species={pet.species || ''}
                value={pet.breed || ''}
                onChange={(value) => handleUpdatePet({ breed: value })}
              />
            </Col>
            <Col md={6}>
              <DropdownComponent
                label="Species"
                options={speciesOptions}
                value={pet.species || ''}
                onChange={(value) => handleUpdatePet({ species: value })}
              />
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>Birth Date</Form.Label>
            <DateDropdowns
              label=""
              selectedMonth={birthMonth}
              selectedDay={birthDay}
              selectedYear={birthYear}
              onMonthChange={setBirthMonth}
              onDayChange={setBirthDay}
              onYearChange={setBirthYear}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Check
              type="checkbox"
              label="This pet is adopted"
              checked={pet.is_adopted}
              onChange={(e) => handleUpdatePet({ is_adopted: e.target.checked })}
            />
          </Form.Group>

          {pet.is_adopted && (
            <Form.Group className="mb-3">
              <Form.Label>Adoption Date</Form.Label>
              <DateDropdowns
                label=""
                selectedMonth={adoptionMonth}
                selectedDay={adoptionDay}
                selectedYear={adoptionYear}
                onMonthChange={setAdoptionMonth}
                onDayChange={setAdoptionDay}
                onYearChange={setAdoptionYear}
              />
            </Form.Group>
          )}

          <Form.Group className="mb-3">
            <Form.Check
              type="checkbox"
              label="This is a working animal"
              checked={pet.is_working_dog}
              onChange={(e) => handleUpdatePet({ is_working_dog: e.target.checked })}
            />
          </Form.Group>

          {pet.is_working_dog && (
            <DropdownComponent
              label="Working Animal Type"
              options={animalTypeOptions}
              value={pet.animal_type || ''}
              onChange={(value) => handleUpdatePet({ animal_type: value })}
            />
          )}

          <div className="d-grid gap-3 mt-4">
            <PawButton onClick={() => handleUpdatePet()}>
              Update
            </PawButton>
            <PawButton variant="danger" onClick={handleDeletePet}>
              Delete
            </PawButton>
          </div>
        </Col>
      </Row>
      <Toast
        onClose={() => setShowToast(false)}
        show={showToast}
        delay={3000}
        autohide
        style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          minWidth: '200px',
          backgroundColor: '#9999ff',
          color: '#ffffff'
        }}
      >
        <Toast.Body>Pet updated successfully!</Toast.Body>
      </Toast>
    </Container>
  );
};

export default SettingsPage;