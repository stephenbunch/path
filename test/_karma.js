window.expect = chai.expect;

Function.prototype.bind = function() {
  var args = Array.prototype.slice.call( arguments );
  var func = this;
  return function() {
    return func.apply( args[0], args.slice(1).concat(
      Array.prototype.slice.call( arguments )
    ) );
  };
};
