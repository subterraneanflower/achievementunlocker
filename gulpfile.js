const path = require('path');

const {src, dest, parallel, series} = require('gulp');
const del = require('del');
const htmlmin = require('gulp-htmlmin');
const cssmin = require('gulp-cssmin');
const svgmin = require('gulp-svgmin');
const uglify = require('gulp-uglify-es').default;
const webpack = require('webpack');
const gulpWebpack = require('webpack-stream');

const SOURCE_BASE_DIR = 'src';
const BUILD_BASE_DIR = 'build';

function clean(moduleName) {
  return function clean() {
    return del([path.join(BUILD_BASE_DIR, moduleName)]);
  }
}

function copy(moduleName) {
  const moduleSourceDir = path.join(SOURCE_BASE_DIR, moduleName);
  const moduleBuildDir = path.join(BUILD_BASE_DIR, moduleName);

  return function copy() {
    return src([
        path.join(moduleSourceDir, '**/*'),
        path.join(moduleSourceDir, '**/.*'),
        `!${path.join(moduleSourceDir, 'node_modules', '{,/**}')}`,
        `!${path.join(moduleSourceDir, '**/*.html')}`,
        `!${path.join(moduleSourceDir, '**/*.css')}`,
        `!${path.join(moduleSourceDir, '**/*.svg')}`,
        `!${path.join(moduleSourceDir, '**/*.js')}`
      ],
      {base: moduleSourceDir, nodir: true}
    ).pipe(dest(moduleBuildDir));
  }
}

function minifyHtml(moduleName) {
  const moduleSourceDir = path.join(SOURCE_BASE_DIR, moduleName);
  const moduleBuildDir = path.join(BUILD_BASE_DIR, moduleName);

  const options = {
    collapseWhitespace: true, // 空白を消す
    removeComments: true, // コメントを削除する
    minifyJS: true // HTML内のJavaScriptをminifyする
  };

  return function minifyHtml() {
    return src([path.join(moduleSourceDir, '**/*.html'), `!${path.join(moduleSourceDir, 'node_modules', '{,**/*}')}`])
      .pipe(htmlmin(options))
      .pipe(dest(moduleBuildDir));
  }
}

function minifyCss(moduleName) {
  const moduleSourceDir = path.join(SOURCE_BASE_DIR, moduleName);
  const moduleBuildDir = path.join(BUILD_BASE_DIR, moduleName);

  return function minifyCss() {
    return src([path.join(moduleSourceDir, '**/*.css'), `!${path.join(moduleSourceDir, 'node_modules', '{,**/*}')}`])
      .pipe(cssmin())
      .pipe(dest(moduleBuildDir));
  }
}

function minifyJs(moduleName) {
  const moduleSourceDir = path.join(SOURCE_BASE_DIR, moduleName);
  const moduleBuildDir = path.join(BUILD_BASE_DIR, moduleName);

  return function minifyJs() {
    return src([path.join(moduleSourceDir, '**/*.js'), `!${path.join(moduleSourceDir, 'node_modules', '{,**/*}')}`])
      .pipe(uglify())
      .pipe(dest(moduleBuildDir));
  }
}

function minifySvg(moduleName) {
  const moduleSourceDir = path.join(SOURCE_BASE_DIR, moduleName);
  const moduleBuildDir = path.join(BUILD_BASE_DIR, moduleName);

  return function minifySvg() {
    return src([path.join(moduleSourceDir, '**/*.svg'), `!${path.join(moduleSourceDir, 'node_modules', '{,**/*}')}`])
      .pipe(svgmin())
      .pipe(dest(moduleBuildDir));
  }
}

function execWebpack(entry, outputDir, config) {
  return function execWebpack() {
    return src(entry)
      .pipe(gulpWebpack({config}, webpack))
      .pipe(dest(outputDir));
  }
}

function generateTask(moduleName, webpackConfig = null) {
  const libEntryPoint = path.join(__dirname, 'lib/achievement_window.js');

  const jobs = [
    copy(moduleName),
    minifyHtml(moduleName),
    minifyCss(moduleName),
    minifyJs(moduleName),
    minifySvg(moduleName),
  ];

  if(webpackConfig) {
    jobs.push(execWebpack(libEntryPoint, path.join(__dirname, BUILD_BASE_DIR), webpackConfig));
  }

  return series(
    clean(moduleName),
    parallel(...jobs)
  );
}


const weblibConfig = {
  mode: 'production',
  output: {
    filename: 'web/achievement_window.min.js',
    libraryTarget: "window"
  }
};

const lambdalibConfig  = {
  mode: 'production',
  output: {
    filename: 'lambda_postimage/achievement_window.min.js',
    libraryTarget: "commonjs"
  }
};

const buildWeb = generateTask('web', weblibConfig);
const buildLambdaPostImage = generateTask('lambda_postimage', lambdalibConfig);

exports['build:web'] = buildWeb;
exports['build:lambda_postimage'] = buildLambdaPostImage;
exports['build'] = series(buildWeb, buildLambdaPostImage);