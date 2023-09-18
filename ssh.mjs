import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();

export function connect(config) {
  return ssh.connect(config);
}

export function disconnect() {
  return ssh.dispose();
}

export function send(url, headers = {}, type = 'GET', data = null) {
  return new Promise((res, rej) => {
    if (!ssh.isConnected()) rej(new Error('Not connected to server yet'));

    let command = `curl -i ${url}`;

    for (const name in headers) {
      command += ` -H "${name}: ${headers[name]}"`;
    }

    command += ` -X ${type}`;

    if (type === 'POST' && data) {
      command += ` -d '${(new URLSearchParams(data)).toString()}'`;
    }

    ssh.execCommand(command)
      .then(result => res(decodeRawRespond(result.stdout)))
      .catch(e => rej(e));
  });
}



function decodeRawRespond(raw) {
  const HttpCodeReg = /^HTTP\/[\d\.]{1,3}\s(\d{3})\s.+$/;

  const rawText = raw.toString('utf8').replaceAll(/[\r\n]{1,2}/gm, '\n');
  const [ resHeader, ...resBodyArr ] = rawText.split(/^\s*$[\r\n]{1,2}/gm);
  const resHeadersArr = resHeader.split('\n').filter(header => !(/^\s*$/.test(header)));
  const resCode = resHeadersArr.splice(0, 1)[0];
  const resHeaders = resHeadersArr.reduce((result, header) => {
    const [ key, ...values ] = header.split(/:\s?/);
    const value = values.join(':').trim();
    result[key] = value;
    return result;
  }, {});
  const resBody = resBodyArr.join('\n');
  const resCodeNum = parseInt(HttpCodeReg.exec(resCode)[1]);
  let resBodyJson = null;

  if (isNaN(resCodeNum) || (resCodeNum < 100 || resCodeNum > 999)) throw new Error('Unexpected response code: ' + resCodeNum);
  if (resHeaders['Content-Type'] && resHeaders['Content-Type'].toLowerCase().indexOf('json') >= 0) {
    try {
      resBodyJson = JSON.parse(resBody);
    } catch (e) {
      resBodyJson = null;
    }
  }

  return {
    ok: (resCodeNum >= 100 && resCodeNum <= 399),
    code: resCodeNum,
    httpCode: resCode,
    headers: resHeaders,
    text: resBody,
    body: resBodyJson,
    rawResponse: rawText
  };
}