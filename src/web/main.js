const placeholders = [
  '早起き',
  '完全に理解した',
  '積みゲーを崩した',
  '足の小指をタンスの角にぶつけた',
  'バズった',
  '真面目に出社',
  '単位を落とした'
];

const themes = [
  {
    value: 'twt',
    name: '鳥っぽいテーマ',
    backgroundColor: 'rgb(29, 161, 242)',
    inputBackgroundColor: 'rgb(29, 120, 200)',
    titleColor: 'rgb(240, 240, 250)',
    contentColor: 'rgb(230, 230, 230)',
    selected: true
  },
  {
    value: 'stm',
    name: '蒸気っぽいテーマ',
    backgroundColor: 'rgb(35, 31, 32)',
    inputBackgroundColor: 'rgb(30, 30, 30)',
    titleColor: 'rgb(240, 240, 250)',
    contentColor: 'rgb(180, 180, 180)'
  },
  {
    value: 'ntd',
    name: '京都っぽいテーマ',
    backgroundColor: 'rgb(230, 0, 18)',
    inputBackgroundColor: 'rgb(180, 0, 0)',
    titleColor: 'rgb(240, 240, 250)',
    contentColor: 'rgb(230, 230, 230)'
  },
  {
    value: 'sny',
    name: '記号っぽいテーマ',
    backgroundColor: 'rgb(0, 104, 191)',
    inputBackgroundColor: 'rgb(0, 60, 150)',
    titleColor: 'rgb(240, 240, 250)',
    contentColor: 'rgb(230, 230, 230)'
  },
  {
    value: 'mcs',
    name: '箱っぽいテーマ',
    backgroundColor: 'rgb(16, 124, 16)',
    inputBackgroundColor: 'rgb(0, 60, 0)',
    titleColor: 'rgb(240, 240, 250)',
    contentColor: 'rgb(230, 230, 230)'
  }
];

const icons = [
  {
    value: 'padlock',
    name: '鍵',
    url: './img/padlock.svg',
    selected: true
  },
  {
    value: 'trophy',
    name: 'トロフィー',
    url: './img/trophy.svg'
  }
];

const userInputSessionStoreKey = 'achievementunlocker/userinput';

const canvas = document.querySelector('.preview-canvas');
const context = canvas.getContext('2d');

const userInputData = {
  title: '実績のロックを解除しました！',
  content: ''
};

const userInputSessionInfo = loadJson(userInputSessionStoreKey, true);

const dialog = document.querySelector('#dialog');
const dialogMessage = dialog.querySelector('.dialog-message');
const signinDialog = document.querySelector('#signin-dialog');

//
// functions
//

async function loadImage(url) {
  const image = new Image();

  return new Promise((resolve, reject) => {
    image.onload = (event) => {
      resolve(image);
    };

    image.src = url;
  });
}

function applyUserInputData(input) {
  if(!input.theme) { return; }
  document.body.style.setProperty('--theme-background-color', input.theme.backgroundColor);
  document.body.style.setProperty('--theme-input-background-color', input.theme.inputBackgroundColor);
  document.body.style.setProperty('--theme-title-color', input.theme.titleColor);
  document.body.style.setProperty('--theme-content-color', input.theme.contentColor);
}

function renderPreview(input) {
  const option = {
    title: input.title,
    content: input.content,
    iconImage: input.icon,
    maskNineSlice: input.nineSlice
  };

  if(input.theme) {
    option.backgroundColor = input.theme.backgroundColor;
    option.titleTextColor = input.theme.titleColor;
    option.contentTextColor = input.theme.contentColor;
  }

  const achievementWindow = new AchievementWindow(720, 500, option);

  achievementWindow.resizeToFitVertical(context);
  canvas.height = achievementWindow.height;

  context.clearRect(0, 0, canvas.width, canvas.height);
  achievementWindow.render(context);
}

//
// main
//

// リダイレクトしてもどってきたときはアクセストークンを取得する
if(location.search && storageIsAvailable) {
  const params = new URLSearchParams(location.search);
  const requestTokenSecret = loadJson(requestTokenStorageKey, true).oauth_token_secret;
  saveJson(requestTokenSecret, {}, true); // delete session data

  // 必要なパラメータがあるときだけアクセストークン取得
  if(params.has('oauth_token') && params.has('oauth_verifier')) {
    dialogMessage.innerText = 'Twitter認証確認中……';
    dialog.dataset.visible = 'true';

    const data = { oauth_token: params.get('oauth_token'), oauth_verifier: params.get('oauth_verifier') };
    const token = { key: requestTokenSecret };

    requestTwitterToken('https://api.twitter.com/oauth/access_token', data, token)
      .then((tokenMap) => {
        const accessTokens = { oauth_token: tokenMap.oauth_token, oauth_token_secret: tokenMap.oauth_token_secret };
        saveJson(accessTokenStorageKey, accessTokens);
        location.href = location.origin + location.pathname; // reload
      }).catch((e) => {
        console.error(e);
        alert(e.message);
        dialog.dataset.visible = 'false';
    });
  }
}

