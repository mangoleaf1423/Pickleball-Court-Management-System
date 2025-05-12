import ApiURL from '../class/ApiURL';
import { BaseService } from '../class/BaseService';
import { CURRENT_ENV } from '../configs/env';
import { CreateUserKong, IResponseList, PayloadUpdateUserKong, SearchParamsValue, UpdateUserKong, UserKong } from '../types';

class UserService extends BaseService {

  getUserList = (params: SearchParamsValue): Promise<IResponseList<UserKong[]>> => {
    return this.get('/users', params);
  }

  getStaffList = (params: SearchParamsValue): Promise<IResponseList<UserKong[]>> => {
    return this.get('/users/getUsersByManager?roleName=STAFF', params);
  }

  getUserById = (id: string): Promise<UserKong> => {
    return this.get(`/users/${id}`);
  }

  createUser(payload: CreateUserKong): Promise<UserKong> {
    return this.post('/users/admin_create', payload);
  }

  updateUser(payload: UpdateUserKong): Promise<UserKong> {
    return this.put('/users/admin_update', payload);
  }

  // deleteUser(id: number): Promise<UserKong> {
  //   return this.post(
  //     '/delete',
  //     {},
  //     {
  //       params: {
  //         id
  //       }
  //     }
  //   );
  // }






}

export default new UserService(ApiURL.user, true, CURRENT_ENV.API_URL);
