import { createEventListener } from '@solid-primitives/event-listener';
import clsx from 'clsx';
import { createEffect, createSignal, splitProps, type ComponentProps } from 'solid-js';

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
			className={clsx(
				'cursor-default overflow-hidden rounded-md px-1.5 py-px text-xs text-ink outline-none',
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
			{props.name}
			{/* {allowRename ? (
				name
			) : (
				<TruncatedText text={name} lines={lines} onTruncate={setIsTruncated} />
			)} */}
		</div>
		// </Tooltip>
	);
}

interface TruncatedTextProps {
	text: string;
	lines?: number;
	onTruncate: (wasTruncated: boolean) => void;
}

function TruncatedText(props: TruncatedTextProps) {
	const ellipsis = () => {
		const extension = props.text.lastIndexOf('.');
		if (extension !== -1) return `...${props.text.slice(-(props.text.length - extension + 2))}`;
		return `...${props.text.slice(-8)}`;
	};

	return (
		<TruncateMarkup lines={props.lines} ellipsis={ellipsis} onTruncate={props.onTruncate}>
			<div>{props.text}</div>
		</TruncateMarkup>
	);
}
