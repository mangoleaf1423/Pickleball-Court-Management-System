

export interface UserKong {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  dob: string;
  phoneNumber: string;
  roles: Role[];
  student: boolean;
  userRank: string;
  gender: string;
  avatar?: string;
}

export interface PayloadUpdateUserKong extends Omit<UserKong, 'id' | 'username'> {
  refreshApiKey?: boolean;
}

export interface Role {
  name: string;
  description: string;
  enabled: boolean;
  permissions: string[];
}
