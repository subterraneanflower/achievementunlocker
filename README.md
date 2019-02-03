# 実績解除ったー

実績解除好きかい？

## Build

**AWS Lambdaと同じバージョンのLinuxイメージ上で** 作業する。
LambdaのLinuxイメージのバージョンは[ここで見れる](https://docs.aws.amazon.com/ja_jp/lambda/latest/dg/current-supported-versions.html)。

あとは例えば `amzn-ami-hvm-2017.03.1.20170812-x86_64-gp2` なら
Dockerで `amazonlinux:2017.03.1.20170812` を引っ張ってこればいい。
EC2上でやってもいいと思う。

いろいろインストールする。

```
curl -sL https://rpm.nodesource.com/setup_8.x | bash -
yum install -y nodejs gcc-c++ make zip
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

フロントは `build/web` の中身そのままアップロード、 `build/lambda_postimage` のzipファイルはAWSのLambdaに放り込む。
Lambdaのタイムアウトは長めに設定する（30秒とか）。
あとは適当にAPI GatewayでLambda統合プロキシ設定してCORS設定して終わり。

動作には [lambda_twitter_token](https://github.com/subterraneanflower/lambda_twitter_token) も必須です。