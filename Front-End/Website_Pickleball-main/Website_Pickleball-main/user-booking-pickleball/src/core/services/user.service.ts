import ApiURL from '../class/ApiURL';
import { BaseService } from '../class/BaseService';
import { CURRENT_ENV } from '../configs/env';
import { PayloadUpdateUserKong, UserKong } from '../types';

class UserService extends BaseService {
  createUser(payload: Omit<UserKong, 'id'>): Promise<UserKong> {
    return this.post('/create', payload);
  }

  updateUser(id: number | string, payload: PayloadUpdateUserKong): Promise<UserKong> {
    return this.post('/update', payload, {
      params: {
        id
      }
    });
  }

  deleteUser(id: number): Promise<UserKong> {
    return this.post(
      '/delete',
      {},
      {
        params: {
          id
        }
      }
    );
  }

  refreshAPIKey(id: number, refreshApiKey: boolean): Promise<UserKong> {
    return this.post(
      '/update',
      { refreshApiKey },
      {
        params: {
          id
        }
      }
    );
  }

  changePassword(id: number, payload: Pick<UserKong, 'passports' | 'password_confirmation'>): Promise<UserKong> {
    return this.post('/update', payload, {
      params: {
        id
      }
    });
  }
}

export default new UserService(ApiURL.userKong, true, CURRENT_ENV.API_KONG_URL);
