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
