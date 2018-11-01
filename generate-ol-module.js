'use strict';

var fs = require('fs'),
	path = require('path');

var prefix = "if (typeof Object.assign != 'function') {" +
"Object.defineProperty(Object, 'assign', {" +
"	value: function assign(target, varArgs) {" +
"		'use strict';" +
"		if (target == null) {" +
"			throw new TypeError('Cannot convert undefined or null to object');" +
"		}" +
"" +
"		var to = Object(target);" +
"" +
"		for (var index = 1; index < arguments.length; index++) {" +
"			var nextSource = arguments[index];" +
"" +
"			if (nextSource != null) {" +
"				for (var nextKey in nextSource) {" +
"					if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {" +
"						to[nextKey] = nextSource[nextKey];" +
"					}" +
"				}" +
"			}" +
"		}" +
"		return to;" +
"	}," +
"	writable: true," +
"	configurable: true" +
"});" +
"}";

var listModulefiles = function (dir) {
	var re = [ ];

	fs.readdirSync(dir)
		.forEach(function (f) {
			var df = path.join(dir, f);

			var stats = fs.statSync(df),
				basename = path.basename(df);
			// Lowercase filenames contain modules
			if (stats.isFile() && basename.match(/^[a-z]/)) {
				var extension = path.extname(df);
				if (extension === '.js') {
					if (basename === 'index.js') {
						re.push(path.dirname(df));
					} else {
						re.push(df.replace(/\.js$/,''));
					}
				}
			} else if (stats.isDirectory()) {
				var subModules = listModulefiles(df);
				if (subModules.length) {
					re = re.concat(subModules);
				}
			}
		});

	return re.sort();
};

var modules = listModulefiles('./node_modules/ol'),
	imports = [],
	properties = [],
	assignments = [];

modules.forEach(function(moduleDir){
	var baseModuleDir = moduleDir.replace(/^node_modules\//, ''),
		moduleName = '__' + baseModuleDir.replace(/\//g, '_'),
		propName = baseModuleDir.replace(/\//g, '.').replace(/^ol/, '');

	if (propName !== '') {
		// Make sure all parents exists
		var elements = propName.split('.'),
			ns = [];
		for (var i=1; i < elements.length; i++) {
			ns.push(elements[i]);
			properties.push('ret.'+ns.join('.')+' = ret.'+ns.join('.')+' || {}');
		}
	}

	if (fs.existsSync(moduleDir + '.js') || fs.existsSync(moduleDir + '/index.js')) {
		imports.push('import * as ' + moduleName + ' from \'./' + moduleDir + '\'');
		assignments.push('Object.assign(ret' + propName + ', ' + moduleName + ')');
	}
});

// Some missing stuff
imports.push('import {default as MousePosition} from \'./node_modules/ol/control/MousePosition\'');
//properties.push('ret.control.MousePosition = ret.control.MousePosition || {}');
assignments.push('ret.control.MousePosition = MousePosition');

fs.open('ol-module.js', 'w', function (err, fd) {
	if (err) throw err;

	fs.writeSync(fd, imports.join(';\n'));
	fs.writeSync(fd, '\n\n');
	fs.writeSync(fd, 'var ret = {};\n');
	fs.writeSync(fd, '\n\n');
	fs.writeSync(fd, properties.join(';\n'));
	fs.writeSync(fd, '\n\n');

	fs.writeSync(fd, prefix);
	fs.writeSync(fd, '\n\n');

	fs.writeSync(fd, assignments.join(';\n'));
	fs.writeSync(fd, '\n\n');

	fs.writeSync(fd, 'export default ret;\n');

	fs.close(fd);
});
