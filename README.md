# 実績解除ったー

実績解除好きかい？

## Build

**AWS Lambdaと同じバージョンのLinuxイメージ上で** 作業する。
LambdaのLinuxイメージのバージョンは[ここで見れる](https://docs.aws.amazon.com/ja_jp/lambda/latest/dg/current-supported-versions.html)。

あとは例えば `amzn2-ami-hvm-2.0.20190313-x86_64-gp2` なら
Dockerで `amazonlinux:2` を引っ張ってこればいい。
EC2上でやってもいいと思う。

いろいろインストールする。

```
curl -sL https://rpm.nodesource.com/setup_12.x | bash -
yum install -y nodejs make zip gcc-c++ cairo-devel pango-devel libjpeg-turbo-devel giflib-devel
```

必要な依存モジュールをインストールする。

```
npm install
```

configファイルのサンプルを名前変更。

```
cp src/web/config.sample.js src/web/config.js
cp src/lambda_postimage/config.sample.js src/lambda_postimage/config.js
```

それぞれtokenとかいじる。

ビルドする。

```
npm run build
```

`build/web` にフロントが、 `build/lambda_postimage/lambda.zip` にzipファイルが出力される。

## Deploy

フロントは `build/web` の中身そのままアップロード。

以下のURLから `canvas-lib64-layer.zip` をダウンロードしてきて
Lambda Layerとして登録する。
https://github.com/jwerre/node-canvas-lambda

`build/lambda_postimage` のzipファイルはAWSのLambdaに放り込む。
先ほどの `canvas-lib64-layer.zip` をLayerとして選択する。
Lambdaのタイムアウトは長めに設定する（30秒とか）。

あとは適当にAPI GatewayでLambda統合プロキシ設定してCORS設定して終わり。

動作には [lambda_twitter_token](https://github.com/subterraneanflower/lambda_twitter_token) も必須です。