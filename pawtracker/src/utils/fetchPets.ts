// Using a more generic type since we only need the getToken function
type GetTokenFn = () => Promise<string | null>;

export interface Pet {
  id: number;
  name: string;
  image_url: string;
}

export const fetchPet = async (
  id: string | undefined,
  getToken: GetTokenFn
): Promise<Pet> => {
  if (!id) {
    throw new Error('No pet ID provided');
  }

  const token = await getToken();
  if (!token) {
    throw new Error('Not authenticated. Please sign in.');
  }

  const response = await fetch(`http://localhost:3001/api/pets/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch pet details');
  }

  return response.json();
};
