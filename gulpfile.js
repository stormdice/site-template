const gulp = require('gulp');

const {
  src, dest, series, watch,
} = gulp;

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

const sprite = () => src('src/img/sprite/*.svg')
  .pipe(svgstore({ inlineSvg: true }))
  .pipe(rename('sprite.svg'))
  .pipe(dest('build/img'));

const buildHtml = () => src('src/pug/pages/*.pug')
  .pipe(plumber())
  .pipe(pugLinter({ reporter: 'default' }))
  .pipe(data(() => JSON.parse(fs.readFileSync('data.json'))))
  .pipe(pug())
  .pipe(beautify({
    indent_char: '\t',
    indent_size: 1,
  }))
  .pipe(dest('build/'));

const styles = () => src('src/sass/style.scss')
  .pipe(plumber())
  .pipe(sourcemap.init())
  .pipe(sass())
  .pipe(postcss([autoprefixer()]))
  .pipe(csso())
  .pipe(rename('style.min.css'))
  .pipe(sourcemap.write('.'))
  .pipe(dest('build/css'))
  .pipe(browserSync.stream());

const scripts = () => src('src/js/*.js')
  .pipe(webpack({
    mode: 'development',
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
  }))
  .pipe(dest('build/js/'));

const createWebp = () => src('source/img/content/**/*.{png,jpg}')
  .pipe(webp({ quality: 90 }))
  .pipe(dest('build/img/content'));

const copyAssets = () => src(['src/img/**', 'src/fonts/**/*.{woff,woff2}', 'src//*.ico'], { base: 'src' })
  .pipe(dest('build'));

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

  watch('src/sass/**/*.{scss,sass}', series(styles));
  watch('src/pug/**/*.pug', series(buildHtml, reload));
  watch('src/img/sprite/*.svg', series(sprite, reload));
  watch('src/js/**', series(scripts, reload));
};

const build = series(clean, copyAssets, sprite, styles, scripts, buildHtml);
const start = series(build, browserSyncServer);

exports.createWebp = createWebp;
exports.build = build;
exports.start = start;
