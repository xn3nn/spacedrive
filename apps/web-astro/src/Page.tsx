import { createInfiniteQuery } from '@tanstack/solid-query';

import { Explorer } from './Explorer';
import { createExplorer } from './Explorer/useExplorer';
import { createLibraryQuery, useRspcLibraryContext } from './rspc';

export function Page() {
	const { library } = useLibraryContext();
	const ctx = useRspcLibraryContext();

	const query = createInfiniteQuery({
		queryKey: ['search.paths', { library_id: library.uuid, arg }] as const,
		queryFn: async ({ queryKey: [_, { arg }] }) => {
			const result = await ctx!.client.query(['search.paths', arg]);
			return result;
		},
		getNextPageParam: (lastPage) => {
			if (arg.take === null || arg.take === undefined) return undefined;
			if (lastPage.items.length < arg.take) return undefined;
			else return lastPage.nodes[arg.take - 1];
		},
		...args
	});

	const count = createLibraryQuery(['search.pathsCount', { filters: props.arg.filters }], {
		enabled: query.isSuccess
	});

	const explorer = createExplorer();

	return <Explorer />;
}
