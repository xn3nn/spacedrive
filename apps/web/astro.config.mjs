import react from '@astrojs/react';
// import solid from '@astrojs/solid-js';
import tailwind from '@astrojs/tailwind';
import { defineConfig } from 'astro/config';
import { mergeConfig } from 'vite';

import baseConfig from '../../packages/config/vite';
import relativeAliasResolver from '../../packages/config/vite/relativeAliasResolver';

// https://astro.build/config
export default defineConfig({
	integrations: [
		react({
			// exclude: ['**/*.solid.*']
		}),
		// solid({
		// 	include: ['**/*.solid.*']
		// }),
		tailwind()
	],
	// server: {
	// 	port: 8002
	// },
	vite: mergeConfig(baseConfig, {
		resolve: {
			// BE REALLY DAMN CAREFUL MODIFYING THIS: https://github.com/spacedriveapp/spacedrive/pull/1353
			alias: [relativeAliasResolver]
		}
	})
});
