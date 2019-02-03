const fs = require('fs');

const { createCanvas, loadImage, registerFont } = require('canvas');
registerFont('./assets/mplus-1p-regular.ttf', { family: 'M Plus' });

const Twitter = require('twitter');

const { NineSlice, AchievementWindow } = require('./achievement_window.min');
const { themeMap, iconMap } = require('./constant');

const { config } = require('./config');

// 実績解除画像の生成
function generateImageCanvas(iconImage, title, content, maskNineSlice, theme = null) {
  const option = {
    title,
    content,
    iconImage,
    maskNineSlice,
    fontFamily: 'M Plus'
  };

  if(theme) {
    option.backgroundColor = theme.backgroundColor;
    option.titleTextColor = theme.titleColor;
    option.contentTextColor = theme.contentColor;
  }

  const achievementWindow = new AchievementWindow(720, 500, option);

  const fakeCanvas = createCanvas(5, 5);
  const fakeContext = fakeCanvas.getContext('2d');
  achievementWindow.resizeToFitVertical(fakeContext);

  const canvas = createCanvas(achievementWindow.width, achievementWindow.height);
  const context = canvas.getContext('2d');
  achievementWindow.render(context);

  return canvas;
}

// Twitterにポスト
async function postTwiter(client, path, params) {
  return new Promise((resolve, reject) => {
    client.post(path, params, (error, response, httpResponse) => {
      if(error) {
        reject({ error, response: httpResponse});
        return;
      }

      resolve(response);
    });
  });
}

exports.post = async function(event, context, callback) {
  // POSTデータを受け取る
  const body = {
    title : '実績のロックを解除しました！',
    icon: 'padlock',
    theme: 'twt'
  };

  const responseHeaders = {
    "Access-Control-Allow-Origin": config.allowOrigin,
    "Access-Control-Allow-Headers": 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
    "Access-Control-Allow-Methods": 'POST,GET,OPTIONS'
  };

  try {
    Object.assign(body, JSON.parse(event.body));
  } catch(e) {
    callback(null, {
      statusCode: 400,
      headers: responseHeaders,
      body: ''
    });

    return;
  }

  // 内容が空なら400
  if(!body.content) {
    callback(null, {
      statusCode: 400,
      headers: responseHeaders,
      body: ''
    });

    return;
  }

  const maxLength = 110;
  const content = body.content.length > maxLength ? body.content.substring(0, 110) + '…' : body.content;

  // トークンがなければ401
  if(!body.token || !body.token.key || !body.token.secret) {
    callback(null, {
      statusCode: 401,
      headers: responseHeaders,
      body: ''
    });

    return;
  }

  const theme = themeMap[body.theme || 'twt'];
  const icon = iconMap[body.icon || 'padlock'];

  // テーマかアイコンが存在しなければ400
  if(!theme || !icon) {
    callback(null, {
      statusCode: 400,
      headers: responseHeaders,
      body: ''
    });

    return;
  }

  const [iconImage, mask] = await Promise.all([loadImage(icon.path), loadImage('./assets/window-mask.png')]);
  const nineSlice = new NineSlice(mask, 60, createCanvas);
  const canvas = generateImageCanvas(iconImage, '実績のロックを解除しました！', body.content, nineSlice, theme);

  const client = new Twitter({
    consumer_key: config.consumerKey,
    consumer_secret: config.consumerSecret,
    access_token_key: body.token.key,
    access_token_secret: body.token.secret
  });

  try {
    const media = await postTwiter(client, 'media/upload', { media: canvas.toBuffer() });
    const tweet = await postTwiter(client, 'statuses/update', {
      status: `実績のロックを解除しました！\n${content}\n#実績解除ったー`,
      media_ids: media.media_id_string
    });
  } catch(e) {
    callback(null, {
      statusCode: e.response.statusCode || 500,
      headers: responseHeaders,
      body: ''
    });
  }

  callback(null, {
    statusCode: 200,
    headers: responseHeaders,
    body: ''
  });
};