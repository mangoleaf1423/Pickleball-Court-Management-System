import ApiURL from '../class/ApiURL';
import { BaseService } from '../class/BaseService';
import { CURRENT_ENV } from '../configs/env';
import { IResponseList, Order, SearchParamsValue, UserKong } from '../types';

class OrderService extends BaseService {

  getOrderList = (params: SearchParamsValue): Promise<IResponseList<Order[]>> => {
    return this.get('/admin/dashboard/orders', params);
  }
}

export default new OrderService(ApiURL.user, true, CURRENT_ENV.API_URL);
