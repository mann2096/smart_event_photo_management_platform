export interface User{
  id:string;
  email:string;
  user_name:string;
  bio:string;
  batch:string;
  department:string;
  profile_photo:string | null;
  created_at:string;
  is_superuser: boolean;
}

export interface AuthTokens{
  access:string;
  refresh:string;
}