(async function main() {
  const auth = getCurrentAuthInfo();

  // テーマセレクタ
  const themeSelect = document.querySelector('.theme-select');

  for(const theme of themes) {
    const optElement = document.createElement('option');
    optElement.value = theme.value;
    optElement.innerText = theme.name;
    optElement.selected = theme.selected;
    if(theme.selected) { userInputData.theme = theme; }
    themeSelect.appendChild(optElement);
  }

  themeSelect.addEventListener('change', (event) => {
    const theme = themes.find((t) => t.value === themeSelect.value);
    if(!theme) { return; }

    userInputData.theme = theme;

    // セッションに保存
    const currentSessionInput = loadJson(userInputSessionStoreKey, true) || {};
    currentSessionInput.themeSelectValue = themeSelect.value;
    saveJson(userInputSessionStoreKey, currentSessionInput, true);

    // 描画
    applyUserInputData(userInputData);
    renderPreview(userInputData);
  });

  // アイコンセレクタ
  const iconImage = document.querySelector('.achievement-icon');
  const iconSelect = document.querySelector('.achievement-icon-select');

  iconImage.addEventListener('load', (event) => {
    userInputData.icon = iconImage;
    renderPreview(userInputData);
  });

  for(const icon of icons) {
    const optElement = document.createElement('option');
    optElement.value = icon.value;
    optElement.innerText = icon.name;
    optElement.selected = icon.selected;
    if(icon.selected) { iconImage.src = icon.url; }
    iconSelect.appendChild(optElement);
  }

  iconSelect.addEventListener('change', (event) => {
    const icon = icons.find((i) => i.value === iconSelect.value);
    if(!icon) { return; }

    userInputData.iconValue = iconSelect.value;

    // セッションに保存
    const currentSessionInput = loadJson(userInputSessionStoreKey, true) || {};
    currentSessionInput.iconSelectValue = iconSelect.value;
    saveJson(userInputSessionStoreKey, currentSessionInput, true);

    iconImage.src = icon.url;
  });

  // 9-slice
  const nineSliceImage = await loadImage('./img/window-mask.png');
  userInputData.nineSlice = new NineSlice(nineSliceImage, 60);

  // ユーザ入力欄
  const contentInput = document.querySelector('.achievement-content');
  contentInput.placeholder = '例: ' + placeholders[Math.floor(Math.random() * placeholders.length)];

  contentInput.addEventListener('input', (event) => {
    userInputData.content = contentInput.value;

    // セッションに保存
    const currentSessionInput = loadJson(userInputSessionStoreKey, true) || {};
    currentSessionInput.contentInputValue = contentInput.value;
    saveJson(userInputSessionStoreKey, currentSessionInput, true);

    renderPreview(userInputData);
  });

  // ボタン
  const tweetButton = document.querySelector('.tweet-button');
  const saveButton = document.querySelector('.save-button');
  const authButton = document.querySelector('.auth-button');
  const signinButton = document.querySelector('.signin-button');
  const signinCancelButton = document.querySelector('.signin-cancel-button');

  // ツイートボタン押したときは送信する
  tweetButton.addEventListener('click', (e) => {
    if(tweetButton.disabled || !auth.signedIn) {
      return; // 環境によってはdisabledでもclick発火するとか聞いたことがある
    }

    tweetButton.disabled = true;
    dialogMessage.innerText = 'Twitterに投稿中……';
    dialog.dataset.visible = 'true';

    fetch(config.apigateway.post, {
      mode: 'cors',
      method: 'POST',
      headers: {
        'x-api-key': config.apigateway.apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        icon: userInputData.iconValue,
        theme: userInputData.theme.value,
        content: userInputData.content,
        token: {
          key: auth.oauth_token,
          secret: auth.oauth_token_secret
        }
      })
    }).then((response) => {
      if(response.ok) {
        alert('投稿に成功しました！');
        saveJson(userInputSessionStoreKey, {}, true);
        location.reload();
      } else {
        throw { status: response.status };
      }
    }).catch((e) => {
      console.error(e.status);
      alert('投稿に失敗しました');
    }).finally(() => {
      tweetButton.disabled = false;
      dialog.dataset.visible = 'false';
    });
  });

  saveButton.addEventListener('click', (e) => {
    const anchor = document.createElement('a');
    anchor.href = canvas.toDataURL('image/png');
    anchor.download = 'achievement.png';
    anchor.click();
  });

  signinButton.addEventListener('click', (e) => {
    signinDialog.dataset.visible = 'false';
    dialogMessage.innerText = 'Twitterと通信中……';
    dialog.dataset.visible = 'true';
    goToTwitterAuth()
      .catch((e) => {
        dialog.dataset.visible = 'false';
        console.error(e);
        alert(e.message);
      });
  });

  signinCancelButton.addEventListener('click', (e) => {
    signinDialog.dataset.visible = 'false';
  });

  if(auth.signedIn) {
    authButton.innerText = 'Twitterからログアウト';
    authButton.addEventListener('click', (e) => {
      if(!auth.signedIn) { return; }

      dialogMessage.innerText = 'Twitterからログアウト中……';
      dialog.dataset.visible = 'true';

      invalidateToken(auth.oauth_token, auth.oauth_token_secret)
        .catch((e) => {
          dialog.dataset.visible = 'false';
          console.error(e);
          alert(e.message);
        }).finally(() => location.reload());
    });
  } else {
    tweetButton.disabled = true;

    authButton.addEventListener('click', (e) => {
      signinDialog.dataset.visible = 'true';
    });
  }

  // セッション情報読み込み
  if(userInputSessionInfo) {
    if(userInputSessionInfo.themeSelectValue) {
      themeSelect.value = userInputSessionInfo.themeSelectValue;
      themeSelect.dispatchEvent(new Event('change'));
    }

    if(userInputSessionInfo.iconSelectValue) {
      iconSelect.value = userInputSessionInfo.iconSelectValue;
      iconSelect.dispatchEvent(new Event('change'));
    }

    if(userInputSessionInfo.contentInputValue) {
      contentInput.value = userInputSessionInfo.contentInputValue;
      contentInput.dispatchEvent(new Event('input'));
    }
  }

  // 描画
  applyUserInputData(userInputData);
  renderPreview(userInputData);
})();
