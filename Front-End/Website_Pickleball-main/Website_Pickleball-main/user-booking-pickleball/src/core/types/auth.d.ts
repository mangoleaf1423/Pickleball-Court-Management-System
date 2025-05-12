import { UserKong } from './user';

export interface AuthLogin {
  username: string;
  password: string;
}

export interface AuthRegister {
  firstName: string;
  lastName: string;
  username: string;
  password: string;
  phoneNumber: string;
  email: string;
  dob: string;
} 

export interface SessionUser {
  result: {
    user: UserKong;
    authenticated: boolean;
    token: string;
  }
}
