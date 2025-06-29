export interface Pet {
  id: number;
  user_id: string;
  name: string;
  breed: string | null;
  birthdate: Date | null;
  image_url: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreatePetDTO {
  name: string;
  breed: string | null;
  birthdate: Date | null;
  user_id: string;
  image_url: string | null;
}
