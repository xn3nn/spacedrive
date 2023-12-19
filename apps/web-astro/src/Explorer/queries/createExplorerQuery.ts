import { type CreateInfiniteQueryResult, type CreateQueryResult } from '@tanstack/solid-query';
import { createMemo } from 'solid-js';

export function createExplorerQuery<Q>(
	query: CreateInfiniteQueryResult<Q[]>,
	count: CreateQueryResult<number>
) {
	const items = createMemo(() => query.data?.pages.flatMap((d) => d) ?? null);

	const loadMore = () => {
		if (query.hasNextPage && !query.isFetchingNextPage) {
			query.fetchNextPage.call(undefined);
		}
	};

	return { query, items, loadMore, count: count.data };
}

export type CreateExplorerQuery<Q> = ReturnType<typeof createExplorerQuery<Q>>;
