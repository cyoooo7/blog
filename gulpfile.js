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
    exec('wintersmith build', function(b) {
      console.log('wintersmith build >>> ' + b);
      console.log('>>> updated.');
      setTimeout(function() {
        update();
      }, 1 * 60 * 1000);
    });
  });
}

gulp.task('watch', function() {
  exec('static-server -p 80', {
    cwd: paths.build
  });
  update();
});

gulp.task('default', ['watch']);