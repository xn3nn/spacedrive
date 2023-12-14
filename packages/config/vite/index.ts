// import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { createHtmlPlugin } from 'vite-plugin-html';
// import solid from 'vite-plugin-solid';
import svg from 'vite-plugin-svgr';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
	plugins: [
		tsconfigPaths(),
		// react({
		// 	exclude: ['**/*.solid.*']
		// }),
		// solid({
		// 	include: ['**/*.solid.*']
		// }),
		svg({ svgrOptions: { icon: true } }),
		createHtmlPlugin({
			minify: true
		})
	],
	css: {
		modules: {
			localsConvention: 'camelCaseOnly'
		}
	},
	root: 'src'
	// build: {
	// 	sourcemap: true,
	// 	outDir: '../dist',
	// 	assetsDir: '.'
	// }
});
