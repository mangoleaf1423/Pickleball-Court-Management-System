
import { BaseService } from '../class/BaseService';
import { AuthLogin, AuthRegister, SessionUser } from '../types';

class AuthService extends BaseService {
  loginKong(payload: AuthLogin): Promise<SessionUser> {
    return this.post(`/identity/auth/token`, payload, { baseURL: process.env.REACT_APP_BASE_URL_SERVICE });
  }

  registerKong(payload: AuthRegister): Promise<SessionUser> {
    return this.post(`/identity/users/create_user`, payload, { baseURL: process.env.REACT_APP_BASE_URL_SERVICE });
  }

  registerStudent(payload: AuthRegister): Promise<SessionUser> {
    return this.post(`/identity/users/registerForStudent`, payload, { baseURL: process.env.REACT_APP_BASE_URL_SERVICE });
  }
}
export default new AuthService('');
