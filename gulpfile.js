var gulp = require('gulp');
var exec = require('child_process').exec;

var paths = {
  build: 'build/'
};

function update() {
  console.log('running: git pull');
  exec('git pull', function(a) {
    console.log('done: git pull');
    console.log('running: npm build');
    exec('npm build', function(b) {
      console.log('done: npm build');
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
  console.log('server started');
  update();
});

gulp.task('default', ['watch']);