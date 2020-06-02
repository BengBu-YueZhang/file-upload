// Form axios

const ignoreDuplicateOf = [
  'age', 'authorization', 'content-length', 'content-type', 'etag',
  'expires', 'from', 'host', 'if-modified-since', 'if-unmodified-since',
  'last-modified', 'location', 'max-forwards', 'proxy-authorization',
  'referer', 'retry-after', 'user-agent'
];

export const trim = (str: string) => {
  return str.replace(/^\s*/, '').replace(/\s*$/, '');
}

export const isFormData = (val: any): boolean => {
  return (typeof FormData !== 'undefined') && (val instanceof FormData);
};

export const settle = (
  resolve: (value?: any) => void,
  reject: (reason?: any) => void,
  response: any
) => {
  const validateStatus = response.config.validateStatus;
  if (!response.status || !validateStatus || validateStatus(response.status)) {
    resolve(response);
  } else {
    reject(createError(
      'Request failed with status code ' + response.status,
      response.config,
      null,
      response.request,
      response
    ));
  }
};

export const parseHeaders = (headers: string) => {
  const parsed: any = {};
  let key;
  let val;
  let i;

  if (!headers) { return parsed; }

  headers.split('\n').forEach((line) => {
    i = line.indexOf(':');
    key = trim(line.substr(0, i)).toLowerCase();
    val = trim(line.substr(i + 1));

    if (key) {
      if (parsed[key] && ignoreDuplicateOf.indexOf(key) >= 0) {
        return;
      }
      if (key === 'set-cookie') {
        parsed[key] = (parsed[key] ? parsed[key] : []).concat([val]);
      } else {
        parsed[key] = parsed[key] ? parsed[key] + ', ' + val : val;
      }
    }
  });

  return parsed;
};

export const createError = (
  message: string,
  config: any,
  code: any,
  request: any,
  response: any
): Error => {
  const error = new Error(message);
  return enhanceError(error, config, code, request, response);
}

export const enhanceError = (
  error: any,
  config: any,
  code: any,
  request: any,
  response: any
): Error => {
  error.config = config;
  if (code) {
    error.code = code;
  }
  error.request = request;
  error.response = response;
  error.isAxiosError = true;
  error.toJSON = function toJSON() {
    return {
      message: this.message,
      name: this.name,
      description: this.description,
      number: this.number,
      fileName: this.fileName,
      lineNumber: this.lineNumber,
      columnNumber: this.columnNumber,
      stack: this.stack,
      config: this.config,
      code: this.code
    };
  };
  return error;
}

const http = (config: any): Promise<any> => {
  return new Promise((resolve, reject) => {

    const requestData = config.data;
    const requestHeaders = config.headers;
    let request = new XMLHttpRequest();

    // 判断是否是FormData对象, 如果是, 删除header的Content-Type字段，让浏览器自动设置Content-Type字段
    if (isFormData(requestData)) {
      delete requestHeaders['Content-Type'];
    }

    request.open(
      config.method.toUpperCase(),
      config.url,
      true
    );

    request.onreadystatechange = () => {
      if (!request || request.readyState !== 4) {
        return;
      }

      // request.status响应的数字状态码，在完成请求前数字状态码等于0
      // 如果request.status出错返回的也是0，但是file协议除外，status等于0也是一个成功的请求
      // 更多内容请参考 https://developer.mozilla.org/zh-CN/docs/Web/API/XMLHttpRequest/status
      if (request.status === 0 && !(request.responseURL && request.responseURL.indexOf('file:') === 0)) {
        return;
      }

      const responseHeaders = 'getAllResponseHeaders' in request ? parseHeaders(request.getAllResponseHeaders()) : null;
      const responseData = !config.responseType || config.responseType === 'text' ? request.responseText : request.response;
      const response = {
        data: responseData,
        status: request.status,
        statusText: request.statusText,
        headers: responseHeaders,
        config: config,
        request: request
      };

      settle(resolve, reject, response);
    }
  });
};

export default http;
