import Path from '../src/index';

describe( 'Path', function() {
  describe( '.override( obj, descriptor )', function() {
    it( 'should override the descriptor at the specified path', function() {
      var obj = {};
      var get = sinon.spy( function( $super ) {
        return $super();
      });
      var set = sinon.spy( function( value, $super ) {
        $super( value );
      });
      var restore = Path( 'foo.bar.baz' ).override( obj, { get, set } );
      expect( obj.foo ).to.equal( undefined );
      obj.foo = {
        bar: {
          baz: 2
        }
      };
      expect( set ).to.have.been.calledWith( 2 );
      obj.foo = {};
      expect( set ).to.have.been.calledWith( undefined );
      obj.foo = {
        bar: {
          baz: 4
        }
      };
      expect( set ).to.have.been.calledWith( 4 );
      restore();
      expect( obj.foo.bar.baz ).to.equal( 4 );
      obj.foo = {};
      expect( obj.foo.bar ).to.equal( undefined );
      expect( set ).to.have.callCount( 3 );
    });

    it( 'should return an empty object if persist is enabled', function() {
      var obj = {};
      var restore = Path( 'foo.bar.baz' ).override( obj, {
        get: () => 2,
        persist: true
      });
      expect( obj.foo.bar.baz ).to.equal( 2 );
      obj.foo = null;
      expect( obj.foo.bar.baz ).to.equal( 2 );
      restore();
      expect( obj.foo.bar.baz ).to.equal( 2 );
      obj.foo = null;
      expect( obj.foo ).to.equal( null );
    });
  });

  describe( '.watch( obj, listener )', function() {
    it( 'should change whenver the value at the specified path changes', function() {
      var obj = {};
      var listener = sinon.stub();
      var unwatch = Path( 'foo.bar.baz' ).watch( obj, listener );
      obj.foo = {
        bar: {
          baz: 2
        }
      };
      expect( listener ).to.have.been.calledWith( 2, undefined );
      obj.foo.bar = {
        baz: 2
      };
      expect( listener ).to.have.been.calledOnce;
      obj.foo.bar.baz = 3;
      expect( listener ).to.have.been.calledWith( 3, 2 );
      obj.foo = {};
      expect( listener ).to.have.been.calledWith( undefined, 3 );
      expect( listener ).to.have.callCount( 3 );
    });

    it( 'should support multiple watchers', function() {
      var obj = { foo: 2 };
      var listener1 = sinon.stub();
      var listener2 = sinon.stub();
      Path( 'foo' ).watch( obj, listener1 );
      Path( 'foo' ).watch( obj, listener2 );
      obj.foo = 3;
      expect( listener1 ).to.have.been.calledWith( 3, 2 );
      expect( listener2 ).to.have.been.calledWith( 3, 2 );
    });

    it( 'should return an unwatch function', function() {
      var obj = { foo: 2 };
      var listener = sinon.stub();
      var unwatch = Path( 'foo' ).watch( obj, listener );
      obj.foo = 3;
      unwatch();
      obj.foo = 4;
      expect( listener ).to.have.been.calledWith( 3, 2 );
      expect( listener ).to.have.been.calledOnce;
    });

    it( 'should support multiple overrides', function() {
      var obj = {};
      var value;
      Path( 'foo.bar' ).override( obj, {
        get() {
          return value;
        },
        set( val ) {
          value = val;
        }
      });
      Path( 'foo.bar' ).override( obj, {
        persist: true,
        get( $super ) {
          return $super() * $super();
        },
        set( value, $super ) {
          $super( Math.sqrt( value ) );
        }
      });
      obj.foo.bar = 9;
      expect( value ).to.equal( 3 );
    });

    it( 'setting a parent object should trigger overrides on the children', function() {
      var obj = {};
      var data = {};
      var getBar = sinon.spy( function() {
        return Path( 'foo.bar' ).get( data );
      });
      var setBar = sinon.spy( function( value ) {
        Path( 'foo.bar' ).set( data, value );
      });
      var getBaz = sinon.spy( function() {
        return Path( 'foo.baz' ).get( data );
      });
      var setBaz = sinon.spy( function( value ) {
        Path( 'foo.baz' ).set( data, value );
      });
      Path( 'foo.bar' ).override( obj, {
        get: getBar,
        set: setBar
      });
      Path( 'foo.baz' ).override( obj, {
        get: getBaz,
        set: setBaz
      });
      obj.foo = {
        bar: 2,
        baz: 3
      };
      expect( setBar ).to.have.been.calledWith( 2 );
      expect( setBaz ).to.have.been.calledWith( 3 );
      expect( setBar ).to.have.been.calledOnce;
      expect( setBaz ).to.have.been.calledOnce;
    });
  });

  describe( '.get( obj )', function() {
    it( 'should get the value at the specified path or undefined', function() {
      var obj = { foo: { bar: { baz: 2 } } };
      expect( Path( 'foo.bar.baz' ).get( obj ) ).to.equal( 2 );
      expect( Path( 'foo.qux' ).get( obj ) ).to.be.undefined;
    });

    it( 'should return undefined on non-objects', function() {
      expect( Path( 'foo.bar.baz' ).get( null ) ).to.be.undefined;
      expect( Path( 'foo.bar.baz' ).get( 2 ) ).to.be.undefined;
    });
  });

  describe( '.set( obj, value )', function() {
    it( 'should set the value at the specified path even if intermediaries are missing', function() {
      var obj = {};
      Path( 'foo.bar.baz' ).set( obj, 2 );
      expect( obj ).to.eql({
        foo: {
          bar: {
            baz: 2
          }
        }
      });
      var foo = obj.foo;
      Path( 'foo.bar.baz' ).set( obj, 3 );
      expect( foo ).to.equal( obj.foo );
      expect( foo.bar ).to.equal( obj.foo.bar );
      expect( foo.bar.baz ).to.equal( 3 );
    });
  });
});
