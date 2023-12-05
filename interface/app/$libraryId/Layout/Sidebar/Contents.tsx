import {
	ArchiveBox,
	ArrowsClockwise,
	Briefcase,
	ChartDonut,
	Circuitry,
	ClipboardText,
	Clock,
	Cloud,
	CopySimple,
	Cpu,
	Crosshair,
	Eraser,
	FaceMask,
	FilmStrip,
	Heart,
	Images,
	MapPin,
	Planet,
	User,
	UserCircle,
	UserFocus
} from '@phosphor-icons/react';
import { Tag } from '@phosphor-icons/react/dist/ssr';
import { Album20 } from '@sd/assets/icons';
import { useNavigate } from 'react-router';
import { LibraryContextProvider, useClientContext, useFeatureFlag } from '@sd/client';
import { Tooltip } from '@sd/ui';
import { useKeysMatcher, useShortcut } from '~/hooks';

import { RenderIcon } from '../../Search/util';
import { EphemeralSection } from './EphemeralSection';
import Icon from './Icon';
import { LibrarySection } from './LibrarySection';
import SidebarLink from './Link';
import Section from './Section';

export default () => {
	const { library } = useClientContext();
	const navigate = useNavigate();
	const symbols = useKeysMatcher(['Meta', 'Shift']);

	// useShortcut('navToOverview', (e) => {
	// 	e.stopPropagation();
	// 	navigate('overview');
	// });

	return (
		<div className="no-scrollbar mask-fade-out flex grow flex-col space-y-5 overflow-x-hidden overflow-y-scroll pb-10">
			<div className="space-y-0.5">
				<SidebarLink to="statistics">
					<Icon component={ChartDonut} />
					Statistics
				</SidebarLink>
			</div>
			{useFeatureFlag('syncRoute') && (
				<SidebarLink to="sync">
					<Icon component={ArrowsClockwise} />
					Sync
				</SidebarLink>
			)}
			<div className="space-y-0.5">
				{useFeatureFlag('syncRoute') && (
					<SidebarLink to="sync">
						<Icon component={ArrowsClockwise} />
						Sync
					</SidebarLink>
				)}
				{useFeatureFlag('cloud') && (
					<SidebarLink to="cloud">
						<Icon component={Cloud} />
						Cloud
					</SidebarLink>
				)}
			</div>

			<EphemeralSection />
			<Section name="Library">
				<div className="space-y-0.5">
					<SidebarLink to="recents">
						<Icon component={Clock} />
						Recents
					</SidebarLink>
					<SidebarLink to="favorites">
						<Icon component={Heart} />
						Favorites
					</SidebarLink>
					<SidebarLink to="imports">
						<Icon component={ArchiveBox} />
						Imports
					</SidebarLink>

					<SidebarLink to="albums">
						<RenderIcon className="mr-2 h-4 w-4 " icon="Album20" />
						Albums
					</SidebarLink>
					<SidebarLink to="labels">
						<Icon component={Tag} />
						Labels
					</SidebarLink>
					<SidebarLink to="people">
						<Icon component={UserFocus} />
						People
					</SidebarLink>
					<SidebarLink to="places">
						<Icon component={MapPin} />
						Places
					</SidebarLink>
					<SidebarLink to="projects">
						<Icon component={Briefcase} />
						Projects
					</SidebarLink>
					{/* <SidebarLink to="models">
						<Icon component={Cpu} />
						Models
					</SidebarLink> */}
				</div>
			</Section>

			{library && (
				<LibraryContextProvider library={library}>
					<LibrarySection />
				</LibraryContextProvider>
			)}
			<Section name="Tools">
				<SidebarLink to="duplicate-finder">
					<Icon component={CopySimple} />
					Duplicates
				</SidebarLink>
				<SidebarLink to="media-encoder">
					<Icon component={FilmStrip} />
					File Converter
				</SidebarLink>
				<SidebarLink to="cache-cleaner">
					<Icon component={Eraser} />
					Cache Cleaner
				</SidebarLink>
			</Section>
			<div className="grow" />
		</div>
	);
};
