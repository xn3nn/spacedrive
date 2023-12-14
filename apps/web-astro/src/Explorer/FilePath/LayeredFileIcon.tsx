// import { getLayeredIcon } from '@sd/assets/util';
import clsx from 'clsx';
import { Match, splitProps, Switch, type ComponentProps } from 'solid-js';
import { type ObjectKindKey } from '@sd/client';

interface LayeredFileIconProps extends ComponentProps<'img'> {
	kind: ObjectKindKey;
	extension: string | null;
}

const SUPPORTED_ICONS = ['Document', 'Code', 'Text', 'Config'];

const positionConfig: Record<string, string> = {
	Text: 'flex h-full w-full items-center justify-center',
	Code: 'flex h-full w-full items-center justify-center',
	Config: 'flex h-full w-full items-center justify-center'
};

export function LayeredFileIcon(props: LayeredFileIconProps) {
	const [, imgProps] = splitProps(props, ['kind', 'extension']);

	const iconImg = <img ref={props.ref} {...imgProps} />;

	const IconComponent = () => (props.extension ? <div>{props.extension}</div> : null);
	// getLayeredIcon(props.kind, props.extension) : null;

	return (
		<Switch>
			<Match when={!SUPPORTED_ICONS.includes(props.kind)}>{iconImg}</Match>
			<Match when={IconComponent() === null}>{iconImg}</Match>
			<Match when={IconComponent()}>
				{(_) => (
					<div class="relative">
						{iconImg}
						<div
							class={clsx(
								'pointer-events-none absolute bottom-0 right-0',
								positionConfig[props.kind] ||
									'flex h-full w-full items-end justify-end pb-4 pr-2'
							)}
						>
							Icon
							{/* <IconComponent viewBox="0 0 16 16" height="40%" width="40%" /> */}
						</div>
					</div>
				)}
			</Match>
		</Switch>
	);
}
