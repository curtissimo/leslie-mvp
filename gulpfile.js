var docco, gulp;

docco = require('gulp-docco');
gulp = require('gulp');

gulp.task('default', function () {

});

gulp.task('docs', function () {
  gulp.src('./leslie.js')
    .pipe(docco())
    .pipe(gulp.dest('./docs/'));
});
