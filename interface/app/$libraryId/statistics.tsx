import { Lock, LockSimple } from '@phosphor-icons/react';
import {
	Drive,
	DriveAmazonS3,
	DriveDropbox,
	DriveGoogleDrive,
	HDD,
	Laptop,
	Mobile,
	SD,
	Server,
	SilverBox
} from '@sd/assets/icons';
import { ReactComponent as Ellipsis } from '@sd/assets/svgs/ellipsis.svg';
import { useEffect, useMemo, useState } from 'react';
import { byteSize } from '@sd/client';
import { Button, Card, CircularProgress, ScreenHeading, tw } from '@sd/ui';

import { InfoPill } from './Explorer/Inspector';
import { TopBarPortal } from './TopBar/Portal';

type StatisticItemProps = {
	name: string;
	icon: string;
	total_space: string;
	free_space: string;
	color: string;
	connection_type: 'p2p' | 'proxy' | 'cloud';
};

const Pill = tw.div`px-1.5 py-[1px] rounded text-tiny font-medium text-ink-dull bg-app-box border border-app-line`;

const StatisticItem = ({ icon, name, connection_type, ...stats }: StatisticItemProps) => {
	const [mounted, setMounted] = useState(false);

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
		<Card className="flex max-w-[280px] flex-col bg-app-box/50 !p-0">
			<div className="flex flex-row items-center justify-center gap-5 p-4">
				<CircularProgress
					radius={40}
					progress={progress}
					strokeWidth={6}
					trackStrokeWidth={6}
					strokeColor={progress > 90 ? '#E14444' : '#2599FF'}
					fillColor="transparent"
					trackStrokeColor="#252631"
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
				<Pill>{connection_type}</Pill>
				<div className="grow" />
				<Button size="icon" variant="outline">
					<LockSimple weight="fill" className="h-3 w-3 opacity-50" />
				</Button>
				<Button size="icon" variant="outline">
					<Ellipsis className="h-3 w-3 opacity-50" />
				</Button>
			</div>
		</Card>
	);
};

export const Component = () => {
	return (
		<div className="m-8">
			<TopBarPortal
				left={
					<div className="flex gap-2">
						<span className="font-medium">Statistics</span>
						<Button className="!p-[5px]" variant="subtle">
							<Ellipsis className="h-3 w-3" />
						</Button>
					</div>
				}
			/>

			<div className="mb-2 font-bold">Devices</div>
			<div className=" grid grid-cols-4 gap-3">
				<StatisticItem
					name="Jam Macbook Pro"
					icon={Laptop}
					total_space="1074877906944"
					free_space="121026553275"
					color="#0362FF"
					connection_type="p2p"
				/>
				<StatisticItem
					name="Spacestudio"
					icon={SilverBox}
					total_space="4098046511104"
					free_space="969004651119"
					color="#0362FF"
					connection_type="proxy"
				/>
				<StatisticItem
					name="Jamie's iPhone"
					icon={Mobile}
					total_space="500046511104"
					free_space="39006511104"
					color="#0362FF"
					connection_type="proxy"
				/>
				<StatisticItem
					name="Titan NAS"
					icon={Server}
					total_space="60000046511104"
					free_space="43000046511104"
					color="#0362FF"
					connection_type="proxy"
				/>
			</div>
			<div className="mb-2 mt-8 font-bold">Clouds</div>
			<div className=" grid grid-cols-4 gap-3">
				<StatisticItem
					name="James Pine"
					icon={DriveDropbox}
					total_space="1074877906944"
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
			</div>
			<div className="mb-2 mt-8 font-bold">Local Volumes</div>
			<div className=" grid grid-cols-4 gap-3">
				<StatisticItem
					name="Macintosh HD"
					icon={HDD}
					total_space="1074877906944"
					free_space="174877906944"
					color="#0362FF"
					connection_type="cloud"
				/>
				<StatisticItem
					name="Cannon 128gb"
					icon={SD}
					total_space="124877906944"
					free_space="124877906944"
					color="#0362FF"
					connection_type="cloud"
				/>
				<StatisticItem
					name="A001"
					icon={Drive}
					total_space="124877906944"
					free_space="104877906944"
					color="#0362FF"
					connection_type="cloud"
				/>
			</div>
		</div>
	);
};
