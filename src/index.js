import Path from './Path';

function pathFactory( ...args ) {
  var path = Object.create( Path.prototype );
  Path.prototype.constructor.apply( path, args );
  return path;
}

pathFactory.Path = Path;

export { pathFactory as default };
