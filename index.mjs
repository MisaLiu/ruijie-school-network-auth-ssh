import ENV from './config.mjs';
import * as ssh from './ssh.mjs';
import * as Utils from './utils.mjs';

const printLog = text => console.log('[i]', text);

(async () => {
  await ssh.connect({
    host: ENV.SSH_HOST,
    port: ENV.SSH_PORT,
    username: ENV.SSH_USERNAME,
    password: ENV.SSH_PASSWORD
  });

  printLog('Getting auth url...');
  const authUrl = await getAuthUrl(ENV.AUTH_ENTRY_URL);
  const authUrlHost = Utils.getUrlHost(authUrl);
  const authUrlQuery = Utils.getUrlQuery(authUrl);

  printLog('Getting page info...');
  const pageInfo = await getPageInfo(authUrlHost, authUrlQuery);

  printLog('Getting services...');
  const serviceList = await getServices(authUrlHost, authUrlQuery, ENV.AUTH_USERNAME);

  const serviceIndex = serviceList.indexOf(ENV.AUTH_SERVICE);
  if (serviceIndex < 0) {
    throw new Error('No service name: ' + ENV.AUTH_SERVICE + ' found!');
  }

  printLog('Sending login request...');
  const loginResult = await doLogin(authUrlHost, ENV.AUTH_USERNAME, ENV.AUTH_PASSWORD, authUrlQuery, pageInfo, serviceList[serviceIndex]);
  if (loginResult.result == 'success') printLog('Successfully login!');
  else printLog('Failed to login!');

  printLog('Login info:');
  console.log(loginResult);

  if (loginResult.result == 'success') {
    printLog('Getting user info...');
    const userInfo = await getUserInfo(authUrlHost, loginResult.userIndex);
    console.log(userInfo);

    if (userInfo.hasMabInfo) return;

    printLog('Registering mac address for auto login...');
    const registResult = await registAutoLoginMac(authUrlHost, loginResult, userInfo);

    if (registResult.result == 'success') printLog('Successfully registered auto login');
    else {
      printLog('Failed to register auto login, reason: ' + registResult.message);
    }
  }

  ssh.disconnect();
})();

function getAuthUrl(enrtyUrl) {
  const AuthUrlReg = /<script>top\.self\.location\.href='(.*)'<\/script>/;

  return new Promise((resolve, reject) => {
    ssh.send(enrtyUrl)
      .then(res => {
      const regResult = AuthUrlReg.exec(res.text);

        if (!res.text || res.text == '') reject(new Error('No respond from host'));
        if (!regResult || regResult.length < 2) reject(new Error('Error when found auth url'));

        resolve(regResult[1]);
      }).catch(e => reject(e));
  });
}

function createGetPromise(host, doMethod, method, query = {}, data = null) {
  return ssh.send(
    host + `eportal/${doMethod}.do?${(new URLSearchParams({ method: method, ...query})).toString()}`, {},
    'POST',
    data
  );
}

function getPageInfo(host, query) {
  return new Promise((resolve, reject) => {
    createGetPromise(host, 'InterFace', 'pageInfo', {}, { queryString: encodeURIComponent(query) })
      .then(res => {
        let result = res.text;

        try {
          result = JSON.parse(result);
        } catch (e) {
          result = res.text;
        }

        resolve(result);
      }).catch(e => reject(e));
  });
}

function getServices(host, query, username) {
  return new Promise((resolve, reject) => {
    createGetPromise(host, 'userV2', 'getServices', {}, { username: username, queryString: encodeURIComponent(query) })
      .then(res => {
        let result = res.text.split(/[\r\n]{1,2}/);
        resolve(result);
      }).catch(e => reject(e));
  });
}

function getUserInfo(host, userIndex = '') {
  return new Promise((resolve, reject) => {
    createGetPromise(host, 'InterFace', 'getOnlineUserInfo', {}, { userIndex: encodeURIComponent(userIndex) })
      .then(res => {
        let result = res.text;

        try {
          result = JSON.parse(result);
        } catch (e) {
          result = res.text;
        }

        resolve(result);
      }).catch(e => reject(e));
  });
}

function doLogin(host, _username, _password, query, pageInfo, _service = null) {
  const queryObj = Utils.parseQueryString(query);
  const queryString = encodeURIComponent(query);
  const username = encodeURIComponent(pageInfo.prefixValue + _username);
  const macString = queryObj['mac'];
  const service = _service ? encodeURIComponent(_service) : '';
  let password = _password;

  if (JSON.parse(pageInfo.passwordEncrypt)) {
    password = Utils.encryptPassword(pageInfo, password, macString);
  }
  password = encodeURIComponent(encodeURIComponent(password));

  return new Promise((resolve, reject) => {
    createGetPromise(host, 'InterFace', 'login', {}, {
      userId: username,
      password: password,
      service: service,
      operatorPwd: '',
      operatorUserId: '',
      vaildcode: '',
      passwordEncrypt: true,
      queryString: queryString
    }).then(res => {
      try {
        resolve(JSON.parse(res.text));
      } catch (e) {
        resolve(res.text);
      }
    }).catch(e => reject(e));
  });
}

function registAutoLoginMac(host, loginInfo, userInfo) {
  return new Promise((resolve, reject) => {
    createGetPromise(host, 'InterFace', 'registerMac', {}, {
      userIndex: encodeURIComponent(loginInfo.userIndex),
      mac: encodeURIComponent(userInfo.userMac)
    }).then(res => {
      let result = res.text;

      try {
        result = JSON.parse(result);
      } catch (e) {
        result = res.text;
      }

      resolve(result);
    }).catch(e => reject(e));
  });
}