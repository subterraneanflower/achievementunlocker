function wrapText(context, text, option) {
  const maxWidth = option.maxWidth || Number.MAX_VALUE;
  const fontFamily = option.fontFamily || 'sans-serif';
  const fontSizePixel = option.fontSizePixel || 12;
  const maxLines = option.maxLines || 1000;

  const lines = [];
  const chars = Array.from(text.replace(/\r\n|\r(?!\n)/g, '\n'));

  const fontFamilyStr = /\s/.test(fontFamily) ? `"${fontFamily}"` : fontFamily;
  context.font = `${fontSizePixel}px ${fontFamilyStr}, sans-serif`;

  let currentLine = '';
  let lineCount = 0;
  while(chars.length > 0 && lineCount < maxLines) {
    const currentChar = chars.shift();

    if(currentChar === '\n') {
      lines.push(currentLine);
      currentLine = '';
      lineCount++;
      continue;
    }

    const measure = context.measureText(currentLine + currentChar);

    if(maxWidth && measure.width > maxWidth) {
      lines.push(currentLine);
      currentLine = '';
      lineCount++;
    }

    currentLine += currentChar;
  }

  if(currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

function fillMultilineText(context, lines, x, y, option) {
  const fontFamily = option.fontFamily || 'sans-serif';
  const lineHeight = option.lineHeight || 1;
  const fontSizePixel = option.fontSizePixel || 12;

  const fontFamilyStr = /\s/.test(fontFamily) ? `"${fontFamily}"` : fontFamily;
  context.font = `${fontSizePixel}px ${fontFamilyStr}, sans-serif`;

  const height = fontSizePixel * lineHeight;
  for(let i = 0; i < lines.length; i++) {
    const line = lines[i];
    context.fillText(line, x, y + height * i);
  }
}

export class NineSlice {
  constructor(image, slicePadding, createCanvasFunc = null) {
    this._image = image;
    this._slicePadding = typeof slicePadding === 'object' ? slicePadding : { top: slicePadding, bottom: slicePadding, left: slicePadding, right: slicePadding};

    this._createCanvas = createCanvasFunc || ((width, height) => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      return canvas;
    });

    this.x = 0;
    this.y = 0;
    this.width = image.width;
    this.height = image.height;
  }

  render(context) {
    const bufferCanvas = this._createCanvas(this.width, this.height);
    const bufferContext = bufferCanvas.getContext('2d');

    const source = {
      width: this._image.width,
      height: this._image.height,

      topLeft: {
        x: this._slicePadding.left,
        y: this._slicePadding.top
      },

      topRight: {
        x: this._image.width - this._slicePadding.right,
        y: this._slicePadding.top
      },

      bottomLeft: {
        x: this._slicePadding.left,
        y: this._image.height - this._slicePadding.bottom
      },

      bottomRight: {
        x: this._image.width - this._slicePadding.right,
        y: this._image.height - this._slicePadding.bottom
      },

      centerRect: {
        x: this._slicePadding.left,
        y: this._slicePadding.top,
        width: this._image.width - this._slicePadding.left - this._slicePadding.right,
        height: this._image.height - this._slicePadding.top - this._slicePadding.bottom,
      }
    };

    const buffer = {
      width: this.width,
      height: this.height,

      topLeft: {
        x: source.topLeft.x,
        y: source.topLeft.y
      },

      topRight: {
        x: this.width - this._slicePadding.right,
        y: source.topRight.y
      },

      bottomLeft: {
        x: source.bottomLeft.x,
        y: this.height - this._slicePadding.bottom
      },

      bottomRight: {
        x: this.width - this._slicePadding.right,
        y: this.height - this._slicePadding.bottom
      },

      centerRect: {
        x: source.topLeft.x,
        y: source.topLeft.y,
        width: this.width - this._slicePadding.left - this._slicePadding.right,
        height: this.height - this._slicePadding.top - this._slicePadding.bottom,
      }
    };

    // 左上
    bufferContext.drawImage(
        this._image,
        0, 0, source.topLeft.x, source.topLeft.y,
        this.x, this.y, source.topLeft.x, source.topLeft.y
    );

    // 左
    bufferContext.drawImage(
        this._image,
        0, source.topLeft.y, source.topLeft.x, source.centerRect.height,
        this.x, buffer.topLeft.y, source.topLeft.x, buffer.centerRect.height
    );

    // 左下
    bufferContext.drawImage(
        this._image,
        0, source.bottomLeft.y, source.bottomLeft.x, this._slicePadding.bottom,
        this.x, buffer.bottomLeft.y, source.bottomLeft.x, this._slicePadding.bottom
    );

    // 下
    bufferContext.drawImage(
        this._image,
        source.bottomLeft.x, source.bottomLeft.y, source.centerRect.width, this._slicePadding.bottom,
        buffer.bottomLeft.x, buffer.bottomLeft.y, buffer.centerRect.width, this._slicePadding.bottom
    );

    // 右下
    bufferContext.drawImage(
        this._image,
        source.bottomRight.x, source.bottomRight.y, this._slicePadding.right, this._slicePadding.bottom,
        buffer.bottomRight.x, buffer.bottomRight.y, this._slicePadding.right, this._slicePadding.bottom
    );

    // 右
    bufferContext.drawImage(
        this._image,
        source.topRight.x, source.topRight.y, this._slicePadding.right, source.centerRect.height,
        buffer.topRight.x, buffer.topRight.y, buffer.centerRect.width, buffer.centerRect.height
    );

    // 右上
    bufferContext.drawImage(
        this._image,
        source.topRight.x, 0, this._slicePadding.right, this._slicePadding.top,
        buffer.topRight.x, this.y, this._slicePadding.right, this._slicePadding.top
    );

    // 上
    bufferContext.drawImage(
        this._image,
        source.centerRect.x, source.centerRect.y, source.centerRect.width, source.centerRect.y,
        buffer.centerRect.x, this.y, buffer.centerRect.width, this._slicePadding.top
    );

    // 中央
    bufferContext.drawImage(
        this._image,
        source.centerRect.x, source.centerRect.y, source.centerRect.width, source.centerRect.height,
        buffer.centerRect.x, buffer.centerRect.y, buffer.centerRect.width, buffer.centerRect.height
    );

    context.drawImage(
        bufferCanvas,
        0, 0, this.width, this.height,
        this.x, this.y, this.width, this.height
    );
  }
}

export class AchievementWindow {
  constructor(width, height, option) {
    this.width = width;
    this.height = height;

    this._title = 'title' in option ? option.title : '実績のロックを解除しました！';
    this._content = 'content' in option ? option.content : '';
    this._iconImage = option.iconImage || new Image();
    this._maskNineSlice = option.maskNineSlice;
    this._backgroundColor = 'backgroundColor' in option ? option.backgroundColor : 'rgb(40, 40, 40)';
    this._titleTextColor = 'titleTextColor' in option ? option.titleTextColor : 'rgb(240, 240, 250)';
    this._contentTextColor = 'contentTextColor' in option ? option.contentTextColor : 'rgb(200, 200, 200)';
    this._fontFamily = option.fontFamily || 'sans-serif';

    this._padding = 30;
    this._marginBetweenIconAndBody = 15;
    this._marginBetweenTitleAndContent = 30;
    this._lineHeight = 1.3;
    this._fontSizePixel = 28;
    this._titleMaxLines = 2;
    this._contentMaxLines = 7;
  }

  _calcIconSize() {
    const maxIconSize = this.height - (this._padding * 2);
    return Math.min(this.width * 0.15, maxIconSize);
  }

  _calcBodyWidth(iconSize) {
    return this.width - (this._padding * 2) - iconSize - this._marginBetweenIconAndBody;
  }

  resizeToFitVertical(context) {
    const iconSize = this._calcIconSize();
    const textMaxWidth = this._calcBodyWidth(iconSize);

    const iconHeight = Math.round(iconSize + (this._padding * 2));

    const titleLines = wrapText(context, this._title, {
      fontFamily: this._fontFamily,
      fontSizePixel: this._fontSizePixel,
      maxWidth: textMaxWidth,
      maxLines: this._titleMaxLines
    });

    const contentLines = wrapText(context, this._content, {
      fontFamily: this._fontFamily,
      fontSizePixel: this._fontSizePixel,
      maxWidth: textMaxWidth,
      maxLines: this._contentMaxLines
    });

    const lineCount = titleLines.length + contentLines.length;
    const textAreaHeight = lineCount * this._lineHeight * this._fontSizePixel;

    const bodyHeight = Math.round(textAreaHeight + (this._padding * 2) + this._marginBetweenTitleAndContent);

    this.height = Math.max(iconHeight, bodyHeight);
  }

  render(context) {
    context.globalCompositeOperation = 'source-over';

    // 背景の描画
    context.fillStyle = this._backgroundColor;
    context.fillRect(0, 0, this.width, this.height);

    // アイコンの描画
    const iconSize = this._calcIconSize();
    context.drawImage(this._iconImage, this._padding, this._padding, iconSize, iconSize);

    // テキストの描画
    const textX = this._padding + iconSize + this._marginBetweenIconAndBody;
    const textMaxWidth = this._calcBodyWidth(iconSize);

    // タイトルテキスト
    context.fillStyle = this._titleTextColor;
    context.textBaseline = 'top';

    const titleLines = wrapText(context, this._title, {
      fontFamily: this._fontFamily,
      fontSizePixel: this._fontSizePixel,
      maxWidth: textMaxWidth,
      maxLines: this._titleMaxLines
    });

    fillMultilineText(context, titleLines, textX, this._padding, {
      fontFamily: this._fontFamily,
      fontSizePixel: this._fontSizePixel,
      lineHeight: this._lineHeight
    });

    const titleHeight = titleLines.length * this._fontSizePixel * this._lineHeight;

    // コンテンツテキスト
    context.fillStyle = this._contentTextColor;
    context.textBaseline = 'top';

    const contentLines = wrapText(context, this._content, {
      fontFamily: this._fontFamily,
      fontSizePixel: this._fontSizePixel,
      maxWidth: textMaxWidth,
      maxLines: this._contentMaxLines
    });

    fillMultilineText(context, contentLines, textX, this._padding + titleHeight + this._marginBetweenTitleAndContent, {
      fontFamily: this._fontFamily,
      fontSizePixel: this._fontSizePixel,
      lineHeight: this._lineHeight
    });

    // マスクをかける
    if(this._maskNineSlice) {
      context.globalCompositeOperation = 'destination-in';
      context.fillStyle = 'black';
      this._maskNineSlice.width = this.width;
      this._maskNineSlice.height = this.height;
      this._maskNineSlice.render(context);
    }
  }
}