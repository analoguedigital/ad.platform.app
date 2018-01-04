/// <binding BeforeBuild='build' />
module.exports = function (grunt) {

    grunt.initConfig({
        nggettext_compile: {
            all: {
                files: {
                    'source/scripts/translations.js': ['po/*.po']
                }
            },
        },
        nggettext_extract: {
            pot: {
                files: {
                    'po/template.pot': ['source/partials/*.html', 'source/partials/metrics/*.html', 'source/scripts/*.js', 'source/scripts/controllers/*.js']
                }
            },
        },
        sass: {
            dist: {
                files: {
                    'source/scss/ionic.app.css': 'source/scss/ionic.app.scss'
                }
            }
        },
        ts: {
            default: {
                src: ["scripts/typings/**/*.ts", "source/**/*.ts"],
                out: "source/scripts/app.ts.js",
                options: {
                    sourceMap: false
                }
            }
        },
        copy: {
            html: {
                expand: true, cwd: 'source/', src: '**/*.html', dest: "www/", flatten: false, filter: 'isFile'
            },
            images: {
                expand: true, cwd: 'source/', src: '**/*.png', dest: "www/", flatten: false, filter: 'isFile'
            },
            css: {
                expand: true, cwd: 'source/', src: '**/*.css', dest: "www/", flatten: false, filter: 'isFile'
            },
            fonts: {
                expand: true, cwd: 'bower_components/', src: ['bootstrap/dist/fonts/*', 'font-awesome/fonts/*', 'ionic/release/fonts/*'], dest: "www/fonts", flatten: true, filter: 'isFile'
            },
            js: {
                expand: true, cwd: '.tmp/concat/js/', src: '*', dest: "www/js", flatten: false, filter: 'isFile'
            }
        },
        useminPrepare: {
            html: 'source/index.html',
            options: {
                dest: 'www'
            }

        },
        usemin: {
            html: 'www/index.html',
            options: {
                dirs: ['www'],
                assetsDirs: ['images', 'css']
            }
        }

    })

    grunt.loadNpmTasks("grunt-angular-gettext");
    grunt.loadNpmTasks("grunt-contrib-concat");
    grunt.loadNpmTasks("grunt-contrib-copy");
    grunt.loadNpmTasks("grunt-contrib-cssmin");
    grunt.loadNpmTasks("grunt-contrib-uglify");
    grunt.loadNpmTasks("grunt-ts");
    grunt.loadNpmTasks("grunt-usemin");
    grunt.loadNpmTasks("grunt-sass");

    grunt.registerTask('build', [
        'sass',
        'ts',
        'copy:html',
        'copy:css',
        'copy:images',
        'copy:fonts',
        'useminPrepare',
        'concat:generated',
        'cssmin:generated',
        //'uglify:generated',
        'copy:js',
        'usemin'
    ]);
};