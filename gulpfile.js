'use strict';

var gulp = require('gulp'),
    plumber = require('gulp-plumber'),
    sass = require('gulp-sass'),
    sourcemaps = require('gulp-sourcemaps'),
    autoprefixer = require('gulp-autoprefixer'),
    browserSync = require('browser-sync').create(),
    nunjucksRender = require('gulp-nunjucks-render'),
    imagemin = require('gulp-imagemin'),
    pngquant = require('imagemin-pngquant'),
    babel = require('gulp-babel'),
    browserify = require('browserify'),
    babelify = require('babelify'),
    uglifyify = require('uglifyify'),
    source = require('vinyl-source-stream'),
    buffer = require('vinyl-buffer'),
    cssImport = require('gulp-cssimport');

var srcScss     = ['./src/scss/**/*.scss', '!./src/scss/vendor.scss'],
    distCss     = './dist/css',
    srcJsApp    = './src/js/*.js',
    distJsApp   = './dist/js',
    srcNun      = './src/html/pages/**/*.nunjucks',
    srcNunPath  = [ './src/html/templates' ],
    distHtml    = './dist',
    srcImages   = './src/images/**/*',
    distImages  = './dist/images',
    srcFonts    = './src/fonts/**/*',
    distFonts   = './dist/fonts',
    srcOthers   = './src/others/**/*',
    distOthers  = './dist';
var vendors = [ 'jquery' ];

gulp.task('sass', function () {
    gulp.src(srcScss)
        .pipe(plumber())
        .pipe(sourcemaps.init())
        .pipe(sass({errLogToConsole: true,outputStyle: 'compressed'}))
        .pipe(autoprefixer({browsers: [ 'last 2 versions', '> 5%', 'Firefox ESR' ]}))
        .pipe(sourcemaps.write('./maps'))
        .pipe(gulp.dest(distCss))
        .pipe(browserSync.stream());
});

gulp.task('scripts', function() {
    return browserify({
        entries: [
            './src/js/app.js'
        ],
        extensions: ['.js'],
        debug: true
    })
    .external(vendors) // Specify all vendors as external source
    .transform(babelify.configure({
        presets: ['es2015']
    }))
    .bundle()
    .pipe(source('app.js'))
    .pipe(buffer())
    .pipe(sourcemaps.init({loadMaps: true}))
    .pipe(sourcemaps.write('./maps'))
    .pipe(gulp.dest(distJsApp))
});

gulp.task('vendors', function() {
    var b = browserify({
        debug: false
    });
    vendors.forEach(function(lib) {
        b.require(lib);
    });

    b.transform({
        global: true
    }, 'uglifyify')
    .bundle()
        .pipe(plumber())
        .pipe(source('vendor.js'))
        .pipe(buffer())
        .pipe(sourcemaps.init({loadMaps: true}))
        .pipe(sourcemaps.write('./maps'))
        .pipe(gulp.dest(distJsApp))
});

gulp.task('vendorscss', function() {
    gulp.src('./src/scss/vendor.scss')
        .pipe(plumber())
        .pipe(cssImport())
        .pipe(sass({errLogToConsole: true, outputStyle: 'compressed'}))
        .pipe(gulp.dest(distCss))
        .pipe(browserSync.stream());
});

gulp.task('nunjucks', function() {
    return gulp.src(srcNun)
        .pipe(plumber())
        .pipe(nunjucksRender({
            path: srcNunPath
        }))
        .pipe(gulp.dest(distHtml));
});

gulp.task('images', function() {
    return gulp.src(srcImages)
        .pipe(plumber())
        .pipe(imagemin({
            progressive: true,
            use: [pngquant()]
        }))
        .pipe(gulp.dest(distImages));
});

gulp.task('others', function() {
    return gulp.src(srcOthers)
        .pipe(gulp.dest(distOthers));
});

gulp.task('fonts', function() {
    return gulp.src(srcFonts)
        .pipe(gulp.dest(distFonts));
});

gulp.task('bs', function() {
    browserSync.init({
        server: {
            baseDir: "./dist/"
        },
        files: "./dist/**/*"
    });
});

gulp.task('default', ['images', 'fonts', 'sass', 'vendors', 'vendorscss', 'others', 'scripts', 'nunjucks', 'bs'], function() {
    gulp.watch('./src/scss/vendor.scss', ['vendorscss']);
    gulp.watch(srcScss, ['sass']);
    gulp.watch(srcJsApp, ['vendors', 'scripts']);
    gulp.watch(srcOthers, ['others']);
    gulp.watch(srcFonts, ['fonts']);
    gulp.watch('./src/html/**/*', ['nunjucks']);
    gulp.watch(srcImages, ['images']);
});