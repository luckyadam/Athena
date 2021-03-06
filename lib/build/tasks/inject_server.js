'use strict';

module.exports = function ($, appConf, moduleConf, args) {
  return function (mod, modulePath, appPath) {
    return new Promise(function (resolve, reject) {
      var path = require('path');
      var vfs = require('vinyl-fs');
      var athenaMate = require('../athena_mate');

      vfs.src(path.join(modulePath, 'dist', 'output', 'tpl', '*.?(html|php|vm|ejs)'))
        .pipe($.flatten())
        .pipe(athenaMate.injectServer({
          cwd: appPath,
          module: moduleConf.module
        }))
        .pipe(vfs.dest(path.join(modulePath, 'dist', 'output', 'tpl')))
        .on('end', function () {
          resolve();
        });
    });
  }
}
