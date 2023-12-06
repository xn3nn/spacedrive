import './CMDK.css';
import './CMDK.scss';

import clsx from 'clsx';
import { useState } from 'react';
import CommandPalette, { filterItems, getItemIndex, JsonStructure } from 'react-cmdk';
import { arraysEqual, useLibraryQuery, useOnlineLocations } from '@sd/client';
import { CheckBox } from '@sd/ui';
import { Icon } from '~/components';
import Sparkles from '~/components/Sparkles';

const CMDK = (props: { open: boolean; setOpen: (open: boolean) => void }) => {
	const [page, setPage] = useState<'root' | 'actions'>('root');
	const [search, setSearch] = useState('');

	const locationsQuery = useLibraryQuery(['locations.list'], { keepPreviousData: true });
	const onlineLocations = useOnlineLocations();

	function handleClose(open: boolean) {
		props.setOpen(open);
		// Reset page after closing
		setPage('root');
	}

	const filteredItems = filterItems(
		[
			{
				heading: 'Locations',
				id: 'locations',
				items: locationsQuery.data
					? locationsQuery.data.map((location) => ({
							id: location.id,
							children: location.name,
							icon: () => (
								<div className="relative -mt-0.5 mr-1 shrink-0 grow-0">
									<Icon name="Folder" size={22} />
									<div
										className={clsx(
											'absolute bottom-0.5 right-0 h-1.5 w-1.5 rounded-full',
											onlineLocations.some((l) =>
												arraysEqual(location.pub_id, l)
											)
												? 'bg-green-500'
												: 'bg-red-500'
										)}
									/>
								</div>
							),
							href: `#`
					  }))
					: ([] as any)
			}
			// {
			// 	heading: 'Actions',
			// 	id: 'actions',
			// 	items: [
			// 		{
			// 			id: 'new-folder',
			// 			children: 'New folder',
			// 			icon: 'FolderPlusIcon',
			// 			onClick: () => {}
			// 		},
			// 		{
			// 			id: 'new-tag',
			// 			children: 'New tag',
			// 			icon: 'TagIcon',
			// 			onClick: () => {}
			// 		}
			// 	]
			// }
		],
		search
	);

	const paletteItems: JsonStructure = [
		// These items will always be shown on top of the list
		{
			// heading: 'Home',
			id: 'top',
			items: [
				{
					id: 'ask-anything',
					children: '✨ Ask anything',

					closeOnSelect: false,
					onClick: () => setPage('actions')
				}
			]
		},
		...filteredItems
	];

	return (
		<CommandPalette
			onChangeSearch={setSearch}
			onChangeOpen={handleClose}
			search={search}
			isOpen={props.open}
			page={page}
			placeholder="Search for files and actions..."
			// footer
		>
			<CommandPalette.Page id="root">
				{paletteItems.length ? (
					paletteItems.map((list) => (
						<CommandPalette.List key={list.id} heading={list.heading}>
							{list.items.map(({ id, ...rest }) => (
								<CommandPalette.ListItem
									key={id}
									index={getItemIndex(paletteItems, id)}
									{...rest}
								/>
							))}
						</CommandPalette.List>
					))
				) : (
					<CommandPalette.FreeSearchAction />
				)}
			</CommandPalette.Page>

			<CommandPalette.Page id="actions">
				<CommandPalette.List>
					<div className="space-y-4 p-4">
						<div className="flex items-center space-x-2 pt-2">
							<CheckBox className="!mt-0" />
							<p className="text-sm text-ink">Enable Action A</p>
						</div>
						<div className="flex items-center space-x-2 pt-2">
							<CheckBox className="!mt-0" />
							<p className="text-sm text-ink">Enable Action B</p>
						</div>
						<div className="flex items-center space-x-2 pt-2">
							<CheckBox className="!mt-0" />
							<p className="text-sm text-ink">Enable Action C</p>
						</div>
						<div className="flex items-center space-x-2 pt-2">
							<CheckBox className="!mt-0" />
							<p className="text-sm text-ink">Enable Action D</p>
						</div>
					</div>
				</CommandPalette.List>
			</CommandPalette.Page>
		</CommandPalette>
	);
};

export default CMDK;
