export type AdminProfile = {
  id: string;
  email: string;
  full_name: string | null;
  is_admin: boolean;
};

export type AdminMemorial = {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  is_published: boolean;
  hero_image_url: string | null;
  user_id: string;
  date_of_birth: string | null;
  date_of_death: string | null;
  tagline: string | null;
  bio: string | null;
  customer_name: string | null;
  customer_email: string | null;
};
