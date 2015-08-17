var gulp = require('gulp'),
    load = require('gulp-load-plugins'),
    plugins = load();

gulp.task('minify', function () {
   return gulp.src('src/*.js')
      .pipe(plugins.jshint())
      .pipe(plugins.jshint.reporter('default'))
      .pipe(plugins.uglify())
      .pipe(gulp.dest('dist'));
});

gulp.task('default', ['minify']);



