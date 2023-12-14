// import Selecto from 'react-selecto';
import { createContext, useContext } from 'solid-js';

interface GridContext {
	// selecto?: React.RefObject<Selecto>;
	selectoUnselected: Set<string>;
	getElementById: (id: string) => Element | null | undefined;
}

export const GridContext = createContext<GridContext | null>(null);

export const useGridContext = () => {
	const ctx = useContext(GridContext);

	if (ctx === null) throw new Error('GridContext.Provider not found!');

	return ctx;
};
