export interface Province {
  id: string;
  name: string;
  typeText?: string;
  name_en?: string;
  full_name?: string;
}

export interface District {
  id: number;
  name: string;
  province_id: number;
  type: string;
}

export interface Ward {
  id: number;
  name: string;
  district_id: number;
  province_id: number;
  type: string;
}
