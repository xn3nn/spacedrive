import { defineConfig } from 'vite';
import { createHtmlPlugin } from 'vite-plugin-html';
import solid from 'vite-plugin-solid';
import svg from 'vite-plugin-solid-svg';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
	plugins: [
		tsconfigPaths(),
		solid(),
		svg({ svgo: { enabled: true } }),
		createHtmlPlugin({ minify: true })
	],
	css: { modules: { localsConvention: 'camelCaseOnly' } },
	root: 'src',
	build: {
		sourcemap: true,
		outDir: '../dist',
		assetsDir: '.'
	}
});
