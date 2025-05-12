import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import Qs from 'qs';

import { CURRENT_ENV } from '@/core/configs/env';
import { useApp } from '@/store';
import { AuthHelper, CommonHelper } from '@/utils/helpers';

interface Axios extends AxiosInstance {
  [key: string]: any;
}

const axiosBase: Axios = axios.create({ baseURL: CURRENT_ENV.API_URL });
axiosBase.interceptors.response.use(
  (response) => {
    if ('success' in response.data && !response.data?.success) {
      CommonHelper.handleError(response.data);
      return Promise.reject(response.data);
    }

    return response;
  },
  (error) => {
    CommonHelper.handleError(error);
    return Promise.reject(error);
  }
);

const authAxios: Axios = axios.create({
  baseURL: CURRENT_ENV.API_URL,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'Access-Control-Allow-Origin': '*' },
  paramsSerializer: {
    serialize: function (params) {
      return Qs.stringify(params, { arrayFormat: 'comma' });
    }
  }
});
authAxios.interceptors.request.use(
  (config) => {
    const token = useApp.getState().user?.result.token;

    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    Promise.reject(error);
  }
);
authAxios.interceptors.response.use(
  (response) => {
    if (typeof response.data === 'string' && /^\d+$/.test(response.data)) {
      return response;
    }
    
    if ('success' in response.data && !response.data?.success) {
      CommonHelper.handleError(response.data);
      return Promise.reject(response.data);
    }

    return response;
  },
  (error) => {
    const { response } = error;

    if (response && response.status === 401 && !!useApp.getState().user) {
      AuthHelper.clearToken();
      window.location.href = `/login?source=${window.location.pathname}`;
    }

    CommonHelper.handleError(error);
    return Promise.reject(error);
  }
);

type CallWithParamsMethod = (
  method: 'get' | 'delete',
  url: string,
  body?: Record<string, any>,
  options?: Record<string, any>,
  useAuth?: boolean,
  usePrefix?: boolean
) => Promise<any>;
type CallWithBodyMethod = (
  method: 'post' | 'put' | 'patch',
  url: string,
  body?: Record<string, any>,
  options?: Record<string, any>,
  useAuth?: boolean,
  usePrefix?: boolean
) => Promise<any>;
type VerbMethod = (
  url: string,
  body?: Record<string, any>,
  options?: AxiosRequestConfig,
  useAuth?: boolean,
  usePrefix?: boolean
) => Promise<any>;

class BaseService {
  public constructor(private prefix: string, private useAuth = true, private baseUrl = '') {}

  public callWithParams: CallWithParamsMethod = (method, url, params, options, useAuth = true, usePrefix = true) => {
    const config: AxiosRequestConfig = { params, ...options };
    if (this.baseUrl) {
      config.baseURL = this.baseUrl;
    }
    if (useAuth && this.useAuth) {
      return authAxios[method](usePrefix ? `${this.prefix}${url}` : url, config).then(({ data }: AxiosResponse) => {
        return data;
      });
    }

    return axiosBase[method](usePrefix ? `${this.prefix}${url}` : url, config).then(({ data }: AxiosResponse) => data);
  };

  public callWithBody: CallWithBodyMethod = (method, url, body, options, useAuth = true, usePrefix = true) => {
    const config: AxiosRequestConfig = { ...options };
    if (this.baseUrl) {
      config.baseURL = this.baseUrl;
    }
    if (useAuth && this.useAuth) {
      return authAxios[method](usePrefix ? `${this.prefix}${url}` : url, body, config).then(
        ({ data }: AxiosResponse) => data
      );
    }

    return axiosBase[method](usePrefix ? `${this.prefix}${url}` : url, body, config).then(
      ({ data }: AxiosResponse) => data
    );
  };

  public get: VerbMethod = (url, params, options, useAuth, usePrefix = true) => {
    return this.callWithParams('get', url, params, options, useAuth, usePrefix);
  };

  public post: VerbMethod = (url, body, options, useAuth, usePrefix = true) => {
    return this.callWithBody('post', url, body, options, useAuth, usePrefix);
  };

  public put: VerbMethod = (url, body, options, useAuth, usePrefix = true) => {
    return this.callWithBody('put', url, body, options, useAuth, usePrefix);
  };

  public patch: VerbMethod = (url, body, options, useAuth, usePrefix = true) => {
    return this.callWithBody('patch', url, body, options, useAuth, usePrefix);
  };

  public delete: VerbMethod = (url, params, options, useAuth, usePrefix = true) => {
    return this.callWithParams('delete', url, params, options, useAuth, usePrefix);
  };
}

export { BaseService };
