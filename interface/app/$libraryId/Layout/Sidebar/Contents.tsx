import {
	ArrowsClockwise,
	Clock,
	Cloud,
	CopySimple,
	Eraser,
	FilmStrip,
	Heart,
	Planet
} from '@phosphor-icons/react';
import { Tag } from '@phosphor-icons/react/dist/ssr';
import { LibraryContextProvider, useClientContext, useFeatureFlag } from '@sd/client';
import { SubtleButton } from '~/components';

import { EphemeralSection } from './EphemeralSection';
import Icon from './Icon';
import { LibrarySection } from './LibrarySection';
import SidebarLink from './Link';
import Section from './Section';

export const COUNT_STYLE = `absolute right-1 min-w-[20px] top-1 flex h-[19px] px-1 items-center justify-center rounded-full border border-app-button/40 text-[9px]`;

export default () => {
	const { library } = useClientContext();

	return (
		<div className="no-scrollbar mask-fade-out flex grow flex-col space-y-5 overflow-x-hidden overflow-y-scroll pb-10 pt-3">
			<div className=" space-y-0.5">
				<Section
					name="Library"
					actionArea={
						<div className="flex items-center space-x-1">
							<SubtleButton />
						</div>
					}
				>
					<div className="space-y-0.5">
						<SidebarLink to="statistics">
							<Icon component={Planet} />
							Overview
						</SidebarLink>

						<SidebarLink to="recents">
							<Icon component={Clock} />
							Recents
							<div className={COUNT_STYLE}>34</div>
						</SidebarLink>
						<SidebarLink to="favorites">
							<Icon component={Heart} />
							Favorites
							<div className={COUNT_STYLE}>2</div>
						</SidebarLink>
						<SidebarLink to="labels">
							<Icon component={Tag} />
							Labels
							<div className={COUNT_STYLE}>642</div>
						</SidebarLink>
						{/* <SidebarLink to="imports">
							<Icon component={ArchiveBox} />
							Imports
						</SidebarLink>
						<SidebarLink to="albums">
							<RenderIcon className="mr-2 h-4 w-4 " icon="Album20" />
							Albums
							<div className={COUNT_STYLE}>14</div>
						</SidebarLink>
						<SidebarLink to="people">
							<Icon component={UserFocus} />
							People
							<div className={COUNT_STYLE}>44</div>
						</SidebarLink>
						<SidebarLink to="places">
							<Icon component={MapPin} />
							Places
							<div className={COUNT_STYLE}>78</div>
						</SidebarLink>
						<SidebarLink to="projects">
							<Icon component={Briefcase} />
							Projects
							<div className={COUNT_STYLE}>4</div>
						</SidebarLink> */}
					</div>
				</Section>

				{useFeatureFlag('syncRoute') && (
					<SidebarLink to="sync">
						<Icon component={ArrowsClockwise} />
						Sync
					</SidebarLink>
				)}

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
				{useFeatureFlag('syncRoute') ||
					(useFeatureFlag('cloud') && (
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
					))}
			</div>

			<EphemeralSection />

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
