var gulp = require( 'gulp' );

gulp.task( 'jshint', function() {
  var jshint = require( 'gulp-jshint' );
  var stylish = require( 'jshint-stylish' );

  return gulp.src([ 'src/**/*.js', '!src/_*', 'test/**/*.js' ])
    .pipe(
      jshint({
        debug: true,
        expr: true,
        boss: true,
        esnext: true
      })
    )
    .pipe( jshint.reporter( stylish ) )
    .pipe( jshint.reporter( 'fail' ) );
});
