var gulp = require( 'gulp' );
var karma = require( 'gulp-karma' )({ configFile: 'karma.conf.js' });

gulp.task( 'watch', [ 'make' ], function()  {
  karma.start().then( karma.run );
  gulp.watch([ 'src/**/*', 'test/**/*' ], [ 'make', karma.run ]);
});
