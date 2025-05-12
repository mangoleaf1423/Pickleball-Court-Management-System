import ApiURL from '../class/ApiURL';
import { BaseService } from '../class/BaseService';

class CommonService extends BaseService {
  getProvinceList() {
    return this.get(`${ApiURL.province}`);
  }

  getDistrictsListByProvince(provinceId: number | string) {
    return this.get(`${ApiURL.province}/${provinceId}/${ApiURL.district}`);
  }

  getWardListByDistrict(districtId: number | string) {
    return this.get(`${ApiURL.district}/${districtId}/${ApiURL.ward}`);
  }
}

export default new CommonService('');
