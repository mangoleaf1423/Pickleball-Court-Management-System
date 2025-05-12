import ApiURL from '../class/ApiURL';
import { BaseService } from '../class/BaseService';
import { CURRENT_ENV } from '../configs/env';
import { IResponseList, SearchParamsValue } from '../types';
import { CourtManage, CreateCourtManage } from '../types/court';

class CourtService extends BaseService {
    getCourtList = (params: SearchParamsValue): Promise<IResponseList<CourtManage[]>> => {
        return this.get('/getCourtsManage', params);
    };

    getCourtById = (id: string): Promise<IResponseList<CourtManage>> => {
        return this.get(`/public/${id}`);
      };

    createCourt = (payload: CreateCourtManage): Promise<IResponseList<CourtManage>> => {
        return this.post('/create_court', payload);
      };

    updateCourt = (payload: CourtManage): Promise<IResponseList<CourtManage>> => {
        return this.put(`/update`, payload);
      };

    deleteCourt = (id: string): Promise<IResponseList<CourtManage>> => {
        return this.delete(`/${id}`);
      };
  
}
export default new CourtService(ApiURL.court, true, CURRENT_ENV.API_URL);
