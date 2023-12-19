import { createElementSize, createResizeObserver } from '@solid-primitives/resize-observer';
import { type createVirtualizer } from '@tanstack/solid-virtual';
import * as Core from '@virtual-grid/core';
import { createEffect, createMemo, createSignal, onMount, type Accessor } from 'solid-js';
import { createStore } from 'solid-js/store';

type VirtualizerOptions = Parameters<typeof createVirtualizer>[0];

export type CreateGridProps<IdT extends Core.GridItemId, DataT extends Core.GridItemData> = (
	| Core.BaseGridProps<IdT, DataT>
	| Core.AutoColumnsGridProps<IdT, DataT>
	| Core.HorizontalGridProps<IdT, DataT>
) & {
	/**
	 * Reference to scrollable element.
	 */
	scrollRef: Accessor<Element | null>;

	/**
	 * Row virtualizer options.
	 */
	rowVirtualizer?: Partial<VirtualizerOptions>;
	/**
	 * Column virtualizer options.
	 */
	columnVirtualizer?: Partial<VirtualizerOptions>;
	/**
	 * Renders an area which triggers `onLoadMore` when scrolled into view.
	 */
	onLoadMore?: () => void;
	/**
	 * Set the size of the load more area.
	 */
	loadMoreSize?: number;
	/**
	 * The number of items to render beyond the visible area.
	 */
	overscan?: number;
};

export function createGrid<IdT extends Core.GridItemId, DataT extends Core.GridItemData>(
	props: Accessor<CreateGridProps<IdT, DataT>>
) {
	const [width, setWidth] = createSignal(0);

	let staticWidth: number | null = null;

	const grid = createMemo(() => Core.grid({ width: width(), ...props() }));

	const [rowVirtualizer, setRowVirtualizer] = createStore<VirtualizerOptions>({
		...props().rowVirtualizer,
		count: grid().totalRowCount,
		getScrollElement: props().scrollRef,
		estimateSize: grid().getItemHeight,
		paddingStart: grid().padding.top,
		paddingEnd: grid().padding.bottom,
		overscan: props().overscan ?? props().rowVirtualizer?.overscan
	});

	createEffect(() => {
		setRowVirtualizer({
			...props().rowVirtualizer,
			count: grid().totalRowCount,
			getScrollElement: props().scrollRef,
			estimateSize: grid().getItemHeight,
			paddingStart: grid().padding.top,
			paddingEnd: grid().padding.bottom,
			overscan: props().overscan ?? props().rowVirtualizer?.overscan
		});
	});

	const [columnVirtualizer, setColumnVirtualizer] = createStore<VirtualizerOptions>({
		...props().columnVirtualizer,
		horizontal: true,
		count: grid().totalColumnCount,
		getScrollElement: props().scrollRef,
		estimateSize: grid().getItemWidth,
		paddingStart: grid().padding.left,
		paddingEnd: grid().padding.right,
		overscan: props().overscan ?? props().columnVirtualizer?.overscan
	});

	createEffect(() => {
		setColumnVirtualizer({
			...props().columnVirtualizer,
			horizontal: true,
			count: grid().totalColumnCount,
			getScrollElement: props().scrollRef,
			estimateSize: grid().getItemWidth,
			paddingStart: grid().padding.left,
			paddingEnd: grid().padding.right,
			overscan: props().overscan ?? props().columnVirtualizer?.overscan
		});
	});

	const isStatic = createMemo(
		() =>
			props().width !== undefined ||
			props().horizontal ||
			props().columns === 0 ||
			(props().columns === 'auto'
				? !props().size || (typeof props().size === 'object' && !props().size.width)
				: (props().columns === undefined || props().columns) &&
				  ((typeof props().size === 'object' && props().size.width) ||
						typeof props().size === 'number'))
	);

	createResizeObserver(
		() => props().scrollRef(),
		({ width }) => {
			if (width === undefined || isStatic()) {
				if (width !== undefined) staticWidth = width;
				return;
			}
			setWidth(width);
		}
	);

	createEffect(() => {
		if (staticWidth === null || width() === staticWidth || isStatic()) return;
		setWidth(staticWidth);
		staticWidth = null;
	});

	return createMemo(() => ({
		...grid(),
		scrollRef: props().scrollRef,
		onLoadMore: props().onLoadMore,
		loadMoreSize: props().loadMoreSize,
		virtualizer: {
			rowVirtualizer,
			columnVirtualizer
		}
	}));
}
