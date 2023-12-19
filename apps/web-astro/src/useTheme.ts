import { createEffect } from 'solid-js';
import { createMutable } from 'solid-js/store';
import { getThemeStore, useThemeStore } from '@sd/client';

import { usePlatform } from './Platform';

export const themeStore = createMutable({
	theme: 'dark',
	syncThemeWithSystem: false,
	hueValue: 235
});

export function useTheme() {
	// const themeStore = useThemeStore();
	const platform = usePlatform();
	const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');

	createEffect(() => {
		const handleThemeChange = () => {
			if (themeStore.syncThemeWithSystem) {
				platform.lockAppTheme?.('Auto');
				if (systemTheme.matches) {
					document.documentElement.classList.remove('vanilla-theme');
					document.documentElement.style.setProperty(
						'--dark-hue',
						getThemeStore().hueValue.toString()
					);
					getThemeStore().theme = 'dark';
				} else {
					document.documentElement.classList.add('vanilla-theme');
					document.documentElement.style.setProperty(
						'--light-hue',
						getThemeStore().hueValue.toString()
					);
					getThemeStore().theme = 'vanilla';
				}
			} else {
				if (themeStore.theme === 'dark') {
					document.documentElement.classList.remove('vanilla-theme');
					document.documentElement.style.setProperty(
						'--dark-hue',
						getThemeStore().hueValue.toString()
					);
					platform.lockAppTheme?.('Dark');
				} else if (themeStore.theme === 'vanilla') {
					document.documentElement.classList.add('vanilla-theme');
					document.documentElement.style.setProperty(
						'--light-hue',
						getThemeStore().hueValue.toString()
					);
					platform.lockAppTheme?.('Light');
				}
			}
		};

		handleThemeChange();

		systemTheme.addEventListener('change', handleThemeChange);

		return () => {
			systemTheme.removeEventListener('change', handleThemeChange);
		};
	});
}
