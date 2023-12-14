import { createMemo } from 'solid-js';
import { getExplorerItemData, type ExplorerItem } from '@sd/client';

import { explorerStore, flattenThumbnailKey } from './store';

export function useExplorerItemData(explorerItem: ExplorerItem) {
	const newThumbnail = () =>
		!!(
			explorerItem.thumbnail_key &&
			explorerStore.newThumbnails.has(flattenThumbnailKey(explorerItem.thumbnail_key))
		);

	return createMemo(() => {
		const itemData = getExplorerItemData(explorerItem);

		if (!itemData.hasLocalThumbnail) {
			itemData.hasLocalThumbnail = newThumbnail();
		}

		return itemData;
	});
}

export type ExplorerItemData = ReturnType<typeof useExplorerItemData>;

export const pubIdToString = (pub_id: number[]) =>
	pub_id.map((b) => b.toString(16).padStart(2, '0')).join('');

export const uniqueId = (item: ExplorerItem | { pub_id: number[] }) => {
	if ('pub_id' in item) return pubIdToString(item.pub_id);

	const { type } = item;

	switch (type) {
		case 'NonIndexedPath':
			return item.item.path;
		case 'SpacedropPeer':
			return item.item.name;
		default:
			return pubIdToString(item.item.pub_id);
	}
};
