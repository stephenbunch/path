return exports;
} () );

if ( typeof module !== 'undefined' && module.exports ) {
  module.exports = exports;
} else {
  if ( typeof define === 'function' && define.amd ) {
    define( function() {
      return exports;
    });
  }
  window.pathy = exports;
}

} () );
