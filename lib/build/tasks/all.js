'use strict';

module.exports = function( $, appConf, moduleConf, args ) {
  return function( mod, modulePath, appPath ) {
    return new Promise( function( resolve, reject ) {
      var path = require( 'path' );
      var vfs = require( 'vinyl-fs' );
      var fs = require( 'fs' );

      $.util.log( $.util.colors.green( '开始扫描' + mod + '模块所有文件！' ) );

      return vfs.src(path.join(modulePath, '{page,widget,static,data}', '**'))
        .pipe(vfs.dest(path.join(modulePath, 'dist', '_')))
        .on('finish', function() {
          resolve();
        });
    });
  }
}
