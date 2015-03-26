var gulp = require( 'gulp' );
var karma = require( 'gulp-karma' )({ configFile: 'karma.conf.js' });
var sequence = require( 'run-sequence' );
var through2 = require( 'through2' );
var Mocha = require( 'mocha' );
var chai = require( 'chai' );
var pkg = require( '../package' );

var sinonChai = require( 'sinon-chai' );
chai.use( sinonChai );

gulp.task( 'test:node', function() {
  var mocha = new Mocha({ bail: true });
  global.path = require( '../index' );
  global.expect = chai.expect;
  global.sinon = require( 'sinon' );

  return gulp.src( 'test/**/*.spec.js' ).pipe(
    through2.obj( function( file, enc, cb ) {
      mocha.addFile( file.path );
      cb( null, file );
    }, function( cb ) {
      mocha.run( function( failures ) {
        if ( failures > 0 ) {
          var err = new Error( 'Test suite failed with ' + failures + ' failures.' );
          err.failures = failures;
          cb( err );
        } else {
          delete global.path;
          delete global.expect;
          delete global.sinon;
          cb( null );
        }
      });
    })
  );
});

gulp.task( 'test:browser', function() {
  return karma.once({
    browsers: [ 'PhantomJS' ]
  });
});

gulp.task( 'test', function( done ) {
  sequence([ 'test:browser', 'test:node' ], done );
});
