// import getLineHeight from 'line-height';
// import * as Solid from 'solid-js';

// export interface TruncateMarkupProps {
// 	lines: number;
// 	ellipsis?: Solid.JSX.Element | ((element: Solid.JSX.Element) => Solid.JSX.Element);
// 	children: (ref: HTMLDivElement, style: any) => Solid.JSX.Element;
// 	lineHeight?: number | string;
// 	tokenize?: string;
// 	onTruncate?: (wasTruncated: boolean) => any;
// }

// export function TruncateMarkup(props: TruncateMarkupProps) {
// 	let splitDirectionSeq = [];
// 	let shouldTruncate = true;
// 	let wasLastCharTested = false;
// 	let endFound = false;
// 	let latestThatFits = null;
// 	let onTruncateCalled = false;

// 	let el: HTMLDivElement;

// 	Solid.onMount(() => {
// 		// if (!isValid) return;

// 		let splitDirectionSeq: Array<'left' | 'right'> = [];
// 		let shouldTruncate = true;
// 		let wasLastCharTested = false;
// 		let endFound = false;
// 		let latestThatFits = null;
// 		let onTruncateCalled = false;

// 		const lineHeight = props.lineHeight || getLineHeight(el);

// 		const fits = Solid.createMemo(() => {
// 			const maxLines = props.lines;
// 			const { height } = el!.getBoundingClientRect();
// 			const computedLines = Math.round(height / parseFloat(lineHeight));

// 			return maxLines >= computedLines;
// 		});

// 		function onTruncate(wasTruncated: boolean) {
// 			if (!onTruncateCalled) {
// 				onTruncateCalled = true;
// 				props.onTruncate?.(wasTruncated);
// 			}
// 		}

// 		function truncateOriginalText() {
// 			endFound = false;
// 			splitDirectionSeq = ['left'];
// 			wasLastCharTested = false;

// 			tryToFit(origText, splitDirectionSeq);
// 		}

// 		function tryToFit() {}

// 		function truncate() {
// 			if (fits()) {
// 				shouldTruncate = false;
// 				onTruncate(false);

// 				return;
// 			}

// 			truncateOriginalText();
// 		}
// 	});

// 	function childrenElementWithRef() {
// 		const childrenArray = children.toArray();
// 		if (childrenArray.length > 1) {
// 			throw new Error('TruncateMarkup must have only one child element');
// 		}

// 		const child = childrenArray[0];
// 	}

// 	const [text, setText] = Solid.createSignal(props.children);

// 	return <>{text()}</>;
// }
