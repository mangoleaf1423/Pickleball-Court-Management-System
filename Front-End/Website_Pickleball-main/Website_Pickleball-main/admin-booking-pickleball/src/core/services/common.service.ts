import ApiURL from '../class/ApiURL';
import { BaseService } from '../class/BaseService';

class CommonService extends BaseService {
  getProvinceList() {
    return this.get(`${ApiURL.province}`);
  }

  getDistrictsListByProvince(provinceId: number | string) {
    return this.get(`${ApiURL.district}/${provinceId}`);
  }

  getWardListByDistrict(districtId: number | string) {
    return this.get(`${ApiURL.ward}/${districtId}`);
  }
}

export default new CommonService('', true, process.env.REACT_APP_BASE_URL_LOCATION);
