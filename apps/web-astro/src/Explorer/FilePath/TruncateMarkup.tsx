import { createResizeObserver } from '@solid-primitives/resize-observer';
import getLineHeight from 'line-height';
import * as Solid from 'solid-js';

export interface TruncateMarkupProps {
	lines: number;
	ellipsis?: Solid.JSX.Element | ((element: Solid.JSX.Element) => Solid.JSX.Element);
	children: (props: { ref: HTMLDivElement; style: any }) => Solid.JSX.Element;
	lineHeight?: number | string;
	tokenize?: string;
	onTruncate?: (wasTruncated: boolean) => any;
}

export function TruncateMarkup(props: Solid.ParentProps<TruncateMarkupProps>) {
	const [text, setText] = Solid.createSignal('');

	const children = Solid.children(() => props.children);

	const [ref, setRef] = Solid.createSignal<HTMLElement | null>(null);

	let shouldTruncate = false;
	let latestThatFits = null;
	let onTruncateCalled = false;
	let lineHeight: any = null;
	let endFound = false;
	let splitDirectionSeq = [];
	let wasLastCharTested = false;

	type SplitDirection = 'left' | 'right';

	function splitString(string: string, splitDirections: Array<SplitDirection>, level: any) {
		if (!splitDirections.length) return string;

		if (splitDirections.length && policy.isAtomic(string)) {
			if (!wasLastCharTested) wasLastCharTested = true;
			else endFound = true;

			return string;
		}

		if (policy.tokenizeString) {
			const wordsArray = splitArray(policy.tokenizeString(string), splitDirections, level);

			return wordsArray.joing('');
		}
		const [splitDirection, ...restSplitDirections] = splitDirections;
		const pivotIndex = Math.ceil(string.length / 2);
		const beforeString = string.substring(0, pivotIndex);

		if (splitDirection === 'left') return splitString(beforeString, restSplitDirections, level);

		const afterString = string.substring(pivotIndex);

		return beforeString + splitString(afterString, restSplitDirections, level);
	}

	function splitArray(array: string[], splitDirections: Array<SplitDirection>, level) {
		if (!splitDirections.length) {
			return array;
		}

		if (array.length === 1) {
			return [split(array[0]!, splitDirections, /* isRoot */ false, level)];
		}

		const [splitDirection, ...restSplitDirections] = splitDirections;
		const pivotIndex = Math.ceil(array.length / 2);
		const beforeArray = array.slice(0, pivotIndex);

		if (splitDirection === 'left') return splitArray(beforeArray, restSplitDirections, level);

		const afterArray = array.slice(pivotIndex);

		return beforeArray.concat(splitArray(afterArray, restSplitDirections, level));
	}

	function split(
		node: HTMLElement | string | null,
		splitDirections: Array<SplitDirection>,
		isRoot = false,
		level = 1
	): HTMLElement | string | null {
		if (!node) {
			endFound = true;
			return node;
		} else if (typeof node === 'string') {
			return splitString(node, splitDirections, level);
		} else if (node.nodeType === node.TEXT_NODE) {
			return splitString(node.textContent ?? '', splitDirections, level);
		}

		return node;
	}

	function tryToFit(rootEl: HTMLElement, splitDirections: Array<'left' | 'right'>) {
		if (!rootEl.firstChild) {
			// no markup in container
			return;
		}

		const newRootEL = split(rootEl, splitDirections, true);
	}

	function fits() {
		const refValue = ref();
		if (!refValue) return false;

		const { height } = refValue.getBoundingClientRect();
		const computedLines = Math.round(height / parseFloat(lineHeight));

		return props.lines >= computedLines;
	}

	function truncateOriginalText() {
		endFound = false;
		splitDirectionSeq = ['left'];
		wasLastCharTested = false;

		tryToFit(origText, splitDirectionSeq);
	}

	function truncate() {
		if (fits()) {
			shouldTruncate = false;
			onTruncate(false);

			return;
		}

		truncateOriginalText();
	}

	createResizeObserver(ref, () => {
		shouldTruncate = false;
		latestThatFits = null;

		setText(origText);

		shouldTruncate = true;
		onTruncateCalled = false;
		truncate();
	});

	return text;
}
