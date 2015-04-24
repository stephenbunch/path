var gulp = require( 'gulp' );

gulp.task( 'clean', function( done ) {
  require( 'del' )( [ 'dist', 'lib' ], done );
});
