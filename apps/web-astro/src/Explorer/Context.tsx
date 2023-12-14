import { createContext, useContext, type ParentProps } from 'solid-js';

import { Ordering } from './store';
import { type CreateExplorer } from './useExplorer';

/**
 * Context that must wrap anything to do with the explorer.
 * This includes explorer views, the inspector, and top bar items.
 */
const ExplorerContext = createContext<CreateExplorer<Ordering> | null>(null);

type ExplorerContext = CreateExplorer<Ordering>;

export const useExplorerContext = () => {
	const ctx = useContext(ExplorerContext);

	if (ctx === null) throw new Error('ExplorerContext.Provider not found!');

	return ctx;
};

export const ExplorerContextProvider = <TExplorer extends CreateExplorer<any>>(
	props: ParentProps<{ explorer: TExplorer }>
) => <ExplorerContext.Provider value={props.explorer}>{props.children}</ExplorerContext.Provider>;
