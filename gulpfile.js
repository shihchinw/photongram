/**eslint-env node */
var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var path = require('path');
var del = require('del');
var ts = require('gulp-typescript');
var vulcanize = require('gulp-vulcanize');
var crisper = require('gulp-crisper');
var uglify = require('gulp-uglify');
var runSequence = require('run-sequence');
var browserSync = require('browser-sync');
var reload = browserSync.reload;
var merge = require('merge-stream');
var ghPages = require('gulp-gh-pages');

var tsProject = ts.createProject('tsconfig.json');
var DIST = 'dist';

var dist = function (subpath) {
    return !subpath ? DIST : path.join(DIST, subpath);
};

gulp.task('vulcanize', function () {
    return gulp.src('app/elements/elements.html')
        .pipe($.vulcanize({
            stripComments: true,
            inlineCss: true,
            inlineScripts: true
        }))
        .pipe(crisper())
        .pipe(gulp.dest(dist('elements')))
        .pipe($.size({ title: 'vulcanize' }));
});

gulp.task('compress', function () {
    return gulp.src('app/scripts/**/*.js')
        .pipe(uglify())
        .pipe(gulp.dest(dist('scripts')));
});

gulp.task('ts-build', function() {
    var tsResult = tsProject.src()
        .pipe(ts(tsProject));

    return tsResult.js.pipe(gulp.dest('app/scripts/elements'));
});

// Copy all files at the root level (app)
gulp.task('copy', function () {
    var app = gulp.src([
        'app/assets/**/*',
        'app/styles/*',
        'app/index.html'
    ], {base: 'app'})
    .pipe(gulp.dest(dist()));

    // Copy over only the bower_components we need
    // These are things which cannot be vulcanized
    var bower = gulp.src([
        'app/bower_components/{webcomponentsjs,platinum-sw,sw-toolbox,promise-polyfill}/**/*',
        'app/bower_components/paper-color-picker/color-names.json'
    ], {base: 'app/bower_coponents'})
    .pipe(gulp.dest(dist('bower_components')));

    return merge(app, bower)
        .pipe($.size({ title: 'copy' }));
});

// Clean output directory
gulp.task('clean', function () {
    return del(['.tmp', dist()]);
});

// Watch files for changes & reload
gulp.task('serve', [], function () {
    browserSync({
        port: 8000,
        notify: false,
        logPrefix: 'Photongram',
        server: {
            baseDir: 'app'
        }
    });

    gulp.watch(['app/**/*.html'], reload);
});

// Build and serve the output from the dist build
gulp.task('serve:dist', ['default'], function () {
    browserSync({
        port: 8001,
        notify: false,
        logPrefix: 'Photongram',
        server: dist()
    });
});

// Build production files, the default task
gulp.task('default', ['clean'], function (cb) {
    runSequence(
        'copy', 'compress', 'vulcanize',
        cb);
});

gulp.task('deploy', function () {
    return gulp.src('./dist/**/*')
        .pipe(ghPages());
});