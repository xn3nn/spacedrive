import { QueryClient, QueryClientProvider } from '@tanstack/solid-query';
import { createComputed, createMemo, Show } from 'solid-js';
import { type FilePathOrder, type Location } from '@sd/client';

import { cacheCtx, createCache, useCache } from './cache';
import { Explorer } from './Explorer';
import { ExplorerContextProvider } from './Explorer/Context';
import { createExplorer } from './Explorer/createExplorer';
import { createPathsExplorerQuery } from './Explorer/queries/createPathsExplorerQuery';
import { filePathOrderingKeysSchema } from './Explorer/store';
import { PlatformProvider, type Platform } from './Platform';
import { createLibraryQuery, RspcProvider, useRspcLibraryContext } from './rspc';
import { ClientContextProvider, useClientContext } from './useClientContext';
import { LibraryContextProvider } from './useLibraryContext';
import { useTheme } from './useTheme';

import './style.scss';

export const LIBRARY_UUID = 'f47c74cb-119d-42bf-b63d-87e2f9a2e3ba';

const spacedriveURL = (() => {
	const currentURL = new URL(window.location.href);
	if (import.meta.env.VITE_SDSERVER_ORIGIN) {
		currentURL.host = import.meta.env.VITE_SDSERVER_ORIGIN;
	} else if (import.meta.env.DEV) {
		currentURL.host = 'localhost:8080';
	}
	return `${currentURL.origin}/spacedrive`;
})();

const platform: Platform = {
	platform: 'web',
	getThumbnailUrlByThumbKey: (keyParts) =>
		`${spacedriveURL}/thumbnail/${keyParts.map((i) => encodeURIComponent(i)).join('/')}.webp`,
	getFileUrl: (libraryId, locationLocalId, filePathId) =>
		`${spacedriveURL}/file/${encodeURIComponent(libraryId)}/${encodeURIComponent(
			locationLocalId
		)}/${encodeURIComponent(filePathId)}`,
	getFileUrlByPath: (path) => `${spacedriveURL}/local-file-by-path/${encodeURIComponent(path)}`,
	openLink: (url) => window.open(url, '_blank')?.focus(),
	confirm: (message, cb) => cb(window.confirm(message)),
	// auth: {
	// 	start(url) {
	// 		return window.open(url);
	// 	},
	// 	finish(win: Window | null) {
	// 		win?.close();
	// 	}
	// },
	landingApiOrigin: 'https://spacedrive.com'
};

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			...(import.meta.env.VITE_SD_DEMO_MODE && {
				refetchOnWindowFocus: false,
				staleTime: Infinity,
				cacheTime: Infinity,
				networkMode: 'offlineFirst',
				enabled: false
			}),
			networkMode: 'always'
		},
		mutations: {
			networkMode: 'always'
		}
		// TODO: Mutations can't be globally disable which is annoying!
	}
});

const cache = createCache();

export function Page() {
	return (
		<RspcProvider queryClient={queryClient}>
			<PlatformProvider platform={platform}>
				<QueryClientProvider client={queryClient}>
					<cacheCtx.Provider value={cache}>
						<ClientContextProvider currentLibraryId={LIBRARY_UUID}>
							<ClientInner />
						</ClientContextProvider>
					</cacheCtx.Provider>
				</QueryClientProvider>
			</PlatformProvider>
		</RspcProvider>
	);
}

function ClientInner() {
	useTheme();

	const clientCtx = useClientContext();

	return (
		<Show when={clientCtx.library()}>
			{(library) => (
				<div class="bg-app">
					<LibraryContextProvider library={library()}>
						<Wrapper />
					</LibraryContextProvider>
				</div>
			)}
		</Show>
	);
}

function Wrapper() {
	const cache = useCache();
	const locationQuery = createLibraryQuery(() => ['locations.get', 1]);

	createComputed(() => cache.setNodes(locationQuery.data?.nodes ?? []));
	const location = createMemo(() => cache.useCache(locationQuery.data?.item));

	return <Show when={location()}>{(location) => <Inner location={location()} />}</Show>;
}

function Inner(props: { location: Location }) {
	// const { library } = useLibraryContext();
	const ctx = useRspcLibraryContext();

	const paths = createPathsExplorerQuery({ arg: { take: 100 } });

	const explorer = createExplorer<FilePathOrder>({
		...paths,
		settings: { orderingKeys: filePathOrderingKeysSchema },
		isFetchingNextPage: paths.query.isFetchingNextPage,
		parent: {
			type: 'Location',
			get location() {
				return props.location;
			}
		}
	});

	return (
		<div class="flex h-screen w-screen">
			<ExplorerContextProvider explorer={explorer()}>
				<Explorer />
			</ExplorerContextProvider>
		</div>
	);
}
