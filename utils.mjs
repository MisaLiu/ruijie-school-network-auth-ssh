import RSAUtils from './security.mjs';


export function getUrlHost(url) {
  const UrlHostReg = /^http:\/\/([\d.:]*)\/.*$/;
  const regResult = UrlHostReg.exec(url);
  if (!regResult || regResult.length < 2) return null;
  else return 'http://' + regResult[1] + '/';
}

export function getUrlQuery(url) {
  const UrlQueryReg = /http.*\?(.*)$/;
  const regResult = UrlQueryReg.exec(url);
  if (!regResult || regResult.length < 2) return null;
  else return regResult[1];
}

export function parseQueryString(query) {
  return query.split('&').reduce((result, line) => {
    const [ key, value ] = line.split('=');
    result[key] = decodeURIComponent(value);
    return result;
  }, {});
}

export function encryptPassword(pageInfo, password, mac) {
  RSAUtils.setMaxDigits(400);

  const keyPair = new RSAUtils.getKeyPair(pageInfo.publicKeyExponent, '', pageInfo.publicKeyModulus);
  const passwordParsed = (password + '>' + mac).split('').reverse().join('');

  return RSAUtils.encryptedString(keyPair, passwordParsed);
}