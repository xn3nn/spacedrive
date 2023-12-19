import {
	createContext,
	createEffect,
	createMemo,
	useContext,
	type Accessor,
	type ParentProps
} from 'solid-js';
import { valtioPersist, type LibraryConfigWrapped } from '@sd/client';

import { useCache } from './cache';
import { createBridgeQuery, nonLibraryClient } from './rspc';

// The name of the localStorage key for caching library data
const libraryCacheLocalStorageKey = 'sd-library-list2'; // `2` is because the format of this underwent a breaking change when introducing normalised caching

export const useCachedLibraries = () => {
	const query = createBridgeQuery(() => ['library.list'] as const, {
		keepPreviousData: true
		// initialData: () => {
		// 	const cachedData = localStorage.getItem(libraryCacheLocalStorageKey);

		// 	if (cachedData) {
		// 		// If we fail to load cached data, it's fine
		// 		try {
		// 			return JSON.parse(cachedData);
		// 		} catch (e) {
		// 			console.error("Error loading cached 'sd-library-list' data", e);
		// 		}
		// 	}

		// 	return undefined;
		// },
		// onSuccess: (data) => localStorage.setItem(libraryCacheLocalStorageKey, JSON.stringify(data))
	});
	const cache = useCache();
	createMemo(() => cache.setNodes(query.data?.nodes ?? []));
	const libraries = createMemo(() => cache.useCache(query.data?.items ?? []));

	return {
		...query,
		get data() {
			return libraries();
		}
	};
};

// export async function getCachedLibraries(cache: NormalisedCache) {
// 	const cachedData = localStorage.getItem(libraryCacheLocalStorageKey);

// 	if (cachedData) {
// 		// If we fail to load cached data, it's fine
// 		try {
// 			const data = JSON.parse(cachedData);
// 			cache.withNodes(data.nodes);
// 			return cache.withCache(data.items) as LibraryConfigWrapped[];
// 		} catch (e) {
// 			console.error("Error loading cached 'sd-library-list' data", e);
// 		}
// 	}

// 	const result = await nonLibraryClient.query(['library.list']);
// 	cache.withNodes(result.nodes);
// 	const libraries = cache.withCache(result.items);

// 	localStorage.setItem(libraryCacheLocalStorageKey, JSON.stringify(result));

// 	return libraries;
// }

export interface ClientContext {
	currentLibraryId: string | null;
	libraries: ReturnType<typeof useCachedLibraries>;
	library: Accessor<LibraryConfigWrapped | null | undefined>;
}

const ClientContext = createContext<ClientContext>(null!);

interface ClientContextProviderProps extends ParentProps {
	currentLibraryId: string | null;
}

export const ClientContextProvider = (props: ClientContextProviderProps) => {
	const libraries = useCachedLibraries();

	createEffect(() => {
		currentLibraryCache.id = props.currentLibraryId;
	});

	const library = createMemo(
		() =>
			(libraries.data && libraries.data.find((l) => l.uuid === props.currentLibraryId)) ||
			null
	);

	return (
		<ClientContext.Provider
			value={{
				currentLibraryId: props.currentLibraryId,
				libraries,
				library
			}}
		>
			{props.children}
		</ClientContext.Provider>
	);
};

export const useClientContext = () => {
	const ctx = useContext(ClientContext);

	if (ctx === undefined) throw new Error("'ClientContextProvider' not mounted");

	return ctx;
};

export const useCurrentLibraryId = () => useClientContext().currentLibraryId;

export const currentLibraryCache = valtioPersist('sd-current-library', {
	id: null as string | null
});
