import SparkMd5 from 'spark-md5';

export function noop () {
  return true
}

export function uuid () {
  const s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4() + '-' + s4();
}

export function transformStringSizeToNumberSize () {
}

export function md5 (cotent: any): string {
  return SparkMd5.hash(cotent);
}

export function getBase64 () {
}

export function isFuntion (fn: any): boolean {
  return Object.prototype.toString.call(fn) === '[object Function]';
}
