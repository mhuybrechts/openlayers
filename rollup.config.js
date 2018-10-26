import cjs from 'rollup-plugin-commonjs';
import node from 'rollup-plugin-node-resolve';
import {terser} from 'rollup-plugin-terser';

export default [
	{
		input:   'ol-module.js',
		output:  [
			{
				file:   'dist/ol-debug.js',
				format: 'iife',
				name:   'ol',
				sourcemap: true
			}
		],
		plugins: [
			node(),
			cjs()
		]
	}, {
		input:   'ol-module.js',
		output:  [
			{
				file:   'dist/ol.js',
				format: 'iife',
				name:   'ol',
				sourcemap: true
			}
		],
		plugins: [
			node(),
			cjs(),
			terser()
		]
	}
];
