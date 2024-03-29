import { useEffect, useRef } from 'react';
import { useRspcLibraryContext } from '@sd/client';
import { toast } from '@sd/ui';

import { useExplorerContext } from '../app/$libraryId/Explorer/Context';
import { useExplorerSearchParams } from '../app/$libraryId/Explorer/util';

export const useQuickRescan = () => {
	// subscription so that we can cancel it if in progress
	const quickRescanSubscription = useRef<() => void | undefined>();

	// gotta clean up any rescan subscriptions if the exist
	useEffect(() => () => quickRescanSubscription.current?.(), []);
	const { client } = useRspcLibraryContext();
	const explorer = useExplorerContext({ suspense: false });
	const [{ path }] = useExplorerSearchParams();

	const rescan = (id?: number) => {
		const locationId =
			id ?? (explorer?.parent?.type === 'Location' ? explorer.parent.location.id : undefined);

		if (locationId === undefined) return;

		quickRescanSubscription.current?.();
		quickRescanSubscription.current = client.addSubscription(
			[
				'locations.quickRescan',
				{
					location_id: locationId,
					sub_path: path ?? ''
				}
			],
			{ onData() {} }
		);

		toast.success({
			title: `Quick rescan started`
		});
	};

	return rescan;
};
