import { useEffect, useRef } from 'react';
import { FieldValues, UseFormReturn, WatchObserver } from 'react-hook-form';
import { useDebouncedCallback } from 'use-debounce';

export function useFormWatch<
	TIn extends FieldValues = FieldValues,
	TContext = any,
	TOut extends FieldValues = FieldValues
>(form: UseFormReturn<TIn, TContext, TOut>, callback: WatchObserver<TIn>) {
	useEffect(() => form.watch(callback).unsubscribe, [form, callback]);
}

export function useFormWatchDebounced<
	TIn extends FieldValues = FieldValues,
	TContext = any,
	TOut extends FieldValues = FieldValues
>(form: UseFormReturn<TIn, TContext, TOut>, callback: WatchObserver<TIn>) {
	const debounced = useDebouncedCallback(callback, 500);

	useFormWatch(form, debounced);

	// persist unchanged data when the component is unmounted
	useEffect(() => () => debounced.flush(), [debounced, form]);
}

/**
 * This hook is an async friendly version of useFormWatch
 *
 * The callback will be called on the first render, and whenever the form changes, with the current
 * form values and the event info regarding the change (empty on first render). If the callback is
 * async, or returns a promise, it will wait for the previous callback to finish before executing
 * the next one. Any errors thrown by the callback will be ignored.
 *
 * @param form - Form to watch
 * @param callback - Callback to be called when form changes
 */
export function useFormWatchAsync<
	TIn extends FieldValues = FieldValues,
	TContext = any,
	TOut extends FieldValues = FieldValues
>(
	form: UseFormReturn<TIn, TContext, TOut>,
	callback: (...args: Parameters<WatchObserver<TIn>>) => any
) {
	const latestValue = useRef<Parameters<typeof callback>[0]>({} as any);

	// Create a promise chain to make sure async callbacks are called in order
	const chain = useRef<Promise<void>>();

	// Writing during render is usually not okay but doing so for purposes of initialization is okay
	chain.current ??= new Promise(() => callback(latestValue.current, {}));

	useFormWatch(form, (value, info) => {
		latestValue.current = value;
		chain.current = chain.current?.then(() => callback(latestValue.current, info));
	});
}
