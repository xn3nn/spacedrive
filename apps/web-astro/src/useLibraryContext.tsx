import { createContext, useContext, type ParentProps } from 'solid-js';
import type { LibraryConfigWrapped } from '@sd/client';

import { createBridgeSubscription } from './rspc';
import { useClientContext, type ClientContext } from './useClientContext';

export interface LibraryContext {
	library: LibraryConfigWrapped;
	libraries: ClientContext['libraries'];
}

const LibraryContext = createContext<LibraryContext>(null!);

interface LibraryContextProviderProps extends ParentProps {
	library: LibraryConfigWrapped;
}

export const LibraryContextProvider = (props: LibraryContextProviderProps) => {
	const { libraries } = useClientContext();

	// We put this into context because each hook creates a new subscription which means we get duplicate events from the backend if we don't do this
	// TODO: This should probs be a library subscription - https://linear.app/spacedriveapp/issue/ENG-724/locationsonline-should-be-a-library-not-a-bridge-subscription
	createBridgeSubscription(() => ['locations.online'] as const, {
		onData: (d) => {
			// getLibraryStore().onlineLocations = d;
		}
	});

	return (
		<LibraryContext.Provider value={{ library: props.library, libraries }}>
			{props.children}
		</LibraryContext.Provider>
	);
};

export const useLibraryContext = () => {
	const ctx = useContext(LibraryContext);

	if (ctx === undefined) throw new Error("'LibraryContextProvider' not mounted");

	return ctx;
};

// export function useOnlineLocations() {
// 	const { onlineLocations } = useLibraryStore();
// 	return onlineLocations;
// }
