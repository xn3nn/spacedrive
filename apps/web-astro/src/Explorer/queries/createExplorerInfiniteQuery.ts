import { type CreateInfiniteQueryOptions } from '@tanstack/solid-query';
import { type ExplorerItem, type SearchData } from '@sd/client';

import { type Ordering } from '../store';

export type CreateExplorerInfiniteQueryArgs<TArg> = {
	arg: TArg;
	// explorerSettings: CreateExplorerSettings<TOrder>;
} & Pick<CreateInfiniteQueryOptions<SearchData<ExplorerItem>>, 'enabled' | 'suspense'>;
