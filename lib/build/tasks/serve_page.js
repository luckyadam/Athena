'use strict';

module.exports = function ($, appConf, moduleConf, args) {
  return function (mod, modulePath, appPath) {
    return new Promise(function (resolve, reject) {
      var athenaMate = require('../athena_mate');
      var path = require('path');
      var vfs = require('vinyl-fs');
      var fs = require('fs');
      var autoprefixer = require('autoprefixer');
      var sprites = require('postcss-athena-spritesmith');
      var del = require('del');
      var processors = [
        autoprefixer({browsers: ['> 1%', 'last 2 versions', 'Firefox ESR', 'Opera 12.1']}),
      ];
      //是否开启雪碧图合并
      var csssprite = moduleConf.support.csssprite;

      if( csssprite && csssprite.enable !== false ){
        var opts = {
          stylesheetPath: path.join(modulePath, 'dist', '_static', 'css'),
          spritePath: path.join(modulePath, 'dist', '_static', 'images', 'sprite.png'),
          retina: csssprite.retina || false,
          rootvalue: csssprite.rootvalue,
          padding: csssprite.padding
        }
      }

      var pageFiles = args.pageFiles;
      if (args.type === 'changed') {
        var stream = vfs.src(pageFiles)
          .pipe($.flatten())
          .pipe(athenaMate.scan({
            cwd: appPath,
            module: moduleConf.module
          }));
        stream.on('finish', function () {
            stream
              .pipe($.flatten())
              .pipe(athenaMate.inject({
                cwd: appPath,
                module: moduleConf.module
              }))
              .pipe(athenaMate.replace({
                cwd: appPath,
                module: moduleConf.module,
                serve: true
              }))
              .pipe(vfs.dest(path.join(appPath, '.temp', appConf.app, moduleConf.module)))
              .on('end', function () {
                var cssFiles = [];
                pageFiles.forEach(function (item) {
                  var page = path.basename(item, path.extname(item));
                  cssFiles.push(path.join(modulePath, 'dist', '_static', 'css', page + '.css'));
                });
                athenaMate.concat({
                  cwd: appPath,
                  pageFiles: pageFiles,
                  module: moduleConf.module,
                  map: path.join('dist', 'map.json'),
                  dest: 'dist',
                  end: function () {
                    processors.push(sprites(opts));
                    vfs.src(cssFiles)
                      .pipe(athenaMate.plumber())
                      .pipe($.postcss(processors))
                      .pipe(vfs.dest(path.join(modulePath, 'dist', '_static', 'css')))
                      .on('end', function () {
                        vfs.src(path.join(modulePath, 'dist', '_static', '**'), { base: path.join(modulePath, 'dist', '_static') })
                          .pipe(athenaMate.replace({
                            cwd: appPath,
                            module: moduleConf.module,
                            serve: true
                          }))
                          .pipe(vfs.dest(path.join(appPath, '.temp', appConf.app, moduleConf.module)))
                          .on('end', function () {
                            resolve();
                          });
                      })
                      .on('error', function (err) {
                        reject(err);
                      });
                  }
                });
              });
          }).on('error', function (err) {
            $.util.log($.util.colors.red(mod + '重新serve page失败！'));
            reject(err);
          });
      } else if (args.type === 'deleted') {
        pageFiles.forEach(function (item) {
          var page = path.basename(item);
          del.sync(path.join(appPath, '.temp', appConf.app, moduleConf.module, page));
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}
