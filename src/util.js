function forEach( array, callback ) {
  var i = 0, len = array.length;
  for ( ; i < len; i++ ) {
    if ( callback.call( array, array[ i ], i ) === false ) {
      break;
    }
  }
}

function extend( target, source ) {
  source = source || {};
  for ( var p in source ) {
    if ( source.hasOwnProperty( p ) ) {
      target[ p ] = source[ p ];
    }
  }
  return target;
}

function bind( func, context ) {
  var args = Array.prototype.slice.call( arguments, 2 );
  return function() {
    return func.apply( context, args.concat( Array.prototype.slice.call( arguments ) ) );
  };
}
