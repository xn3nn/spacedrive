import { cva, cx, VariantProps } from 'class-variance-authority';
import { ComponentProps, JSX, splitProps } from 'solid-js';

export interface ButtonBaseProps extends VariantProps<typeof buttonStyles> {}

export type ButtonProps = ButtonBaseProps & ComponentProps<'button'> & { href?: undefined };

export type LinkButtonProps = ButtonBaseProps & ComponentProps<'a'> & { href?: string };

type Button = {
	(props: ButtonProps): JSX.Element;
	(props: LinkButtonProps): JSX.Element;
};

const hasHref = (props: ButtonProps | LinkButtonProps): props is LinkButtonProps => 'href' in props;

export const buttonStyles = cva(
	[
		'cursor-default items-center rounded-md border outline-none transition-colors duration-100',
		'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-70',
		'focus:ring-none focus:ring-offset-none cursor-pointer ring-offset-app-box'
	],
	{
		variants: {
			size: {
				icon: '!p-1',
				lg: 'text-md px-3 py-1.5 font-medium',
				md: 'px-2.5 py-1.5 text-sm font-medium',
				sm: 'px-2 py-1 text-sm font-medium',
				xs: 'px-1.5 py-0.5 text-xs font-normal'
			},
			variant: {
				default: [
					'bg-transparent hover:bg-app-hover active:bg-app-selected',
					'border-transparent hover:border-app-line active:border-app-line'
				],
				subtle: [
					'border-transparent hover:border-app-line/50 active:border-app-line active:bg-app-box/30'
				],
				outline: [
					'border-sidebar-line/60 hover:border-sidebar-line active:border-sidebar-line/30'
				],
				dotted: [
					`rounded border border-dashed border-sidebar-line/70 text-center text-xs font-medium text-ink-faint transition hover:border-sidebar-line hover:bg-sidebar-selected/5`
				],
				gray: [
					'bg-app-button hover:bg-app-hover focus:bg-app-selected',
					'border-app-line hover:border-app-line focus:ring-1 focus:ring-accent'
				],
				accent: [
					'border border-accent bg-accent text-white shadow-md shadow-app-shade/10 hover:bg-accent-faint focus:outline-none',
					'focus:ring-1 focus:ring-accent focus:ring-offset-2 focus:ring-offset-app-selected'
				],
				colored: ['text-white shadow-sm hover:bg-opacity-90 active:bg-opacity-100'],
				bare: ''
			},
			rounding: {
				none: 'rounded-none',
				left: 'rounded-l-md rounded-r-none',
				right: 'rounded-l-none rounded-r-md',
				both: 'rounded-md'
			}
		},
		defaultVariants: {
			size: 'sm',
			variant: 'default'
		}
	}
);

export function Button(props: ButtonProps | LinkButtonProps) {
	const [_, otherProps] = splitProps(props, ['size', 'variant', 'rounding', 'class']);

	const buttonClasses = () =>
		buttonStyles({
			size: props.size,
			variant: props.variant,
			rounding: props.rounding,
			class: props.class
		});

	return (
		<>
			{hasHref(props) ? (
				<a
					{...(otherProps as any)}
					class={cx(buttonClasses, 'inline-block no-underline')}
				/>
			) : (
				<button {...(otherProps as any)} type="button" class={buttonClasses()} />
			)}
		</>
	);
}

export function ButtonLink(props: LinkButtonProps) {
	const [_, otherProps] = splitProps(props, ['size', 'variant', 'rounding', 'class']);

	const buttonClasses = () =>
		buttonStyles({
			size: props.size,
			variant: props.variant,
			rounding: props.rounding
		});

	return (
		<a
			{...otherProps}
			class={cx(
				buttonClasses(),
				'no-underline disabled:cursor-not-allowed disabled:opacity-50',
				props.class
			)}
		/>
	);
}
