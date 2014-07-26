var docco, gulp, jslint, nodeunit;

docco = require('gulp-docco');
gulp = require('gulp');
jslint = require('gulp-jslint');
nodeunit = require('gulp-nodeunit');

gulp.task('docs', function () {
  'use strict';
  return gulp
    .src('./leslie.js')
    .pipe(docco())
    .pipe(gulp.dest('./docs/'));
});

gulp.task('test', function () {
  'use strict';
  return gulp
    .src('./tests/*.js')
    .pipe(nodeunit());
});

gulp.task('lint', function () {
  'use strict';
  return gulp
    .src(['./leslie.js', './gulpfile.js'])
    .pipe(jslint({ indent: 2, node: true }));
});

gulp.task('watch', function () {
  'use strict';
  gulp.watch('./leslie.js', [ 'test', 'lint' ]);
  gulp.watch('./gulpfile.js', [ 'lint' ]);
});

gulp.task('dev', [ 'test', 'lint', 'watch' ]);
gulp.task('ci', [ 'test', 'lint' ]);
