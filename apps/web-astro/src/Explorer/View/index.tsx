import { createSignal } from 'solid-js';

import { useExplorerContext } from '../Context';
import { ViewContext } from './Context';
import { GridView } from './GridView';

export function View() {
	const explorer = useExplorerContext();

	let [ref, setRef] = createSignal<HTMLDivElement>();

	return (
		<ViewContext.Provider
			value={{
				ref,
				// , ...contextProps,
				selectable: true
			}}
		>
			<div
				ref={setRef}
				class="flex flex-1"
				onMouseDown={(e) => {
					if (e.button === 2 || (e.button === 0 && e.shiftKey)) return;
					explorer.selectedItems().size !== 0 && explorer.resetSelectedItems();
				}}
			>
				<div
					// ref={setDroppableRef}
					class="h-full w-full"
				>
					<GridView />
				</div>
			</div>
		</ViewContext.Provider>
	);
}
