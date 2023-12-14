import { createContext, useContext } from 'solid-js';

import { type GridViewItemProps } from '.';

export const GridViewItemContext = createContext<GridViewItemProps | null>(null);

export const useGridViewItemContext = () => {
	const ctx = useContext(GridViewItemContext);

	if (ctx === null) throw new Error('GridViewItemContext.Provider not found!');

	return ctx;
};
