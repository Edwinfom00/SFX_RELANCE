export interface User {
  id: number;
  email: string;
  name: string;
  createdAt: Date;
}

export interface Session {
  user: User;
  token: string;
}
