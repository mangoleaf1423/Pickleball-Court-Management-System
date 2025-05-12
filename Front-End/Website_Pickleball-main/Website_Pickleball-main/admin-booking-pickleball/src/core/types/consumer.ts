export interface Consumer {
  id: string;
  username: string;
  custom_id: string;
  tags: string[];
  updated_at?: number;
  created_at?: number;
}

export interface ConsumerAPIKey {
  customer: { id: string };
  created_at: number;
  id: string;
  key: string;
  tags?: any;
  ttl?: any;
}
