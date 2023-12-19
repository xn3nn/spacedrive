import { createEventListener } from '@solid-primitives/event-listener';
import { createResizeObserver } from '@solid-primitives/resize-observer';
import clsx from 'clsx';
import {
	createEffect,
	createMemo,
	createSignal,
	JSX,
	Show,
	splitProps,
	type ComponentProps
} from 'solid-js';

// import { Tooltip } from '@sd/ui';

import { explorerStore } from '../store';

export interface RenameTextBoxProps extends ComponentProps<'div'> {
	name: string;
	onRename: (newName: string) => void;
	disabled?: boolean;
	lines?: number;
	// Temporary solution for TruncatedText in list view
	idleClassName?: string;
}

export function RenameTextBox(props: RenameTextBoxProps) {
	// const os = useOperatingSystem();

	const [_, wrapperProps] = splitProps(props, [
		'name',
		'onRename',
		'disabled',
		'class',
		'idleClassName',
		'lines'
	]);

	let ref: HTMLDivElement;

	let renamable = false;
	let timeout: NodeJS.Timeout | null = null;

	const [allowRename, setAllowRename] = createSignal(false);
	const [isTruncated, setIsTruncated] = createSignal(false);

	// Highlight file name up to extension or
	// fully if it's a directory, hidden file or has no extension
	const highlightText = () => {
		if (!ref || !props.name) return;

		const node = ref.firstChild;
		if (!node) return;

		const endRange = props.name.lastIndexOf('.');

		const range = document.createRange();

		range.setStart(node, 0);
		range.setEnd(node, endRange > 1 ? endRange : props.name.length);

		const sel = window.getSelection();
		if (!sel) return;

		sel.removeAllRanges();
		sel.addRange(range);
	};

	// Blur field
	const blur = () => ref?.blur();

	// Reset to original file name
	const reset = () => ref && (ref.innerText = props.name ?? '');

	const handleRename = async () => {
		let newName = ref?.innerText;

		if (newName?.endsWith('\n')) newName = newName.slice(0, -1);

		if (!newName || newName === props.name) {
			reset();
			return;
		}

		props.onRename(newName);
	};

	const handleKeyDown: ComponentProps<'div'>['onKeyDown'] = (e) => {
		switch (e.key) {
			case 'Tab': {
				e.preventDefault();
				blur();
				break;
			}
			case 'Escape': {
				e.stopPropagation();
				reset();
				blur();
				break;
			}
			case 'z': {
				if (e.metaKey || e.ctrlKey) {
					reset();
					highlightText();
				}
			}
		}
	};

	const resetState = () => {
		setAllowRename(false);
		renamable = false;
		if (timeout) {
			clearTimeout(timeout);
			timeout = null;
		}
	};

	// useShortcut('renameObject', (e) => {
	// 	e.preventDefault();
	// 	if (allowRename()) blur();
	// 	else if (!disabled) setAllowRename(true);
	// });

	createEffect(() => {
		const element = ref;
		if (!element || !allowRename()) return;

		const scroll = (e: WheelEvent) => {
			e.preventDefault();
			element.scrollTop += e.deltaY;
		};

		highlightText();

		element.addEventListener('wheel', scroll);
		return () => element.removeEventListener('wheel', scroll);
	});

	createEffect(() => {
		if (!props.disabled) {
			if (explorerStore.isRenaming && !allowRename()) setAllowRename(true);
			else explorerStore.isRenaming = allowRename();
		} else resetState();
	});

	createEventListener(
		window,
		'mousedown',
		(event) => {
			if (!ref?.contains(event.target as Node)) blur();
		},
		true
	);

	return (
		// <Tooltip
		// 	labelClassName="break-all"
		// 	tooltipClassName="!max-w-[250px]"
		// 	label={
		// 		!isTruncated || allowRename || explorerStore.drag?.type === 'dragging'
		// 			? null
		// 			: name
		// 	}
		// 	asChild
		// >
		<div
			ref={ref!}
			role="textbox"
			contentEditable={allowRename()}
			class={clsx(
				'cursor-default overflow-hidden rounded-md px-1.5 py-px text-center text-xs text-ink outline-none',
				allowRename() && 'whitespace-normal bg-app !text-ink ring-2 ring-accent-deep',
				!allowRename && props.idleClassName,
				props.class
			)}
			onDblClick={(e) => {
				if (allowRename()) e.stopPropagation();
				renamable = false;
			}}
			onMouseDown={(e) => e.button === 0 && (renamable = !props.disabled)}
			onMouseUp={(e) => {
				if (e.button === 0 || renamable || !allowRename) {
					timeout = setTimeout(() => renamable && setAllowRename(true), 350);
				}
			}}
			onBlur={() => {
				handleRename();
				resetState();
				explorerStore.isRenaming = false;
			}}
			onKeyDown={handleKeyDown}
			{...wrapperProps}
		>
			{allowRename()
				? props.name
				: (() => {
						const ellipsis = createMemo(() => {
							const extension = props.name.lastIndexOf('.');
							if (extension !== -1)
								return `...${props.name.slice(
									-Math.min(props.name.length - extension + 2, 8)
								)}`;
							return `...${props.name.slice(-8)}`;
						});

						return (
							<TruncatedText
								lines={props.lines ?? 2}
								postfix={ellipsis()}
								onTruncate={setIsTruncated}
							>
								{props.name}
							</TruncatedText>
						);
					})()}
		</div>
		// </Tooltip>
	);
}

const LINE_HEIGHT = 19;

function TruncatedText(props: {
	lines: number;
	prefix?: JSX.Element;
	postfix?: JSX.Element;
	children: string;
	style?: JSX.CSSProperties;
	onTruncate?: (wasTruncated: boolean) => void;
}) {
	const [cutoff, setCutoff] = createSignal<Array<'left' | 'right'>>([]);
	const cutoffChildren = createMemo(() => {
		const length = props.children.length;

		let cursor = length;

		const cutoffsArray = cutoff();
		for (let i = 1; i <= cutoffsArray.length; i++) {
			const delta = Math.ceil(length * Math.pow(0.5, i));
			const cutoff = cutoffsArray[i]!;

			cursor += (cutoff === 'left' ? -1 : 1) * delta;
		}

		return props.children.slice(0, cursor);
	});

	let ref!: HTMLDivElement;

	let currentlyTruncating = false;

	const fits = createMemo(
		() => ref?.getBoundingClientRect().height ?? 0 / LINE_HEIGHT <= props.lines
	);

	function truncate() {
		if (fits()) {
			setCutoff((c) => [...c, 'right' as const]);
			return (currentlyTruncating = false);
		}

		setCutoff((c) => [...c, 'left' as const]);

		if (fits()) {
			return (currentlyTruncating = false);
		}

		currentlyTruncating = true;

		truncate();
	}

	function reset() {
		setCutoff([]);

		if (fits()) return;

		currentlyTruncating = true;
		truncate();
	}

	createResizeObserver(
		() => ref,
		() => {
			if (currentlyTruncating) return;

			reset();
		}
	);

	return (
		<div
			style={{
				'word-break': 'break-word',
				...props.style
			}}
			ref={ref}
		>
			<Show when={props.prefix}>
				<div style={{ display: 'inline-block' }}>{props.prefix}</div>
			</Show>
			{cutoffChildren()}
			{/* <Show when={cutoff().length > 0}>{props.postfix}</Show> */}
		</div>
	);
}
