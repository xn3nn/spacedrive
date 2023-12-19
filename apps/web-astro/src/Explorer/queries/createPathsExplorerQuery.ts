import { type FilePathSearchArgs } from '@sd/client';

import { createLibraryQuery } from '../../rspc';
import { createExplorerQuery } from './createExplorerQuery';
import { createPathsInfiniteQuery } from './createPathsInfiniteQuery';

export function createPathsExplorerQuery(props: {
	arg: FilePathSearchArgs;
	// explorerSettings: CreateExplorerSettings<FilePathOrder>;
}) {
	const query = createPathsInfiniteQuery();

	const count = createLibraryQuery(() => ['search.pathsCount', { filters: props.arg.filters }], {
		enabled: query.isSuccess
	});

	return createExplorerQuery(query, count);
}
