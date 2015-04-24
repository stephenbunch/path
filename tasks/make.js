var gulp = require( 'gulp' );

gulp.task( 'make', [ 'jshint' ], function() {
  var fs = require( 'fs' );
  var browserify = require( 'browserify' );
  var babelify = require( 'babelify' );
  var source = require( 'vinyl-source-stream' );
  var babel = require( 'gulp-babel' );
  var merge = require( 'merge-stream' );
  var pkg = require( APP_ROOT + '/package' );

  var bundle = browserify({
      entries: APP_ROOT + '/src/index.js',
      debug: true,
      standalone: pkg.name
    })
    .transform(
      babelify.configure({
        sourceRoot: APP_ROOT + '/src'
      })
    )
    .bundle()
    .pipe( source( pkg.name + '.js' ) )
    .pipe( gulp.dest( 'dist' ) );

  var lib = gulp.src( APP_ROOT + '/src/**/*.js' )
    .pipe( babel() )
    .pipe( gulp.dest( APP_ROOT + '/lib' ) );

  return merge( bundle, lib );
});
