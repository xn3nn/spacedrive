import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			networkMode: 'always',
			refetchOnWindowFocus: false // default: true
		},
		mutations: {
			networkMode: 'always'
		}
	}
});
