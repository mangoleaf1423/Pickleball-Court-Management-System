import { BaseService } from '../class/BaseService';
import { AuthLogin, SessionUser } from '../types';

class AuthService extends BaseService {
  loginKong(payload: AuthLogin): Promise<SessionUser> {
    return this.post(`/identity/auth/token`, payload, { baseURL: process.env.REACT_APP_BASE_URL_SERVICE });
  }
  
}
export default new AuthService('');
