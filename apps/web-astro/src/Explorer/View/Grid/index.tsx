// import { Grid, useGrid } from '@virtual-grid/react';
import { createEffect, createMemo, createSignal, Show, type JSX } from 'solid-js';
import { type ExplorerItem } from '@sd/client';

import { useExplorerContext } from '../../Context';
// import { getQuickPreviewStore, useQuickPreviewStore } from '../../QuickPreview/store';
import { uniqueId } from '../../util';
import { useExplorerViewContext } from '../Context';
import { GridContext } from './context';
import { createGrid } from './createGrid';
import { GridItem } from './Item';
import { VirtualGrid } from './VirtualGrid';

export type RenderItem = (item: {
	item: ExplorerItem;
	selected: boolean;
	cut: boolean;
}) => JSX.Element;

const CHROME_REGEX = /Chrome/;
const isChrome = CHROME_REGEX.test(navigator.userAgent);

export default (props: { children: RenderItem }) => {
	// const os = useOperatingSystem();
	// const realOS = useOperatingSystem(true);

	const explorer = useExplorerContext();
	const explorerView = useExplorerViewContext();
	// const explorerSettings = explorer.useSettingsSnapshot();
	// const quickPreviewStore = useQuickPreviewStore();

	// const selecto = useRef<Selecto>(null);
	const selectoUnselected = new Set<string>();
	// const selectoFirstColumn = useRef<number | undefined>();
	// const selectoLastColumn = useRef<number | undefined>();

	// The item that further selection will move from (shift + arrow for example).
	// This used to be calculated from the last item of selectedItems,
	// but Set ordering isn't reliable.
	// Ref bc we never actually render this.
	let activeItem: ExplorerItem | null = null;

	const [dragFromThumbnail, setDragFromThumbnail] = createSignal(false);

	const itemDetailsHeight = 44 + (false ? 20 : 0);
	// const itemHeight = explorerSettings.gridItemSize + itemDetailsHeight;
	const itemHeight = 100 + itemDetailsHeight;
	// const padding = explorerSettings.layoutMode === 'grid' ? 12 : 0;

	const grid = createGrid(() => ({
		scrollRef: explorer.scrollRef,
		count: explorer.items()?.length ?? 0,
		totalCount: explorer.count,
		// ...(explorerSettings.layoutMode === 'grid'
		// ?
		columns: 'auto',
		size: { width: 100, height: itemHeight },
		// : { columns: explorerSettings.mediaColumns }),
		rowVirtualizer: { overscan: explorer.overscan ?? 10 },
		onLoadMore: explorer.loadMore,
		getItemId: (index) => {
			const item = explorer.items()?.[index];
			return item ? uniqueId(item) : undefined;
		},
		getItemData: (index) => explorer.items()?.[index]
		// padding: {
		// 	bottom: explorerView.bottom ? padding + explorerView.bottom : undefined,
		// 	x: padding,
		// 	y: padding
		// },
		// gap: explorerSettings.layoutMode === 'grid' ? explorerSettings.gridGap : 1
	}));

	const getElementById = (id: string) => {
		if (!explorer.parent) return;
		const itemId =
			// realOS === 'windows' &&
			explorer.parent.type === 'Ephemeral' ? id.replaceAll('\\', '\\\\') : id;
		return document.querySelector(`[data-selectable-id="${itemId}"]`);
	};

	function getElementId(element: Element) {
		return element.getAttribute('data-selectable-id');
	}

	function getElementIndex(element: Element) {
		const index = element.getAttribute('data-selectable-index');
		return index ? Number(index) : null;
	}

	function getElementItem(element: Element) {
		const index = getElementIndex(element);
		if (index === null) return null;

		return grid().getItem(index) ?? null;
	}

	function getActiveItem(elements: Element[]) {
		// Get selected item with least index.
		// Might seem kinda weird but it's the same behaviour as Finder.
		const activeItem =
			elements.reduce(
				(least, current) => {
					const currentItem = getElementItem(current);
					if (!currentItem) return least;

					if (!least) return currentItem;

					return currentItem.index < least.index ? currentItem : least;
				},
				null as ReturnType<typeof getElementItem>
			)?.data ?? null;

		return activeItem;
	}

	createEffect(() => {
		if (explorer.selectedItems().size !== 0) return;

		// selectoUnselected.current = new Set();
		activeItem = null;
	}, [explorer.selectedItems]);

	// useShortcut('explorerEscape', () => {
	// 	if (!explorerView.selectable || explorer.selectedItems.size === 0) return;
	// 	explorer.resetSelectedItems([]);
	// 	selecto.current?.setSelectedTargets([]);
	// });

	return (
		<GridContext.Provider
			value={{
				// selecto,
				selectoUnselected,
				getElementById
			}}
		>
			<VirtualGrid grid={grid}>
				{(index) => {
					const item = createMemo(() => explorer.items()?.[index]);

					return (
						<Show when={item()}>
							{(item) => (
								<GridItem
									index={index}
									item={item()}
									onMouseDown={(e) => {
										if (e.button !== 0 || !explorerView.selectable) return;

										e.stopPropagation();

										const item = grid().getItem(index);

										if (!item?.data) return;

										if (!explorer.allowMultiSelect) {
											explorer.resetSelectedItems([item.data]);
										} else {
											// selectoFirstColumn.current = item.column;
											// selectoLastColumn.current = item.column;
										}

										activeItem = item.data;
									}}
								>
									{props.children}
								</GridItem>
							)}
						</Show>
					);
				}}
			</VirtualGrid>
		</GridContext.Provider>
	);
};
