import { ComponentProps, For } from 'solid-js';
import { Meta } from 'storybook-solidjs';

import { Button } from './Button';

export default {
	title: 'Button',
	component: Button,
	argTypes: {},
	parameters: { backgrounds: { default: 'dark' } },
	args: { children: 'Button' }
} satisfies Meta<ComponentProps<typeof Button>>;

type ButtonVariant = NonNullable<ComponentProps<typeof Button>['variant']>;

export const AllVariants = () => {
	const buttonVariants: ButtonVariant[] = [
		'accent',
		'default',
		'colored',
		'dotted',
		'gray',
		'outline',
		'subtle'
	];

	return (
		<div class="h-screen w-full bg-app p-10">
			<h1 class="text-[20px] font-bold text-white">Buttons</h1>
			<div class="mb-6 ml-[90px] mt-5 flex flex-col gap-8 text-sm">
				<div class="ml-[100px] grid w-full max-w-[850px] grid-cols-9 items-center gap-6">
					<For each={buttonVariants}>
						{(variant) => <p class="text-white/80">{variant}</p>}
					</For>
				</div>
				<div class="grid w-full max-w-[850px] grid-cols-9 items-center gap-6">
					<h1 class="text-[14px] font-bold text-white">Regular</h1>
					<For each={buttonVariants}>
						{(variant) => <Button variant={variant}>Button</Button>}
					</For>
				</div>
				<div class="grid w-full max-w-[850px] grid-cols-9 items-center gap-6">
					<h1 class="text-[14px] font-bold text-white">Hovered</h1>
					<For each={buttonVariants}>
						{(variant) => (
							<Button class="sb-pseudo--hover" variant={variant}>
								Button
							</Button>
						)}
					</For>
				</div>

				<div class="grid w-full max-w-[850px] grid-cols-9 items-center gap-6">
					<h1 class="text-[14px] font-bold text-white">Focused</h1>
					<For each={buttonVariants}>
						{(variant) => (
							<Button class="sb-pseudo--focus" variant={variant}>
								Button
							</Button>
						)}
					</For>
				</div>
			</div>
		</div>
	);
};
