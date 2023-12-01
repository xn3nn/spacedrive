import { X } from '@phosphor-icons/react';
import { Grid, useGrid } from '@virtual-grid/react';
import { memo, useEffect, useRef, useState } from 'react';
import { byteSize, ExplorerItem, getExplorerItemData, getItemFilePath } from '@sd/client';
import { Button, ProgressBar } from '@sd/ui';

import { useExplorerContext } from '../Context';
import { FileThumb } from '../FilePath/Thumb';

type Item = { item: ExplorerItem; size: number; progress: number };

export const CopyProgress = () => {
	const explorer = useExplorerContext();

	const [[items], setItems] = useState<[Map<number, Item>]>([new Map()]);

	const scrollRef = useRef<HTMLDivElement>(null);

	const grid = useGrid({ scrollRef, count: items.size, size: { height: 80 } });

	useEffect(() => {
		if (items.size !== 0 || !explorer.items || explorer.items.length === 0) return;
		setItems([
			new Map(
				explorer.items.slice(0, 10).map((item, i) => {
					const filePath = getItemFilePath(item);
					const size = filePath?.size_in_bytes_bytes;
					return [
						i,
						{
							item,
							size: size
								? Number(byteSize(size).original)
								: Math.floor(Math.random() * 1000000),
							progress: 0
						}
					];
				})
			)
		]);
	}, [explorer.items, items.size]);

	useEffect(() => {
		const interval = setInterval(() => {
			let finished = 0;
			let change = false;

			const updated = [...items].map(([i, item]) => {
				let progress = item.progress;

				if (progress === item.size) {
					finished++;
					return [i, item] as const;
				}

				if (Math.random() < 0.5) {
					let difference = item.size - item.progress;
					if (item.progress <= item.size / 2) difference = difference / 2;
					progress += Math.floor(Math.random() * difference) + 1;
					change = true;
				}

				if (progress === item.size) finished++;
				return [i, { ...item, progress }] as const;
			});

			if (finished === items.size) clearInterval(interval);
			if (change) setItems([new Map(updated)]);
		}, 750);

		return () => clearInterval(interval);
	}, [items]);

	return (
		<div className="fixed bottom-12 right-4 z-50 w-96 overflow-hidden rounded-md border border-app-line bg-app/95 backdrop-blur">
			<div className="flex items-center justify-between rounded-b-md border-b border-app-line/50 bg-app-darkBox px-3 py-2 shadow-md">
				<h2 className="text-sm font-medium">Copying</h2>
				<Button size="icon" onClick={() => setItems([new Map()])}>
					<X />
				</Button>
			</div>

			<div ref={scrollRef} className="h-full max-h-96 overflow-auto">
				<Grid grid={grid}>
					{(index) => {
						const item = items.get(index);
						if (!item) return null;

						return (
							<div key={index} className="flex h-full w-full items-center px-4">
								<Thumb item={item.item} />
								<div className="flex w-full flex-col overflow-hidden">
									<span className="max-w-[90%] truncate text-sm font-medium">
										{getExplorerItemData(item.item).fullName}
									</span>
									<span className="mb-1.5 text-xs text-ink-dull">
										{`${byteSize(item.progress)}`} / {`${byteSize(item.size)}`}
										{item.progress === 0
											? ' - Waiting'
											: item.progress < item.size
											? ' - Copying'
											: ' - Done'}
									</span>
									<ProgressBar
										pending={item.progress === 0}
										value={item.progress}
										total={item.size}
									/>
								</div>
							</div>
						);
					}}
				</Grid>
			</div>
		</div>
	);
};

const Thumb = memo(({ item }: { item: ExplorerItem }) => {
	return (
		<FileThumb
			data={item}
			className="mr-4"
			frame
			blackBars
			frameClassName="!border"
			size={40}
		/>
	);
});
