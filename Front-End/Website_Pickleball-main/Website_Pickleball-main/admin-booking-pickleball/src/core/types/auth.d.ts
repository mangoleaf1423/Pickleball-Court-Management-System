import { UserKong } from './user';

export interface AuthLogin {
  username: string;
  password: string;
}

export interface SessionUser {
  result: {
    user: UserKong;
    authenticated: boolean;
    token: string;
  }
}
