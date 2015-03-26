window.expect = chai.expect;

Function.prototype.bind = Function.prototype.bind || function( context ) {
  var fn = this;
  var args = Array.prototype.slice.call( arguments, 2 );
  return function() {
    return fn.apply( context, Array.prototype.slice.call( arguments ).concat( args ) );
  };
};
