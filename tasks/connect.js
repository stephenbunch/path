var gulp = require( 'gulp' );

gulp.task( 'connect', [ 'make' ], function()  {
  var karma = require( 'gulp-karma' )({ configFile: 'karma.conf.js' });
  var connect = require( 'gulp-connect' );
  var pkg = require( APP_ROOT + '/package' );

  karma.start().then( karma.run );

  connect.server({
    port: 8000,
    root: [ APP_ROOT ],
    livereload: true
  });

  gulp.watch([ 'src/**/*', 'test/**/*' ], [ 'make', function() {
    karma.run();
    gulp.src( 'dist/' + pkg.name + '.js' ).pipe( connect.reload() );
  }]);
});
