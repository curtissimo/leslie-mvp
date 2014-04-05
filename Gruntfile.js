module.exports = function (grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    nodeunit: {
      dev: [ 'tests/**/*_tests.js' ]
    },
    jslint: {
      dev: {
        src: [ 'leslie.js', 'lib/**/*.js' ],
        directives: {
          indent: 2
        }
      }
    },
    watch: {
      lint: {
        files: [ 'leslie.js', 'lib/**/*.js' ],
        tasks: [ 'jslint:dev' ]
      },
      test: {
        files: [ 'tests/**/*_test.js', 'lib/**/*.js' ],
        tasks: [ 'nodeunit:dev' ]
      }
    }
  });
  grunt.loadNpmTasks('grunt-contrib-nodeunit');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-jslint');

  grunt.registerTask('test', [ 'nodeunit:dev' ]);
  grunt.registerTask('dev', [ 'test', 'jslint:dev', 'watch' ]);
  grunt.registerTask('default', []);
};
