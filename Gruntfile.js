module.exports = function (grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json"),
        concat: {
            options: {
                separator: ";"
            },
            dist: {
                src: [
                    "scripts/lib/ics.deps.min.js",
                    "scripts/lib/moment.js",
                    "scripts/lib/moment-timezone-with-data-10-year-range.js",
                ],
                dest: "scripts/min/deps.js"
            }
        },
        terser: {
            options: {},
            main: {
                files: {
                    "scripts/min/deps.min.js": ["scripts/min/deps.js"],
                    "scripts/min/background.min.js": ["scripts/background.js"],
                    "scripts/min/global.min.js": ["scripts/global.js"],
                    "scripts/min/grabber.min.js": ["scripts/grabber.js"],
                    "scripts/min/options.min.js": ["scripts/options.js"],
                }
            }
        },
    });

    grunt.loadNpmTasks("grunt-contrib-concat");
    grunt.loadNpmTasks("grunt-terser");

    grunt.registerTask("default", ["concat", "terser"]);
};