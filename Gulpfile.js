global.APP_ROOT = __dirname;
require( 'babel/register' );
require( 'require-directory' )( module, './tasks' );
