export type User = {
  id?: string;
  name: string;
  email: string;
  role?: "user" | "admin";
};

export type LoginForm = {
  email: string;
  password: string;
};

export type RegisterForm = {
  name: string;
  email: string;
  password: string;
};