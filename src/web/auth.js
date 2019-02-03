const storageIsAvailable = 'localStorage' in window && 'sessionStorage' in window;
const requestTokenStorageKey = 'achievementunlocker/requestToken';
const accessTokenStorageKey = 'achievementunlocker/accessTokens';

// ストレージのデータ確認
function storageHas(key, isSession = false) {
  if(!storageIsAvailable) {
    throw new Error('ストレージが利用不可能です');
  }

  const storage = isSession ? sessionStorage : localStorage;
  return storage.getItem(key) !== null;
}

// ストレージにデータ保存
function saveString(key, value, isSession = false) {
  if(!storageIsAvailable) {
    throw new Error('ストレージが利用不可能です');
  }

  const storage = isSession ? sessionStorage : localStorage;
  storage.setItem(key, value);
}

// ストレージからデータ読み込み
function loadString(key, isSession = false) {
  if(!storageIsAvailable) {
    throw new Error('ストレージが利用不可能です');
  }

  const storage = isSession ? sessionStorage : localStorage;
  return storage.getItem(key);
}

function saveJson(key, json, isSession = false) {
  saveString(key, JSON.stringify(json), isSession);
}

function loadJson(key, isSession = false) {
  return JSON.parse(loadString(key, isSession) || '{}');
}

// 現在の認証情報を取得する
function getCurrentAuthInfo() {
  if(!storageIsAvailable) {
    return { signedIn: false };
  }

  const accessToken = loadJson(accessTokenStorageKey);
  const hasToken = !!accessToken.oauth_token;
  const hasTokenSecret = !!accessToken.oauth_token_secret;

  if(hasToken && hasTokenSecret) {
    return {
      signedIn: true,
      oauth_token: accessToken.oauth_token,
      oauth_token_secret: accessToken.oauth_token_secret
    }
  } else {
    return { signedIn: false };
  }
}

// API Gatewayと通信してトークンを得る/トークンを無効化する
async function requestTwitterAuth(url, data, token = {}) {
  return fetch(config.apigateway.token, {
    mode: 'cors',
    method: 'POST',
    headers: {
      'x-api-key': config.apigateway.apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      url,
      method: 'POST',
      data,
      token
    })
  }).then((response) => {
    if(response.ok) {
      return response.json();
    }

    if(response.status === 400) {
      throw new Error('通信データが壊れています。管理者に問い合わせてください');
    }

    if(response.status === 401 || response.status === 403) {
      throw new Error('認証エラー。管理者に問い合わせてください')
    }

    if(response.status === 500 || response.status === 502) {
      throw new Error('サーバーエラー。管理者に問い合わせてください');
    }

    throw new Error('通信に失敗しました。しばらく時間をおいてお試しください');
  });
}

async function requestTwitterToken(url, data, token = {}) {
  return requestTwitterAuth(url, data, token)
    .then((json) => {
      const tokens = json.response.split('&');
      const tokenMap = {};

      for(const token of tokens) {
        const [key, value] = token.split('=');
        tokenMap[key] = value;
      }

      return tokenMap;
    });
}

// Twitterの認証画面に移動
async function goToTwitterAuth() {
  const url = 'https://api.twitter.com/oauth/request_token';
  const data = { oauth_callback: config.twitter.oauth_callback };
  const tokenMap = await requestTwitterToken(url, data);
  saveJson(requestTokenStorageKey, tokenMap, true);
  location.href = `https://api.twitter.com/oauth/authenticate?oauth_token=${tokenMap.oauth_token}`;
}

// トークンの無効化
async function invalidateToken(access_token, access_token_secret) {
  const url = `https://api.twitter.com/1.1/oauth/invalidate_token?access_token=${access_token}&access_token_secret=${access_token_secret}`;
  const tokenMap = { key: access_token, secret: access_token_secret };

  return requestTwitterAuth(url, {}, tokenMap).finally(() => saveJson(accessTokenStorageKey, {}));
}