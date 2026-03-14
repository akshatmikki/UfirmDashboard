import axios from 'axios';
import MessageFormat from 'messageformat';
import { getAxiosApiConfig } from './utility/apiConfig';
import { checkIfObject } from './utility/common';

const messageFormatter = new MessageFormat('en');

class ApiService {
  constructor(config) {
    const { apiKey } = config;
    this.config = config || {};
    if (apiKey) {
      console.log(apiKey);
      this.apiConfig = getAxiosApiConfig(apiKey);
      // Header Config
      if (checkIfObject(this.config.headers)) {
        this.apiConfig.headers = { ...this.apiConfig.headers, ...this.config.headers };
      }

      // JSON Request Body
      if (checkIfObject(this.config.data)) {
        this.apiConfig.data = { ...this.apiConfig.headers, ...this.config.data };
      }

      // URL Path Variables
      if (checkIfObject(this.config.pathVariables)) {
        const rawUrl = this.apiConfig.url;
        const mfUrl = messageFormatter.compile(rawUrl);
        this.apiConfig.url = mfUrl(this.config.pathVariables);
      }
      // URL Params

      if (checkIfObject(this.config.urlParams)) {
        const url = new URL(this.apiConfig.url, window.location.origin);
        const params = this.config.urlParams;
        if (params) {
          Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
          this.apiConfig.url = url;
        }
      }
      if (!this.apiConfig) {
        console.log(`No Api-config present for apiKey - ${apiKey}`);
      }
    }
  }

  getApiConfig() {
    return this.apiConfig;
  }

  handleSessionTimout(error) {
    if (typeof this.config.handleSessionTimout === 'function') {
      this.config.handleSessionTimout(error);
    }
  }

  beforeSendCallBack() {
    if (typeof this.config.beforeSendCallBack === 'function') {
      this.config.beforeSendCallBack();
    }
  }

  completeCallBack(response) {
    if (typeof this.config.completeCallBack === 'function') {
      this.config.completeCallBack(response);
    }
  }

  call() {
    this.beforeSendCallBack();

    return new Promise((resolve, reject) => {
      axios(this.apiConfig)
        .then((response) => {
          this.completeCallBack(response);
          resolve(response);
        }).catch((error) => {
          if (error && error.stack && error.stack.indexOf('Network Error') >= 0) {
            console.log('Error: ', error);
          }
          this.handleSessionTimout(error);
          this.completeCallBack(error);
          reject(error);
        });
    });
  }
}

axios.interceptors.request.use((config) => {
  console.log('interceptors request ===================');
  return config;
}, (error) => {
  console.log('interceptors request ===================');
  Promise.reject(error);
});

axios.interceptors.response.use(response => response, error => Promise.reject(error));

export default ApiService;
