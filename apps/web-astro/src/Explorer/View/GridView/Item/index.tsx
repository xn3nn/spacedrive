import clsx from 'clsx';
import { createMemo, Show } from 'solid-js';
import { byteSize, getItemFilePath, type ExplorerItem } from '@sd/client';

import { FileThumb } from '../../../FilePath/Thumb';
import { RenamableItemText } from '../../RenameItemText';
import { ViewItem } from '../../ViewItem';
import { GridViewItemContext, useGridViewItemContext } from './Context';

export interface GridViewItemProps {
	data: ExplorerItem;
	selected: boolean;
	cut: boolean;
}

export function GridViewItem(props: GridViewItemProps) {
	const filePath = () => getItemFilePath(props.data);

	// const isHidden = filePath?.hidden;
	// const isFolder = filePath?.is_dir;
	// const isLocation = props.data.type === 'Location';

	return (
		<GridViewItemContext.Provider value={props}>
			<ViewItem
				data={props.data}
				class={clsx('h-full w-full', filePath()?.hidden && 'opacity-50')}
			>
				{/* <ExplorerDroppable
					droppable={{
						data: { type: 'explorer-item', data: props.data },
						disabled: (!isFolder && !isLocation) || props.selected
					}}
				> */}
				<InnerDroppable />
				{/* </ExplorerDroppable> */}
			</ViewItem>
		</GridViewItemContext.Provider>
	);
}

const InnerDroppable = () => {
	const item = useGridViewItemContext();
	// const { isDroppable } = useExplorerDroppableContext();

	return (
		<>
			<div
				class={clsx(
					'mb-1 aspect-square rounded-lg',
					item.selected &&
						// || isDroppable
						'bg-app-selectedItem'
				)}
			>
				<ItemFileThumb />
			</div>

			{/* <ExplorerDraggable draggable={{ data: item.data }}> */}
			<RenamableItemText
				item={item.data}
				style={{ maxHeight: 40, textAlign: 'center' }}
				lines={2}
				// highlight={isDroppable}
				selected={item.selected}
			/>
			<ItemSize />
			{/* </ExplorerDraggable> */}
		</>
	);
};

function ItemFileThumb() {
	const item = useGridViewItemContext();

	return (
		<FileThumb
			data={item.data}
			frame
			blackBars
			extension
			className={clsx('px-2 py-1', item.cut && 'opacity-60')}
			// ref={setDraggableRef}
			// childProps={{
			// 	style,
			// 	...attributes,
			// 	...listeners
			// }}
		/>
	);
}

function ItemSize() {
	const item = useGridViewItemContext();
	// const { showBytesInGridView } = useExplorerContext().useSettingsSnapshot();
	// const { isRenaming } = useExplorerStore();

	const filePath = createMemo(() => getItemFilePath(item.data));

	const showSize = createMemo(() => {
		const isLocation = item.data.type === 'Location';
		const isEphemeral = item.data.type === 'NonIndexedPath';
		const isFolder = filePath()?.is_dir;

		return (
			// showBytesInGridView &&
			filePath()?.size_in_bytes_bytes &&
			!isLocation &&
			!isFolder &&
			(!isEphemeral || !isFolder)
			// &&
			// (!isRenaming || !item.selected)
		);
	});

	const bytes = createMemo(() => showSize() && byteSize(filePath()?.size_in_bytes_bytes));

	return (
		<Show when={bytes()}>
			{(bytes) => (
				<div class="truncate rounded-md px-1.5 py-[1px] text-center text-tiny text-ink-dull">
					{bytes().toString()}
				</div>
			)}
		</Show>
	);
}
