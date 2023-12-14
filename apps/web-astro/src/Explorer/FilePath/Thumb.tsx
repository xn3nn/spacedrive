import { getIcon, getIconByName } from '@sd/assets/util';
import { createElementSize } from '@solid-primitives/resize-observer';
import clsx from 'clsx';
import { createMemo, createSignal, Match, Show, Switch, type ComponentProps } from 'solid-js';
import { createStore } from 'solid-js/store';
import { getExplorerItemData, type ExplorerItem } from '@sd/client';

import { LayeredFileIcon } from './LayeredFileIcon';
import classes from './Thumb.module.scss';

interface FileThumbProps extends Pick<ComponentProps<'img'>, 'ref'> {
	data: ExplorerItem;
	loadOriginal?: boolean;
	size?: number;
	cover?: boolean;
	frame?: boolean;
	onLoad?: (state: ThumbType) => void;
	onError?: (state: ThumbType, error: Error) => void;
	blackBars?: boolean;
	blackBarsSize?: number;
	extension?: boolean;
	mediaControls?: boolean;
	pauseVideo?: boolean;
	className?: string;
	frameClassName?: string;
	childClassName?: string | ((type: ThumbType) => string | undefined);
	isSidebarPreview?: boolean;
	childProps?: ComponentProps<'div'>;
}

type ThumbType = { variant: 'thumbnail' } | { variant: 'icon' };

export function FileThumb(props: FileThumbProps) {
	const itemData = createMemo(() => getExplorerItemData(props.data));

	const [loadState, setLoadState] = createStore<{
		[K in 'original' | 'thumbnail' | 'icon']: 'notLoaded' | 'loaded' | 'error';
	}>({ original: 'notLoaded', thumbnail: 'notLoaded', icon: 'notLoaded' });

	const thumbType = createMemo<ThumbType>(() => {
		const thumbType = 'thumbnail';

		if (thumbType === 'thumbnail')
			if (
				loadState.thumbnail !== 'error' &&
				itemData().hasLocalThumbnail &&
				itemData().thumbnailKey.length > 0
			)
				return { variant: 'thumbnail' };

		return { variant: 'icon' };
	});

	const src = createMemo<string | undefined>(() => {
		switch (thumbType().variant) {
			case 'thumbnail':
				// if (itemData().thumbnailKey.length > 0)
				// return platform.getThumbnailUrlByThumbKey(itemData.thumbnailKey);

				break;
			case 'icon':
				return 'Document';
			// const customIcon = itemData().customIcon;
			// if (customIcon) return getIconByName(customIcon as any);

			// return getIcon(
			// 	// itemData.isDir || parent?.type === 'Node' ? 'Folder' :
			// 	itemData().kind,
			// 	// isDark,
			// 	true,
			// 	itemData().extension,
			// 	itemData().isDir
			// );
		}
	});

	const _childClassName = () =>
		typeof props.childClassName === 'function'
			? props.childClassName(thumbType())
			: props.childClassName;

	const childClassName = 'max-h-full max-w-full object-contain';
	const frameClassName = clsx(
		'rounded-sm border-2 border-app-line bg-app-darkBox',
		props.frameClassName,
		true ? classes.checkers : classes.checkersLight
	);

	const getClass = () => clsx(childClassName, _childClassName());

	const onLoad = (s: 'original' | 'thumbnail' | 'icon') => {
		setLoadState((state) => ({ ...state, [s]: 'loaded' }));
		props.onLoad?.call(null, thumbType());
	};

	const onError = (s: 'original' | 'thumbnail' | 'icon', event: any) => {
		setLoadState((state) => ({ ...state, [s]: 'error' }));

		const rawError =
			('error' in event && event.error) ||
			('message' in event && event.message) ||
			'Filetype is not supported yet';

		props.onError?.call(
			null,
			thumbType(),
			rawError instanceof Error ? rawError : new Error(rawError)
		);
	};

	return (
		<Show when={src()}>
			{(src) => (
				<Switch>
					<Match when={thumbType().variant === 'thumbnail'}>
						<Thumbnail
							{...props.childProps}
							ref={props.ref}
							src={src()}
							cover={props.cover}
							onLoad={() => onLoad('thumbnail')}
							onError={(e) => onError('thumbnail', e)}
							decoding={props.size ? 'async' : 'sync'}
							class={clsx(
								props.cover
									? [
											'min-h-full min-w-full object-cover object-center',
											_childClassName()
									  ]
									: getClass(),
								props.frame &&
									!(itemData().kind === 'Video' && props.blackBars) &&
									frameClassName
							)}
							crossOrigin="anonymous" // Here it is ok, because it is not a react attr
							blackBars={
								props.blackBars && itemData().kind === 'Video' && !props.cover
							}
							blackBarsSize={props.blackBarsSize}
							extension={
								props.extension &&
								itemData().extension &&
								itemData().kind === 'Video'
									? itemData().extension || undefined
									: undefined
							}
						/>
					</Match>
					<Match when={thumbType().variant === 'icon'}>
						<LayeredFileIcon
							{...props.childProps}
							ref={props.ref}
							src={src()}
							kind={itemData().kind}
							extension={itemData().extension}
							onLoad={() => onLoad('icon')}
							onError={(e) => onError('icon', e)}
							decoding={props.size ? 'async' : 'sync'}
							class={getClass()}
							draggable={false}
						/>
					</Match>
				</Switch>
			)}
		</Show>
	);
}

interface ThumbnailProps extends ComponentProps<'img'> {
	cover?: boolean;
	extension?: string;
	blackBars?: boolean;
	blackBarsSize?: number;
}

function Thumbnail(props: ThumbnailProps) {
	const [ref, setRef] = createSignal<HTMLImageElement>();

	const size = createElementSize(ref);

	return (
		<>
			<img ref={setRef} draggable={false} />
			{(props.cover || (size.width && size.width > 80)) && props.extension && (
				<div
					style={{
						...(!props.cover && {
							marginTop: Math.floor((size.height ?? 0) / 2) - 2,
							marginLeft: Math.floor((size.width ?? 0) / 2) - 2
						})
					}}
					class={clsx(
						'pointer-events-none absolute rounded bg-black/60 px-1 py-0.5 text-[9px] font-semibold uppercase text-white opacity-70',
						props.cover
							? 'bottom-1 right-1'
							: 'left-1/2 top-1/2 -translate-x-full -translate-y-full'
					)}
				>
					{props.extension}
				</div>
			)}
		</>
	);
}
