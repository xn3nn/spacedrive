import { ReactiveSet } from '@solid-primitives/set';
import { type InfiniteQueryObserverResult } from '@tanstack/solid-query';
import { createMemo, createSignal, type Accessor, type ComponentProps } from 'solid-js';
import { useDebouncedCallback } from 'use-debounce';
import { z } from 'zod';
import type {
	ExplorerItem,
	ExplorerLayout,
	ExplorerSettings,
	FilePath,
	Location,
	NodeState,
	Tag
} from '@sd/client';

import { createDefaultExplorerSettings, type Ordering, type OrderingKeys } from './store';
import { uniqueId } from './util';

export type ExplorerParent =
	| {
			type: 'Location';
			location: Location;
			subPath?: FilePath;
	  }
	| {
			type: 'Ephemeral';
			path: string;
	  }
	| {
			type: 'Tag';
			tag: Tag;
	  }
	| {
			type: 'Node';
			node: NodeState;
	  };

export interface UseExplorerProps<TOrder extends Ordering> {
	items: () => ExplorerItem[] | null;
	count?: number;
	parent?: ExplorerParent;
	loadMore?: () => void;
	isFetchingNextPage?: boolean;
	isLoadingPreferences?: boolean;
	scrollRef?: Accessor<HTMLDivElement>;
	/**
	 * @defaultValue `true`
	 */
	allowMultiSelect?: boolean;
	overscan?: number;
	/**
	 * @defaultValue `true`
	 */
	selectable?: boolean;
	settings: ReturnType<typeof useExplorerSettings<TOrder>>;
	/**
	 * @defaultValue `true`
	 */
	showPathBar?: boolean;
	layouts?: Partial<Record<ExplorerLayout, boolean>>;
}

/**
 * Controls top-level config and state for the explorer.
 * View- and inspector-specific state is not handled here.
 */
export function createExplorer<TOrder extends Ordering>({
	settings,
	layouts,
	...props
}: UseExplorerProps<TOrder>) {
	const [scrollRef, setScrollRef] = createSignal<HTMLDivElement | null>(null);

	return {
		// Default values
		allowMultiSelect: true,
		selectable: true,
		scrollRef,
		setScrollRef,
		count: props.items?.length,
		showPathBar: true,
		layouts: {
			grid: true,
			list: true,
			media: true,
			...layouts
		},
		...settings,
		// Provided values
		...props,
		// Selected items
		...createSelectedItems(() => props.items)
	};
}

export type CreateExplorer<TOrder extends Ordering> = ReturnType<typeof createExplorer<TOrder>>;

export function useExplorerSettings<TOrder extends Ordering>({
	settings,
	onSettingsChanged,
	orderingKeys,
	location
}: {
	settings: ReturnType<typeof createDefaultExplorerSettings<TOrder>>;
	onSettingsChanged?: (settings: ExplorerSettings<TOrder>, location: Location) => void;
	orderingKeys?: z.ZodUnion<
		[z.ZodLiteral<OrderingKeys<TOrder>>, ...z.ZodLiteral<OrderingKeys<TOrder>>[]]
	>;
	location?: Location | null;
}) {
	// const [store] = useState(() => proxy(settings));

	const updateSettings = useDebouncedCallback(
		(settings: ExplorerSettings<TOrder>, location: Location) => {
			onSettingsChanged?.(settings, location);
		},
		500
	);

	useEffect(() => updateSettings.flush(), [location, updateSettings]);

	useEffect(() => {
		if (updateSettings.isPending()) return;
		Object.assign(store, settings);
	}, [settings, store, updateSettings]);

	useEffect(() => {
		if (!onSettingsChanged || !location) return;
		const unsubscribe = subscribe(store, () => {
			updateSettings(snapshot(store) as ExplorerSettings<TOrder>, location);
		});
		return () => unsubscribe();
	}, [store, updateSettings, location, onSettingsChanged]);

	return {
		useSettingsSnapshot: () => useSnapshot(store),
		settingsStore: store,
		orderingKeys
	};
}

export type UseExplorerSettings<TOrder extends Ordering> = ReturnType<
	typeof useExplorerSettings<TOrder>
>;

function createSelectedItems(items: () => ExplorerItem[] | null) {
	// Doing pointer lookups for hashes is a bit faster than assembling a bunch of strings
	// WeakMap ensures that ExplorerItems aren't held onto after they're evicted from cache
	const itemHashesWeakMap = new WeakMap<ExplorerItem, string>();

	// Store hashes of items instead as objects are unique by reference but we
	// still need to differentate between item variants
	const selectedItemHashes = new ReactiveSet<string>();

	const itemsMap = createMemo(() =>
		(items() ?? []).reduce((items, item) => {
			const hash = itemHashesWeakMap.get(item) ?? uniqueId(item);
			itemHashesWeakMap.set(item, hash);
			items.set(hash, item);
			return items;
		}, new Map<string, ExplorerItem>())
	);

	const selectedItems = createMemo(() =>
		[...selectedItemHashes].reduce((items, hash) => {
			const item = itemsMap().get(hash);
			if (item) items.add(item);
			return items;
		}, new Set<ExplorerItem>())
	);

	return {
		selectedItems,
		selectedItemHashes,
		addSelectedItem: (item: ExplorerItem) => {
			selectedItemHashes.add(uniqueId(item));
		},
		removeSelectedItem: (item: ExplorerItem) => {
			selectedItemHashes.delete(uniqueId(item));
		},
		resetSelectedItems: (items?: ExplorerItem[]) => {
			selectedItemHashes.clear();
			items?.forEach((item) => selectedItemHashes.add(uniqueId(item)));
		},
		isItemSelected: (item: ExplorerItem) => selectedItems().has(item)
	};
}
