module.exports = function (grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    nodeunit: {
      dev: [ 'tests/**/*_tests.js', 'leslie.js' ]
    },
    jslint: {
      dev: {
        src: [ 'leslie.js' ],
        directives: {
          indent: 2
        }
      }
    },
    docco: {
      build: {
        src: 'leslie.js'
      }
    },
    watch: {
      lint: {
        files: [ 'leslie.js' ],
        tasks: [ 'jslint:dev' ]
      },
      test: {
        files: [ 'tests/**/*_tests.js', 'leslie.js' ],
        tasks: [ 'nodeunit:dev' ]
      },
      docco: {
        files: [ 'leslie.js' ],
        tasks: [ 'docco:build' ]
      }
    }
  });
  grunt.loadNpmTasks('grunt-contrib-nodeunit');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-jslint');
  grunt.loadNpmTasks('grunt-docco');

  grunt.registerTask('test', [ 'nodeunit:dev' ]);
  grunt.registerTask('dev', [ 'test', 'jslint:dev', 'docs', 'watch' ]);
  grunt.registerTask('docs', [ 'docco' ]);
  grunt.registerTask('default', []);
};
