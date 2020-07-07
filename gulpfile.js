const gulp = require('gulp');

const { src, dest, series, watch, parallel } = gulp;

const plumber = require('gulp-plumber');
const sourcemap = require('gulp-sourcemaps');
const sass = require('gulp-sass');
const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const csso = require('gulp-csso');
const rename = require('gulp-rename');
const webp = require('gulp-webp');
const browserSync = require('browser-sync').create();
const del = require('del');
const webpack = require('webpack-stream');
const pug = require('gulp-pug');
const pugLinter = require('gulp-pug-linter');
const data = require('gulp-data');
const beautify = require('gulp-jsbeautifier');
const fs = require('fs');
const svgstore = require('gulp-svgstore');
const validator = require('gulp-html');

const nuHtmlChecker = () => {
  return gulp.src('build/*.html').pipe(validator());
};

const sprite = () =>
  src('src/img/sprite/*.svg')
    .pipe(svgstore({ inlineSvg: true }))
    .pipe(rename('sprite.svg'))
    .pipe(dest('build/img'));

const buildHtml = () =>
  src('src/pug/pages/*.pug')
    .pipe(plumber())
    .pipe(pugLinter({ reporter: 'default' }))
    .pipe(data(() => JSON.parse(fs.readFileSync('data.json'))))
    .pipe(pug())
    .pipe(
      beautify({
        indent_char: '\t',
        indent_size: 1,
      })
    )
    .pipe(dest('build/'));

const styles = () =>
  src('src/sass/style.scss')
    .pipe(plumber())
    .pipe(sourcemap.init())
    .pipe(sass())
    .pipe(postcss([autoprefixer()]))
    .pipe(csso())
    .pipe(rename('style.min.css'))
    .pipe(sourcemap.write('.'))
    .pipe(dest('build/css'))
    .pipe(browserSync.stream());

const scripts = () =>
  src('src/js/main.js')
    .pipe(plumber())
    .pipe(
      webpack({
        mode: 'production',
        output: {
          filename: 'main.js',
        },
        module: {
          rules: [
            {
              test: /\.js$/,
              exclude: /node_modules/,
              use: {
                loader: 'babel-loader',
                options: {
                  presets: ['@babel/preset-env'],
                },
              },
            },
          ],
        },
      })
    )
    .pipe(dest('build/js/'))
    .pipe(browserSync.stream());

const createWebp = () =>
  src('source/img/content/**/*.{png,jpg}')
    .pipe(webp({ quality: 90 }))
    .pipe(dest('build/img/content'));

const copyAssets = () =>
  src(['src/img/**', 'src/fonts/**/*.{woff,woff2}', 'src//*.ico'], {
    base: 'src',
  }).pipe(dest('build'));

const clean = () => del('build');

const reload = (done) => {
  browserSync.reload();
  done();
};

const browserSyncServer = () => {
  browserSync.init({
    server: 'build/',
    notify: false,
    open: true,
    cors: true,
    ui: false,
  });

  watch('src/sass/**/*.{scss,sass}', styles);
  watch('src/pug/**/*.pug', series(buildHtml, reload));
  watch('src/img/sprite/*.svg', series(sprite, reload));
  watch('src/js/**', scripts);
};

const build = series(
  clean,
  parallel(copyAssets, sprite, styles, scripts, buildHtml)
);
const start = series(build, browserSyncServer);

exports.createWebp = createWebp;
exports.build = build;
exports.start = start;
exports.nuHtmlChecker = nuHtmlChecker;
exports.createWebp = createWebp;
