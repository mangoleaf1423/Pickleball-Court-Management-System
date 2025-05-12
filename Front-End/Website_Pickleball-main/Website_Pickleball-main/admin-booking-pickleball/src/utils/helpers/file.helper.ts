import { RcFile } from 'antd/es/upload';

class FileHelper {
  public static downloadFile(data: any, fileName?: string, type?: string) {
    const fileURL = URL.createObjectURL(
      new Blob([data], {
        type: type ?? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })
    );
    const fileLink = document.createElement('a');
    fileLink.href = fileURL;
    fileLink.setAttribute('download', fileName ?? 'File');
    document.body.appendChild(fileLink);
    fileLink.click();
  }

  public static getBase64(img: RcFile, callback: (url: string) => void) {
    const reader = new FileReader();
    reader.onload = (e) => {
      callback(e.target?.result as string);
    };
    reader.readAsDataURL(img);
  }

  public static imageToBase64(img: RcFile): Promise<string> {
    return new Promise((resole) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resole(e.target?.result as string);
      };
      reader.readAsDataURL(img);
    });
  }
}

export default FileHelper;
