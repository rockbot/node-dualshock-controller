var files = ['gruntfile.js',
				'lib/*.js',
				'test/*.js',
				'examples/*.js'];
module.exports = function(grunt) {
	grunt.initConfig({
		watch: {
			files: files,
			tasks: ['jshint', 'nodeunit']
		},
		jshint: {
			// define the files to lint
			files: files,
			// configure JSHint (documented at http://www.jshint.com/docs/)
			options: {
				// more options here if you want to override JSHint defaults
				globals: {
					console: true,
					module: true
				}
			}
		},
		nodeunit: {
			all: ['test/*.js']
		}
	});

	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-nodeunit');

	grunt.registerTask('test', ['jshint', 'nodeunit']);
	grunt.registerTask('default', ['jshint', 'nodeunit']);
};