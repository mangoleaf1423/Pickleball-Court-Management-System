

export interface UserKong {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  dob: string;
  phoneNumber: string;
  student?: boolean;
  gender: string;
  userRank: string;
  active?: boolean;
  courtNames?: string[];
  roles: Role[];
}

export interface Order {
  id: string;
  courtId: string;
  courtName: string;
  address: string;
  userId: string;
  customerName: string;
  phoneNumber: string;
  note: string | null;
  orderType: string;
  orderStatus: string;
  paymentStatus: string;
  discountCode: string | null;
  totalAmount: number;
  discountAmount: number;
  paymentAmount: number;
  amountPaid: number | null;
  amountRefund: number | null;
  createdAt: string;
  bookingDate?: string;
}

export interface CreateUserKong {
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  dob: string;
  roles: Role[];
  email: string;
  phoneNumber: string;
  student: boolean;
  userRank: string | null;
  gender: string | null;
  courtId: string;
}

export interface UpdateUserKong {
  id: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  dob: string;
  roles: Role[];
  email: string;
  phoneNumber: string;
  userRank?: string | null;
  gender: string | null;
  courtIds: string;
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
