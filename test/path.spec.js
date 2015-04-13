describe( 'Path', function() {
  describe( '.watch( obj, listener )', function() {
    it( 'should call the listener whenever the value at the specified path changes', function() {
      var obj = {};
      var stub = sinon.stub();
      var unwatch = pathy( 'foo.bar.baz' ).watch( obj, stub );
      obj.foo = { bar: { baz: 2 } };
      expect( stub ).to.have.been.calledWith({ newval: 2, oldval: undefined });
      obj.foo.bar.baz = 3;
      expect( stub ).to.have.been.calledWith({ newval: 3, oldval: 2 });
      unwatch();
    });

    it( 'should return an unwatch function', function() {
      var obj = {};
      var stub = sinon.stub();
      var unwatch = pathy( 'foo' ).watch( obj, stub );
      unwatch();
      obj.foo = 2;
      expect( stub ).to.not.have.been.called;
    });

    it( 'should not call the listener even if objects change in the middle of the path', function() {
      var obj = { foo: { bar: { baz: 2 } } };
      var stub = sinon.stub();
      var unwatch = pathy( 'foo.bar.baz' ).watch( obj, stub );
      obj.foo = { bar: { baz: 2 } };
      expect( stub ).to.not.have.been.called;
      obj.foo.bar = { baz: 3 };
      expect( stub ).to.have.been.calledWith({ newval: 3, oldval: 2 });
      unwatch();
    });

    it( 'should wrap existing property descriptors', function() {
      var obj = {};
      var enabled = false;
      var value = 2;
      Object.defineProperty( obj, 'foo', {
        configurable: true,
        enumerable: true,
        get: function() {
          return value;
        },
        set: function( newval ) {
          if ( enabled ) {
            value = newval;
          }
        }
      });
      var stub = sinon.stub();
      var unwatch = pathy( 'foo' ).watch( obj, stub );
      obj.foo = 3;
      expect( stub ).to.not.have.been.called;
      enabled = true;
      obj.foo = 3;
      expect( stub ).to.have.been.calledWith({ newval: 3, oldval: 2 });
      unwatch();
    });

    it( 'should not follow non object values', function() {
      var obj = { foo: null };
      var stub = sinon.stub();
      var unwatch = pathy( 'foo.bar' ).watch( obj, stub );
      obj.foo = 2;
      expect( stub ).to.not.have.been.called;
      obj.foo = { bar: null };
      expect( stub ).to.have.been.calledWith({ newval: null, oldval: undefined });
      unwatch();
    });

    it( 'should support multiple watchers', function() {
      var obj = { foo: 2 };
      var stub1 = sinon.stub();
      var stub2 = sinon.stub();
      var unwatch1 = pathy( 'foo' ).watch( obj, stub1 );
      var unwatch2 = pathy( 'foo' ).watch( obj, stub2 );
      obj.foo = 3;
      expect( stub1 ).to.have.been.called;
      expect( stub2 ).to.have.been.called;
      unwatch1();
      unwatch2();
    });
  });

  describe( '.override( obj, descriptor )', function() {
    it( 'should return a restore function', function() {
      var obj = {};
      var value;
      var cleanup = pathy( 'foo.bar' ).override( obj, {
        get: function() {
          return value;
        },
        set: function( newval ) {
          value = newval;
        }
      });
      obj.foo = { bar: 2 };
      expect( value ).to.equal( 2 );
      obj.foo.bar = 3;
      expect( value ).to.equal( 3 );
      cleanup();
      obj.foo.bar = 4;
      expect( value ).to.equal( 3 );
    });

    it( 'should maintain the object graph if the persist option is true', function() {
      var obj = {};
      var value;
      var cleanup = pathy( 'foo.bar.baz' ).override( obj, {
        persist: true,
        get: function() {
          return value;
        },
        set: function( newval ) {
          value = newval;
        }
      });
      obj.foo.bar.baz = 2;
      expect( obj.foo.bar.baz ).to.equal( 2 );
      obj.foo = {};
      expect( obj.foo.bar.baz ).to.equal( undefined );
      cleanup();
      obj.foo.bar.baz = 3;
      expect( value ).to.be.undefined;
    });

    it( 'should run the base value through the setter anytime the property is rebuilt', function() {
      var obj = { foo: { bar: { baz: 2 } } };
      var stub = sinon.stub();
      var cleanup = pathy( 'foo.bar.baz' ).override( obj, {
        set: stub
      });
      obj.foo = 3;
      obj.foo = { bar: { baz: 2 } };
      expect( stub ).to.have.been.calledTwice;
      obj.foo = { bar: { baz: 2 } };
      expect( stub ).to.have.been.calledThrice;
      cleanup();
    });

    it( 'should not copy the property value if initialize option is false', function() {
      var obj = { foo: 2 };
      var stub = sinon.stub();
      var cleanup = pathy( 'foo' ).override( obj, {
        initialize: false,
        set: stub
      });
      expect( stub ).to.not.have.been.called;
      cleanup();
    });

    it( 'should not throw an error with read-only descriptors', function() {
      var obj = { foo: 2 };
      var stub = sinon.stub();
      var cleanup = pathy( 'foo' ).override( obj, {
        get: function() {
          stub();
          return this.$super();
        }
      });
      var x = obj.foo;
      expect( x ).to.equal( 2 );
      expect( stub ).to.have.been.called;
      cleanup();
    });
  });

  describe( '.get( obj )', function() {
    it( 'should get the value at the specified path or undefined', function() {
      var obj = { foo: { bar: { baz: 2 } } };
      expect( pathy( 'foo.bar.baz' ).get( obj ) ).to.equal( 2 );
      expect( pathy( 'foo.qux' ).get( obj ) ).to.be.undefined;
    });

    it( 'should return undefined on non-objects', function() {
      expect( pathy( 'foo.bar.baz' ).get( null ) ).to.be.undefined;
      expect( pathy( 'foo.bar.baz' ).get( 2 ) ).to.be.undefined;
    });
  });

  describe( '.set( obj, value )', function() {
    it( 'should set the value at the specified path even if intermediaries are missing', function() {
      var obj = {};
      pathy( 'foo.bar.baz' ).set( obj, 2 );
      expect( obj ).to.eql({ foo: { bar: { baz: 2 } } });
    });
  });
});
