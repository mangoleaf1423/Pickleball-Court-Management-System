import ApiURL from '../class/ApiURL';
import { BaseService } from '../class/BaseService';
import { CURRENT_ENV } from '../configs/env';
import { IResponseList, SearchParamsValue, UserKong } from '../types';

class TransactionService extends BaseService {

  getTransactionList = (params: SearchParamsValue): Promise<IResponseList<UserKong[]>> => {
    return this.get('/admin/dashboard/transactions', params);
  }
}

export default new TransactionService(ApiURL.user, true, CURRENT_ENV.API_URL);
