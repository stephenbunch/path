var gulp = require( 'gulp' );
var jshint = require( 'gulp-jshint' );
var stylish = require( 'jshint-stylish' );

gulp.task( 'jshint', function() {
  return gulp.src([ 'src/**/*.js', '!src/_*', 'test/**/*.js' ])
    .pipe(
      jshint({
        debug: true,
        expr: true,
        boss: true
      })
    )
    .pipe( jshint.reporter( stylish ) )
    .pipe( jshint.reporter( 'fail' ) );
});
