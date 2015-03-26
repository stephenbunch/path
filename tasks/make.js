var gulp = require( 'gulp' );
var concat = require( 'gulp-concat' );
var filter = require( 'gulp-filter' );
var uglify = require( 'gulp-uglify' );
var sourcemaps = require( 'gulp-sourcemaps' );
var rename = require( 'gulp-rename' );
var order = require( 'gulp-order' );
var pkg = require( '../package' );

gulp.task( 'make', [ 'jshint' ], function() {
  return gulp.src( 'src/**/*' )
    .pipe(
      order([
        '_head.js',
        '!_tail.js',
        "_tail.js"
      ])
    )
    .pipe( sourcemaps.init() )
    .pipe( concat( pkg.name + '.js' ) )
    .pipe(
      sourcemaps.write( '.', {
        includeContent: false,
        sourceRoot: '../src'
      })
    )
    .pipe( gulp.dest( 'dist' ) )
    .pipe( filter( pkg.name + '.js' ) )
    .pipe( uglify() )
    .pipe( rename( pkg.name + '.min.js' ) )
    .pipe( gulp.dest( 'dist' ) );
});
