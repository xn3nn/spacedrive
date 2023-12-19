import { createVisibilityObserver } from '@solid-primitives/intersection-observer';
import { createVirtualizer } from '@tanstack/solid-virtual';
// import { useInView } from 'react-intersection-observer';
import * as Solid from 'solid-js';

import type { createGrid } from './createGrid';

export interface GridProps extends Omit<Solid.ComponentProps<'div'>, 'children'> {
	style?: Solid.JSX.CSSProperties;
	grid: ReturnType<typeof createGrid>;
	children: (index: number) => Solid.JSX.Element;
}

export function VirtualGrid({ grid, children, ...props }: GridProps) {
	let ref: HTMLDivElement;

	const [offset, setOffset] = Solid.createSignal(0);

	// const useVisibilityObserver = createVisibilityObserver();
	let loadMoreRef: HTMLDivElement | undefined;
	// const inView = useVisibilityObserver(() => loadMoreRef);

	const rowVirtualizer = createVirtualizer({
		get count() {
			return grid().virtualizer.rowVirtualizer.count;
		},
		getScrollElement: () => grid().virtualizer.rowVirtualizer.getScrollElement(),
		estimateSize: (index) => grid().virtualizer.rowVirtualizer.estimateSize(index),
		get scrollMargin() {
			return offset();
		}
	});

	const columnVirtualizer = createVirtualizer({
		horizontal: true,
		get count() {
			return grid().virtualizer.columnVirtualizer.count;
		},
		getScrollElement: () => grid().virtualizer.columnVirtualizer.getScrollElement(),
		estimateSize: (index) => grid().virtualizer.columnVirtualizer.estimateSize(index)
	});

	const width = Solid.createMemo(() => columnVirtualizer.getTotalSize());
	const height = Solid.createMemo(() => rowVirtualizer.getTotalSize());

	const internalWidth = () => width() - (grid().padding.left + grid().padding.right);
	const internalHeight = () => height() - (grid().padding.top + grid().padding.bottom);

	const loadMoreTriggerHeight = Solid.createMemo(() => {
		if (grid().horizontal || !grid().onLoadMore || !grid().rowCount || !grid().totalRowCount)
			return;

		if (grid().totalRowCount === grid().rowCount) return grid().loadMoreSize;

		const lastRowTop = grid().getItemRect(grid().rowCount * grid().columnCount).top;
		if (!lastRowTop) return;

		let loadMoreHeight = grid().loadMoreSize ?? 0;

		if (!loadMoreHeight && rowVirtualizer.scrollElement) {
			const offset = Math.max(
				0,
				rowVirtualizer.options.scrollMargin - rowVirtualizer.scrollOffset
			);
			loadMoreHeight = Math.max(0, rowVirtualizer.scrollElement.clientHeight - offset);
		}

		const triggerHeight = height() - lastRowTop + loadMoreHeight;

		return Math.min(height(), triggerHeight);
	});

	const loadMoreTriggerWidth = Solid.createMemo(() => {
		if (
			!grid().horizontal ||
			!grid().onLoadMore ||
			!grid().columnCount ||
			!grid().totalColumnCount
		)
			return;

		if (grid().totalColumnCount === grid().columnCount) return grid().loadMoreSize;

		const lastColumnLeft = grid().getItemRect(grid().rowCount * grid().columnCount).left;
		if (!lastColumnLeft) return;

		const loadMoreWidth =
			grid().loadMoreSize ?? columnVirtualizer.scrollElement?.clientWidth ?? 0;

		const triggerWidth = width() - lastColumnLeft + loadMoreWidth;

		return Math.min(width(), triggerWidth);
	});

	Solid.createEffect(
		Solid.on(
			() => grid().virtualItemSize.height,
			() => rowVirtualizer.measure()
		)
	);

	Solid.createEffect(
		Solid.on(
			() => grid().virtualItemSize.width,
			() => columnVirtualizer.measure()
		)
	);

	// Solid.createEffect(() => {
	// 	if (inView()) grid().onLoadMore?.();
	// });

	// Solid.createEffect(() => {
	// 	const element = grid().scrollRef();
	// 	if (!element) return;

	// 	const observer = new MutationObserver(() => setOffset(ref?.offsetTop ?? 0));

	// 	observer.observe(element, {
	// 		childList: true
	// 	});

	// 	return () => observer.disconnect();
	// });

	// Solid.createEffect(() => setOffset(ref?.offsetTop ?? 0), []);

	Solid.createEffect(() =>
		console.log({
			row: rowVirtualizer.getVirtualItems(),
			column: columnVirtualizer.getVirtualItems(),
			virtualizer: grid().virtualizer
		})
	);

	return (
		<div
			{...props}
			ref={ref!}
			style={{
				...props.style,
				position: 'relative',
				width: `${width()}px`,
				height: `${height()}px`
			}}
		>
			<Solid.Show when={internalWidth() > 0 || internalHeight() > 0}>
				<div
					ref={loadMoreRef}
					style={{
						position: 'absolute',
						height: !grid().horizontal ? loadMoreTriggerHeight()?.toString() : '100%',
						width: grid().horizontal ? loadMoreTriggerWidth()?.toString() : '100%',
						bottom: !grid().horizontal ? 0 : undefined,
						right: grid().horizontal ? 0 : undefined,
						display: !grid().onLoadMore ? 'none' : undefined
					}}
				/>

				<Solid.For each={rowVirtualizer.getVirtualItems()}>
					{(virtualRow) => (
						<Solid.For each={columnVirtualizer.getVirtualItems()}>
							{(virtualColumn) => {
								const index = Solid.createMemo(() => {
									let index = grid().horizontal
										? virtualColumn.index * grid().rowCount + virtualRow.index
										: virtualRow.index * grid().columnCount +
										  virtualColumn.index;

									if (grid().invert) index = grid().count - 1 - index;

									if (index >= grid().count || index < 0) return null;
									return { value: index };
								});

								return (
									<Solid.Show when={index()}>
										{(index) => (
											<div
												data-index={index().value}
												style={{
													'position': 'absolute',
													'top': 0,
													'left': 0,
													'width': `${virtualColumn.size}px`,
													'height': `${virtualRow.size}px`,
													'transform': `translateX(${
														virtualColumn.start
													}px) translateY(${
														virtualRow.start -
														rowVirtualizer.options.scrollMargin
													}px)`,
													'padding-left':
														virtualColumn.index !== 0
															? grid().gap.x.toString()
															: 0,
													'padding-top':
														virtualRow.index !== 0
															? grid().gap.y.toString()
															: 0
												}}
											>
												<div
													style={{
														margin: 'auto',
														width:
															`${grid().itemSize.width?.toString()}px` ??
															'100%',
														height:
															`${grid().itemSize.height?.toString()}px` ??
															'100%'
													}}
												>
													{children(index().value)}
												</div>
											</div>
										)}
									</Solid.Show>
								);
							}}
						</Solid.For>
					)}
				</Solid.For>
			</Solid.Show>
		</div>
	);
}
