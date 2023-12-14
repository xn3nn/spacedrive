import { createEffect, createMemo, onMount, type ComponentProps } from 'solid-js';
import { type ExplorerItem } from '@sd/client';

import type { RenderItem } from '.';
import { useExplorerContext } from '../../Context';
import { explorerStore, isCut } from '../../store';
import { uniqueId } from '../../util';
import { useExplorerViewContext } from '../Context';
import { useGridContext } from './context';

interface Props extends Omit<ComponentProps<'div'>, 'children'> {
	index: number;
	item: ExplorerItem;
	children: RenderItem;
}

export const GridItem = (props: Props) => {
	const grid = useGridContext();
	const explorer = useExplorerContext();
	const explorerView = useExplorerViewContext();

	const itemId = createMemo(() => uniqueId(props.item));

	const selected = createMemo(
		// Even though this checks object equality, it should still be safe since `selectedItems`
		// will be re-calculated before this memo runs.
		() => explorer.selectedItems().has(props.item)
	);

	const cut = createMemo(() => isCut(props.item, explorerStore.cutCopyState));

	onMount(() => {
		// if (!grid.selecto?.current || !grid.selectoUnselected.current.has(itemId)) return;

		if (!selected) {
			grid.selectoUnselected.delete(itemId());
			return;
		}

		const element = grid.getElementById(itemId());

		if (!element) return;

		grid.selectoUnselected.delete(itemId());
		// grid.selecto.current.setSelectedTargets([
		// 	...grid.selecto.current.getSelectedTargets(),
		// 	element as HTMLElement
		// ]);

		// eslint-disable-next-line react-hooks/exhaustive-deps
	});

	createEffect(() => {
		// if (!grid.selecto) return;

		selected();

		return () => {
			const element = grid.getElementById(itemId());
			if (selected() && !element) grid.selectoUnselected.add(itemId());
		};
	});

	return (
		<div
			{...props}
			class="h-full w-full"
			data-selectable=""
			data-selectable-index={props.index}
			data-selectable-id={itemId}
			onContextMenu={(e) => {
				if (explorerView.selectable && !explorer.selectedItems().has(props.item)) {
					explorer.resetSelectedItems([props.item]);
					// grid.selecto?.current?.setSelectedTargets([e.currentTarget]);
				}
			}}
		>
			<props.children item={props.item} selected={selected()} cut={cut()} />
		</div>
	);
};
