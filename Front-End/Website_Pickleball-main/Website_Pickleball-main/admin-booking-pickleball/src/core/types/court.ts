export interface CourtManage {
    id: string;
    name: string;
    address: string;
    phone: string;
    openTime: string;
    email: string;
    link: string;
    active: boolean;
}

export interface CreateCourtManage {
    name: string;
    address: string;
    phone: string;
    openTime: string;
    email: string;
    link: string;
    active: boolean;
    managerId?: string
}
