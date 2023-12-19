import { createInfiniteQuery } from '@tanstack/solid-query';
import type { FilePathSearchArgs } from '@sd/client';

import { useCache as useCacheContext } from '../../cache';
import { useRspcLibraryContext } from '../../rspc';
import { useLibraryContext } from '../../useLibraryContext';

export function createPathsInfiniteQuery() {
	// props: CreateExplorerInfiniteQueryArgs<FilePathSearchArgs>
	const ctx = useRspcLibraryContext();

	const cache = useCacheContext();
	const library = useLibraryContext();

	return createInfiniteQuery({
		queryKey: () =>
			[
				'search.paths',
				{ library_id: library.library.uuid, arg: {} as FilePathSearchArgs }
			] as const,
		queryFn: async ({ queryKey: [_, { arg }] }) => {
			const result = await ctx!.client.query(['search.paths', arg]);

			cache.setNodes(result.nodes);
			return cache.useCache(result.items);
		}
		// getNextPageParam: (lastPage) => {
		// 	if (arg.take === null || arg.take === undefined) return undefined;
		// 	if (lastPage.items.length < arg.take) return undefined;
		// 	else return lastPage.nodes[arg.take - 1];
		// }
	});
}
