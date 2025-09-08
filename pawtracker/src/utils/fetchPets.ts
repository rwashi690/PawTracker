import { API_URL } from '../config';

// Using a more generic type since we only need the getToken function
type GetTokenFn = () => Promise<string | null>;

const BASE_URL = `${API_URL}/api`;

const makeAuthenticatedRequest = async (
  endpoint: string,
  getToken: GetTokenFn,
  options: RequestInit = {}
) => {
  const token = await getToken();
  if (!token) {
    throw new Error('Not authenticated. Please sign in.');
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
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

  // For 204 No Content responses, don't try to parse JSON
  if (response.status === 204) {
    return;
  }

  return response.json();
};

export interface Pet {
  id: number;
  name: string;
  image_url: string;
  sex?: string;
  species?: string;
  animal_type?: string;
  birthdate?: string;
  is_adopted?: boolean;
  adoption_date?: string;
  is_working_dog?: boolean;
  breed?: string;
}

export interface DailyTask {
  task_type: 'daily' | 'preventative';
  id: number;
  pet_id: number;
  task_name: string;
  created_at: string;
  updated_at: string;
}

export interface TaskCompletion {
  id: number;
  task_id: number;
  completion_date: string;
  completed_at: string;
}

export interface PreventativeCompletion {
  id: number;
  preventative_id: number;
  completion_date: string;
  completed_at: string;
}

export interface Task {
  id: number;
  task_name: string;
  task_type: 'daily' | 'preventative';
  due_day?: number;
}

export const fetchPet = async (
  id: string | undefined,
  getToken: GetTokenFn
): Promise<Pet> => {
  if (!id) {
    throw new Error('No pet ID provided');
  }
  return makeAuthenticatedRequest(`/pets/${id}`, getToken);
};

export const updatePet = async (
  id: string,
  data: Partial<Pet>,
  getToken: GetTokenFn
): Promise<Pet> => {
  return makeAuthenticatedRequest(`/pets/${id}`, getToken, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

export const deletePet = async (
  id: string,
  getToken: GetTokenFn
): Promise<void> => {
  await makeAuthenticatedRequest(`/pets/${id}`, getToken, {
    method: 'DELETE',
  });
};

export async function fetchDailyTasks(
  petId: string,
  getToken: GetTokenFn,
  date?: Date
): Promise<DailyTask[]> {
  console.log('🎯 fetchDailyTasks called with:', {
    petId,
    date: date?.toLocaleString(),
    dateISO: date?.toISOString()
  });
  const dateParam = date ? `?date=${date.toISOString()}` : '';
  const endpoint = `/tasks/pet/${petId}${dateParam}`;
  console.log('📡 Making API request to:', `${BASE_URL}${endpoint}`);
  console.log('🔑 Using auth token:', await getToken());
  return makeAuthenticatedRequest(endpoint, getToken);
};

export const createDailyTask = async (
  petId: string,
  taskName: string,
  getToken: GetTokenFn
): Promise<DailyTask> => {
  return makeAuthenticatedRequest(`/tasks/pet/${petId}/tasks`, getToken, {
    method: 'POST',
    body: JSON.stringify({ task_name: taskName }),
  });
};

export const deleteDailyTask = async (
  taskId: string,
  getToken: GetTokenFn
): Promise<void> => {
  await makeAuthenticatedRequest(`/tasks/${taskId}`, getToken, {
    method: 'DELETE',
  });
};

export const markTaskComplete = async (
  taskId: string,
  date: string,
  getToken: GetTokenFn
): Promise<TaskCompletion> => {
  try {
    return await makeAuthenticatedRequest(`/tasks/${taskId}/complete`, getToken, {
      method: 'POST',
      body: JSON.stringify({ completion_date: date }),
    });
  } catch (error: any) {
    console.error('Error in markTaskComplete:', error);
    throw new Error(error.message || 'Failed to mark task as complete');
  }
};
export async function fetchMonthlyPreventatives(petId: string, getToken: () => Promise<string>) {
  const token = await getToken();
  const resp = await fetch(`${BASE_URL}/pets/${petId}/preventatives`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return resp.json(); // array of { id, name, notes, action_date }
}

export async function markPreventativeComplete(prevId: number, date: string, getToken: () => Promise<string>): Promise<PreventativeCompletion> {
  const token = await getToken();
  const resp = await fetch(`${BASE_URL}/preventatives/${prevId}/complete`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ completion_date: date })
  });
  return resp.json(); // the completion record or null
}

export async function fetchPreventativeCompletion(prevId: number, date: string, getToken: () => Promise<string>) {
  const token = await getToken();
  const resp = await fetch(`${BASE_URL}/preventatives/${prevId}/completions/${date}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return resp.json(); // completion record or null
}

export interface ServiceDogTask {
  id: number;
  pet_id: number;
  task_name: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export const fetchServiceDogTasks = async (
  petId: string,
  getToken: GetTokenFn
): Promise<ServiceDogTask[]> => {
  return makeAuthenticatedRequest(`/service-dog-tasks/pet/${petId}`, getToken);
};

export const createServiceDogTask = async (
  petId: string,
  taskName: string,
  notes: string = '',
  getToken: GetTokenFn
): Promise<ServiceDogTask> => {
  return makeAuthenticatedRequest(`/service-dog-tasks/pet/${petId}/tasks`, getToken, {
    method: 'POST',
    body: JSON.stringify({ task_name: taskName, notes }),
  });
};

export const deleteServiceDogTask = async (
  taskId: string,
  getToken: GetTokenFn
): Promise<void> => {
  await makeAuthenticatedRequest(`/service-dog-tasks/${taskId}`, getToken, {
    method: 'DELETE',
  });
};