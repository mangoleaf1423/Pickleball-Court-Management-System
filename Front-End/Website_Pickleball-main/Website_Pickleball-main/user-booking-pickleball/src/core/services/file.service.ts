import ApiURL from '../class/ApiURL';
import { BaseService } from '../class/BaseService';

class FileService extends BaseService {
  downloadFileExport(path: string) {
    return this.get(`/export`, { path }, { responseType: 'blob' });
  }
}

export default new FileService(ApiURL.file);
