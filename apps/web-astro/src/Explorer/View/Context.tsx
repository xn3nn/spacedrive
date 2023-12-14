import { createContext, useContext } from 'solid-js';

export interface ExplorerViewContext {
	ref(): HTMLDivElement | undefined;
	top?: number;
	bottom?: number;
	contextMenu?: JSX.Element;
	selectable: boolean;
	listViewOptions?: {
		hideHeaderBorder?: boolean;
	};
}

export const ViewContext = createContext<ExplorerViewContext | null>(null);

export const useExplorerViewContext = () => {
	const ctx = useContext(ViewContext);

	if (ctx === null) throw new Error('ViewContext.Provider not found!');

	return ctx;
};
