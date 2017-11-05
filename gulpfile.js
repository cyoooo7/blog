var gulp = require('gulp');
var exec = require('child_process').exec;

var paths = {
  build: 'build/'
};

function update() {
  console.log('git pull >>>');
  exec('git pull', function(a) {
    console.log('git pull >>> ' + a);
    console.log('wintersmith build >>> ');
    exec('npm build', function(b) {
      console.log('wintersmith build >>> ' + b);
      console.log('>>> updated.');
      setTimeout(function() {
        update();
      }, 1 * 60 * 1000);
    });
  });
}

gulp.task('watch', function() {
  exec('npm run serve', {
    cwd: paths.build
  });
  console.log('static');
  update();
});

gulp.task('default', ['watch']);