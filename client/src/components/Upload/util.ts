export function noop () {}

export function noopEnter () {
  return Promise.resolve();
}

export function uuid () {
  const s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}

export function transformStringSizeToNumberSize () {
}

export function md5 () {
}

export function getBase64 () {
}
