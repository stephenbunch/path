var gulp = require( 'gulp' );

gulp.task( 'default', function( done ) {
  require( 'run-sequence' )( 'make', 'test', done );
});
