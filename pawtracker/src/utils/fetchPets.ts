// Using a more generic type since we only need the getToken function
type GetTokenFn = () => Promise<string | null>;

const BASE_URL = 'http://localhost:3001/api';

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
}

export interface DailyTask {
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

export const fetchDailyTasks = async (
  petId: string,
  getToken: GetTokenFn
): Promise<DailyTask[]> => {
  return makeAuthenticatedRequest(`/pets/${petId}/tasks`, getToken);
};

export const createDailyTask = async (
  petId: string,
  taskName: string,
  getToken: GetTokenFn
): Promise<DailyTask> => {
  return makeAuthenticatedRequest(`/pets/${petId}/tasks`, getToken, {
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
  return makeAuthenticatedRequest(`/tasks/${taskId}/complete`, getToken, {
    method: 'POST',
    body: JSON.stringify({ completion_date: date }),
  });
};
