import {
	DriveAmazonS3,
	DriveDropbox,
	DriveGoogleDrive,
	Laptop,
	Mobile,
	Server,
	SilverBox,
	Tablet
} from '@sd/assets/icons';
import { ReactComponent as Ellipsis } from '@sd/assets/svgs/ellipsis.svg';
import clsx from 'clsx';
import { useEffect, useMemo, useState } from 'react';
import { byteSize, useDiscoveredPeers, useLibraryQuery, useNodes } from '@sd/client';
import { Button, Card, CircularProgress, tw } from '@sd/ui';

import { useIsDark } from '../../../hooks';
import { TopBarPortal } from '../TopBar/Portal';
import FileKindStatistics from './FileKindStatistics';
import { HorizontalScroll } from './HorizontalScroll';

type StatisticItemProps = {
	name: string;
	icon: string;
	total_space: string;
	free_space: string;
	color: string;
	connection_type: 'lan' | 'p2p' | 'cloud';
};

const Pill = tw.div`px-1.5 py-[1px] rounded text-tiny font-medium text-ink-dull bg-app-box border border-app-line`;

const StatisticItem = ({ icon, name, connection_type, ...stats }: StatisticItemProps) => {
	const [mounted, setMounted] = useState(false);

	const isDark = useIsDark();

	const { total_space, free_space, remaining_space } = useMemo(() => {
		return {
			total_space: byteSize(stats.total_space),
			free_space: byteSize(stats.free_space),
			remaining_space: byteSize(Number(stats.total_space) - Number(stats.free_space))
		};
	}, [stats]);

	useEffect(() => {
		setMounted(true);
	}, []);

	const progress = useMemo(() => {
		if (!mounted) return 0;
		return Math.floor(
			((Number(total_space.original) - Number(free_space.original)) /
				Number(total_space.original)) *
				100
		);
	}, [total_space, free_space, mounted]);

	return (
		<Card className="flex max-w-[280px] flex-col bg-app-box/50 !p-0 ">
			<div className="flex flex-row items-center justify-center gap-5 p-4 px-8 ">
				<CircularProgress
					radius={40}
					progress={progress}
					strokeWidth={6}
					trackStrokeWidth={6}
					strokeColor={progress > 90 ? '#E14444' : '#2599FF'}
					fillColor="transparent"
					trackStrokeColor={isDark ? '#252631' : '#efefef'}
					strokeLinecap="square"
					className="flex items-center justify-center"
					transition="stroke-dashoffset 1s ease 0s, stroke 1s ease"
				>
					<div className="absolute text-lg font-semibold">
						{remaining_space.value}
						<span className="ml-0.5 text-tiny opacity-60">{remaining_space.unit}</span>
					</div>
				</CircularProgress>
				<div className="flex flex-col">
					<img src={icon} className="h-16 w-16" />
					<span className="truncate font-medium">{name}</span>
					<span className="mt-1 truncate text-tiny text-ink-faint">
						{free_space.value}
						{free_space.unit} free of {total_space.value}
						{total_space.unit}
					</span>
				</div>
			</div>
			<div className="flex h-10 flex-row items-center gap-1.5  border-t border-app-line px-2">
				<Pill className="uppercase">{connection_type}</Pill>
				<div className="grow" />
				<Button size="icon" variant="outline">
					<Ellipsis className="h-3 w-3 opacity-50" />
				</Button>
			</div>
		</Card>
	);
};

export const Component = () => {
	const stats = useLibraryQuery(['library.statistics'], {
		refetchOnWindowFocus: false,
		initialData: { total_bytes_capacity: '0', library_db_size: '0' }
	});
	const locations = useLibraryQuery(['locations.list'], {
		refetchOnWindowFocus: false
	});
	useNodes(locations.data?.nodes);

	const discoveredPeers = useDiscoveredPeers();

	const libraryTotals = useMemo(() => {
		if (locations.data && discoveredPeers) {
			const capacity = byteSize(stats.data?.total_bytes_capacity);
			const free_space = byteSize(stats.data?.total_bytes_free);
			const db_size = byteSize(stats.data?.library_db_size);
			const preview_media = byteSize(stats.data?.preview_media_bytes);

			return { capacity, free_space, db_size, preview_media };
		}
	}, [locations, discoveredPeers, stats]);

	return (
		<div>
			<TopBarPortal
				left={
					<div className="flex items-center gap-2">
						<span className="truncate text-sm font-medium">Overview</span>
						<Button className="!p-[5px]" variant="subtle">
							<Ellipsis className="h- w-3 opacity-50" />
						</Button>
					</div>
				}
			/>
			<div className="mt-4 flex flex-col gap-3">
				<OverviewSection title="File Kinds">
					<FileKindStatistics />
				</OverviewSection>
				<OverviewSection count={8} title="Devices">
					<StatisticItem
						name="Jam Macbook Pro"
						icon={Laptop}
						total_space="1074077906944"
						free_space="121006553275"
						color="#0362FF"
						connection_type="lan"
					/>
					<StatisticItem
						name="Spacestudio"
						icon={SilverBox}
						total_space="4098046511104"
						free_space="969004651119"
						color="#0362FF"
						connection_type="p2p"
					/>
					<StatisticItem
						name="Jamie's iPhone"
						icon={Mobile}
						total_space="500046511104"
						free_space="39006511104"
						color="#0362FF"
						connection_type="p2p"
					/>
					<StatisticItem
						name="Titan NAS"
						icon={Server}
						total_space="60000046511104"
						free_space="43000046511104"
						color="#0362FF"
						connection_type="p2p"
					/>
					<StatisticItem
						name="Jamie's iPad"
						icon={Tablet}
						total_space="1074077906944"
						free_space="121006553275"
						color="#0362FF"
						connection_type="lan"
					/>
					<StatisticItem
						name="Jamie's Air"
						icon={Laptop}
						total_space="4098046511104"
						free_space="969004651119"
						color="#0362FF"
						connection_type="p2p"
					/>
				</OverviewSection>

				<OverviewSection count={3} title="Cloud Drives">
					<StatisticItem
						name="James Pine"
						icon={DriveDropbox}
						total_space="104877906944"
						free_space="074877906944"
						color="#0362FF"
						connection_type="cloud"
					/>
					<StatisticItem
						name="Spacedrive S3"
						icon={DriveAmazonS3}
						total_space="1074877906944"
						free_space="704877906944"
						color="#0362FF"
						connection_type="cloud"
					/>
					<StatisticItem
						name="Jamie Pine"
						icon={DriveGoogleDrive}
						total_space="1374877906944"
						free_space="174877906944"
						color="#0362FF"
						connection_type="cloud"
					/>
				</OverviewSection>
			</div>
		</div>
	);
};

const COUNT_STYLE = `min-w-[20px] flex h-[20px] px-1 items-center justify-center rounded-full border border-app-button/40 text-[9px]`;

const OverviewSection = ({
	children,
	title,
	className,
	count
}: React.HTMLAttributes<HTMLDivElement> & { title?: string; count?: number }) => {
	return (
		<div className={clsx('group w-full', className)}>
			{title && (
				<div className="mb-3 flex w-full items-center gap-3 pl-8 pr-4">
					<div className="font-bold">{title}</div>
					{count && <div className={COUNT_STYLE}>{count}</div>}
					<Button
						className="!p-[5px] opacity-0 transition-opacity group-hover:opacity-100"
						size="icon"
						variant="subtle"
					>
						<Ellipsis className="h-3 w-3 text-ink-faint " />
					</Button>
				</div>
			)}
			<HorizontalScroll>{children}</HorizontalScroll>
		</div>
	);
};
