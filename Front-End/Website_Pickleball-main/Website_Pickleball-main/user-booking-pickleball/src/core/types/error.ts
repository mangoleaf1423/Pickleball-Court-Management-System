export interface ErrorItem {
  message: string;
}

export interface ErrorKongKey {
  [key: string]: { message: string }[];
}

export interface ErrorKong {
  status: number;
  Errors: ErrorKongKey;
}
