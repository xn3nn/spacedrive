import type { StorybookConfig } from 'storybook-solidjs-vite';

const config: StorybookConfig = {
	stories: [
		{
			directory: '../../../packages/ui-solid/src/**',
			titlePrefix: 'UI',
			files: '*.stories.*'
		}
		// {
		// 	directory: '../../../interface-solid/app/**',
		// 	titlePrefix: 'Interface',
		// 	files: '*.stories.*'
		// }
	],
	addons: [
		'@storybook/addon-links',
		'@storybook/addon-essentials',
		'@storybook/addon-interactions',
		{
			name: '@storybook/addon-styling',
			options: {
				// Check out https://github.com/storybookjs/addon-styling/blob/main/docs/api.md
				// For more details on this addon's options.
				postCss: true
			}
		}
	],
	framework: {
		name: 'storybook-solidjs-vite',
		options: {}
	},
	docs: {
		autodocs: 'tag'
	}
};
export default config;
