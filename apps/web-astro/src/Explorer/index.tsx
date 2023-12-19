import { type JSX } from 'solid-js';

import { useExplorerContext } from './Context';
import { View } from './View';

export function Explorer() {
	const explorer = useExplorerContext();

	return (
		<div
			ref={explorer.setScrollRef}
			class="custom-scroll explorer-scroll flex flex-1 flex-col overflow-x-hidden"
			style={
				{
					// '--scrollbar-margin-top': `${topBar.topBarHeight}px`,
					// '--scrollbar-margin-bottom': `${showPathBar ? PATH_BAR_HEIGHT : 0}px`,
					// paddingTop: topBar.topBarHeight
					// 'paddingRight': explorerStore.showInspector ? INSPECTOR_WIDTH : 0
				} as JSX.CSSProperties
			}
		>
			{/* {explorer.items && explorer.items.length > 0 && <DismissibleNotice />} */}

			<View
			// contextMenu={props.contextMenu ? props.contextMenu() : <ContextMenu />}
			// emptyNotice={
			// 	props.emptyNotice ?? (
			// 		<EmptyNotice icon={FolderNotchOpen} message="This folder is empty" />
			// 	)
			// }
			// listViewOptions={{ hideHeaderBorder: true }}
			// bottom={showPathBar ? PATH_BAR_HEIGHT : undefined}
			/>
		</div>
	);
}
