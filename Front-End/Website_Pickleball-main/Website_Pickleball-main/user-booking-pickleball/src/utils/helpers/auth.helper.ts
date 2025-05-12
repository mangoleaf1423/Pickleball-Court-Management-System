import { LocalStorageKeyEnum } from '@/core/enums';
import StorageHelper from './storage.helper';

class Auth {
  public static getToken() {
    const sessionUser: any = StorageHelper.get('sessionUser');
    return sessionUser?.stsTokenManager?.accessToken;
  }

  public static setToken(token: string) {
    localStorage.setItem('token', token);
  }

  public static clearToken() {
    StorageHelper.remove(LocalStorageKeyEnum.auth);
  }

  public static authenticated() {
    const token = Auth.getToken();

    if (token) {
      return true;
    }

    return false;
  }
}

export default Auth;
