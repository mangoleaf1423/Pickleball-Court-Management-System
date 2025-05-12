import ApiURL from '../class/ApiURL';
import { BaseService } from '../class/BaseService';
import { IResponseList, ResponseCommon, SearchParamsValue, Setting } from '../types';

class ConfigService extends BaseService {
  getConfigList(params: SearchParamsValue): Promise<IResponseList<Setting[]>> {
    return this.get('', params);
  }

  updateConfig(configCode: string, payload: { value: string }): Promise<ResponseCommon<any>> {
    return this.patch(`/${configCode}`, payload);
  }

  reLoginRAR() {
    return this.get('/rar/relogin');
  }
}

export default new ConfigService(ApiURL.config);
