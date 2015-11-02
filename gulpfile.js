'use strict';

var appName = 'IonicGulpFile';

var gulp = require('gulp');
var plugins = require('gulp-load-plugins')();
var del = require('del');
var path = require('path');
var streamqueue = require('streamqueue');
var runSequence = require('run-sequence');

/**
 * Parse arguments
 */
var args = require('yargs')
    .alias('b', 'build')
    .default('build', false)
    .argv;

var build = !!(args.build);
var targetDir = path.resolve(build ? 'www' : 'dev');

// global error handler
var errorHandler = function(error) {
    if (build) {
        throw error;
    } else {
        plugins.util.log(error);
    }
};


// clean target dir
gulp.task('clean', function(done) {
    del([targetDir], done);
});

// precompile .scss and concat with ionic.css
gulp.task('styles', function() {
//    var options = build ? { style: 'compressed' } : { style: 'expanded' };
//
//    var sassStream = gulp.src('app/styles/main.scss')
//        .pipe(plugins.sass(options))
//        .on('error', function(err) {
//            console.log('err: ', err);
//        });
//
//    // build ionic css dynamically to support custom themes
//    var ionicStream = gulp.src('app/styles/ionic-styles.scss')
//        .pipe(plugins.cached('ionic-styles'))
//        .pipe(plugins.sass(options))
//        // cache and remember ionic .scss in order to cut down re-compile time
//        .pipe(plugins.remember('ionic-styles'))
//        .on('error', function(err) {
//            console.log('err: ', err);
//        });

    return gulp
        .src('**/*.css', {cwd: 'app/css'})
        .pipe(plugins.if(build, plugins.concat('styles.css')))
        .pipe(plugins.if(build, plugins.minifyCss()))
        .pipe(plugins.if(build, plugins.rev()))
        .pipe(gulp.dest(path.join(targetDir, 'css')))
        .on('error', errorHandler);
});


// build templatecache, copy scripts.
// if build: concat, minsafe, uglify and versionize
gulp.task('scripts', function() {
    var dest = path.join(targetDir, 'js');

    var templateConfig = {
        removeComments: true,
        collapseWhitespace: true,
        conservativeCollapse: false,
        collapseBooleanAttributes: false,
        removeEmptyAttributes: false
    };

    // prepare angular template cache from html templates
    // (remember to change appName var to desired module name)
    var templateStream = gulp
        .src('**/*.html', { cwd: 'app/templates'})
        .pipe(plugins.angularTemplatecache('templates.js', {
            root: 'templates/',
            module: appName,
            htmlmin: build && templateConfig
        }));

    var scriptStream = gulp
        .src(['templates.js', 'app.js', '**/*.js'], { cwd: 'app/js' })

        .pipe(plugins.if(!build, plugins.changed(dest)));

    return streamqueue({ objectMode: true }, scriptStream, templateStream)
        .pipe(plugins.if(build, plugins.ngAnnotate()))
        .pipe(plugins.if(build, plugins.concat('app.js')))
        .pipe(plugins.if(build, plugins.uglify()))
        .pipe(plugins.if(build, plugins.rev()))

        .pipe(gulp.dest(dest))

        .on('error', errorHandler);
});

// copy fonts
gulp.task('fonts', function() {
    return gulp
        .src(['app/fonts/*.*'])

        .pipe(gulp.dest(path.join(targetDir, 'fonts')))

        .on('error', errorHandler);
});


// copy templates
gulp.task('templates', function() {
    return gulp.src('app/templates/**/*.*')
        .pipe(gulp.dest(path.join(targetDir, 'templates')))

        .on('error', errorHandler);
});

// copy images
gulp.task('images', function() {
    return gulp.src('app/images/**/*.*')
        .pipe(gulp.dest(path.join(targetDir, 'images')))

        .on('error', errorHandler);
});

// concatenate and minify vendor sources
gulp.task('vendorJs', function() {
    var vendorFiles = [
        'app/lib/ionic/js/ionic.js'
    ];

    return gulp.src(vendorFiles)
        .pipe(plugins.concat('vendor.js'))
        .pipe(plugins.if(build, plugins.uglify()))
        .pipe(plugins.if(build, plugins.rev()))

        .pipe(gulp.dest(path.join(targetDir, 'js')))

        .on('error', errorHandler);
});

gulp.task('vendorCss', function() {
    var vendorFiles = [
        'app/lib/ionic/css/ionic.css'
    ];

    return gulp.src(vendorFiles)
        .pipe(plugins.concat('vendor.css'))
        .pipe(plugins.if(build, plugins.minifyCss()))
        .pipe(plugins.if(build, plugins.rev()))

        .pipe(gulp.dest(path.join(targetDir, 'css')))

        .on('error', errorHandler);
});

gulp.task('vendor', ['vendorJs', 'vendorCss']);

// inject the files in index.html
gulp.task('index', ['scripts'], function() {

    // injects 'src' into index.html at position 'tag'
    var _inject = function(src, tag) {
        return plugins.inject(src, {
            starttag: '<!-- inject:' + tag + ':{{ext}} -->',
            read: false,
            addRootSlash: false
        });
    };

    // get all our javascript sources
    // in development mode, it's better to add each file seperately.
    // it makes debugging easier.
    var _getAllScriptSources = function() {
        var scriptStream = gulp.src(['js/app.js', 'js/**/*.js'], { cwd: targetDir });
        return streamqueue({ objectMode: true }, scriptStream);
    };

    var _getAllStyleSources = function() {
        var scriptStream = gulp.src(['css/**/*.css'], { cwd: targetDir });
        return streamqueue({ objectMode: true }, scriptStream);
    };

    return gulp.src('app/index.html')
        // inject css
        .pipe(plugins.if(build,
            _inject(gulp.src('css/styles*.css', { cwd: targetDir }), 'app-styles'),
            _inject(_getAllStyleSources(), 'app')
        ))
        // inject vendor.css
        .pipe(_inject(gulp.src('css/vendor*.css', { cwd: targetDir }), 'vendor-styles'))
        // inject vendor.js
        .pipe(_inject(gulp.src('js/vendor*.js', { cwd: targetDir }), 'vendor'))
        // inject app.js (build) or all js files indivually (dev)
        .pipe(plugins.if(build,
            _inject(gulp.src('js/app*.js', { cwd: targetDir }), 'app'),
            _inject(_getAllScriptSources(), 'app')
        ))

        .pipe(gulp.dest(targetDir))
        .on('error', errorHandler);
});

// start watchers
gulp.task('watchers', function() {
    gulp.watch('app/styles/**/*.scss', ['styles']);
    gulp.watch('app/fonts/**', ['fonts']);
    gulp.watch('app/images/**', ['images']);
    gulp.watch('app/scripts/**/*.js', ['index']);
    gulp.watch('app/templates/**/*.html', ['index']);
    gulp.watch('app/index.html', ['index']);
    gulp.watch(targetDir + '/**')
        .on('error', errorHandler);
});

// no-op = empty function
gulp.task('noop', function() {});

// our main sequence, with some conditional jobs depending on params
gulp.task('default', function(done) {
    runSequence(
        //'clean',
        [
            'fonts',
            'templates',
            'styles',
            'images',
            'vendor'
        ],
        'index',
        build ? 'noop' : 'watchers',
        done);
});
