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
  due_day?: number; // Add due_day property for preventatives
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

/**
 * Filter preventatives based on the selected date, including last-day-of-month logic
 * 
 * This function applies the following rules:
 * 1. Return preventatives with due_day matching the selected day
 * 2. If the selected day is the last day of the month, also return preventatives with due_day
 *    greater than the last day of the month (e.g., 31st in a 30-day month)
 */
/**
 * Filter preventatives based on the selected date, including last-day-of-month logic
 * 
 * This function applies the following rules:
 * 1. Return preventatives with due_day matching the selected day
 * 2. If the selected day is the last day of the month, also return preventatives with due_day
 *    greater than the last day of the month (e.g., 31st in a 30-day month)
 */
export function filterPreventativesForDate(preventatives: DailyTask[], date: Date): DailyTask[] {
  // Ensure we're working with a clean date object (no time component)
  const cleanDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  const selectedDay = cleanDate.getDate();
  const selectedYear = cleanDate.getFullYear();
  const selectedMonth = cleanDate.getMonth();
  
  // Calculate the last day of the selected month
  const lastDayOfMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const isLastDayOfMonth = selectedDay === lastDayOfMonth;
  
  console.log('📅 PREVENTATIVE FILTERING - Date details:', {
    date: cleanDate.toISOString(),
    day: selectedDay,
    month: selectedMonth + 1, // Display 1-indexed month for clarity
    monthName: cleanDate.toLocaleString('default', { month: 'long' }),
    year: selectedYear,
    lastDayOfMonth,
    isLastDayOfMonth
  });
  
  // Log raw preventatives data to see what we're working with
  console.log('🔍 Raw preventatives data:', preventatives);
  
  const filteredResults = preventatives.filter(prev => {
    // Skip non-preventative tasks
    if (prev.task_type !== 'preventative') {
      return false;
    }
    
    // Get due_day value - it might be a string in the API response
    let dueDayValue: number | null = null;
    
    if (prev.due_day !== undefined) {
      // If it's already a number, use it directly
      if (typeof prev.due_day === 'number') {
        dueDayValue = prev.due_day;
      } 
      // If it's a string, try to convert it to a number
      else if (typeof prev.due_day === 'string') {
        dueDayValue = parseInt(prev.due_day, 10);
      }
    }
    
    // Skip if we couldn't get a valid due_day
    if (dueDayValue === null || isNaN(dueDayValue)) {
      console.log(`⚠️ Skipping preventative ${prev.id} - invalid due_day:`, prev.due_day);
      return false;
    }
    
    // Check if the preventative is due on the selected day
    const dueDayMatches = dueDayValue === selectedDay;
    
    // For the last day of the month, also include preventatives due on days
    // that don't exist in the current month (e.g., 31st in a 30-day month)
    const isOverflowPreventative = isLastDayOfMonth && dueDayValue > lastDayOfMonth;
    
    const shouldInclude = dueDayMatches || isOverflowPreventative;
    
    console.log(`Preventative #${prev.id} (${prev.task_name}) with due_day=${dueDayValue}:`, {
      dueDayMatches,
      isLastDayOfMonth,
      isOverflowPreventative,
      shouldInclude
    });
    
    return shouldInclude;
  });
  
  console.log('💥 FILTERING RESULTS:', {
    date: cleanDate.toLocaleDateString(),
    totalPreventatives: preventatives.length,
    filteredCount: filteredResults.length,
    filteredPreventatives: filteredResults.map(p => ({
      id: p.id,
      name: p.task_name,
      due_day: p.due_day
    }))
  });
  
  return filteredResults;
}

export async function fetchDailyTasks(
  petId: string,
  getToken: GetTokenFn,
  date?: Date
): Promise<DailyTask[]> {
  console.log('Fetching daily tasks for pet:', {
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