import { Controller } from 'react-hook-form';
import z from 'zod';
import { useZodForm } from '@sd/client';
import { Dialog, Select, SelectOption, Slider, toast, useDialog, UseDialogProps } from '@sd/ui';

const schema = z.object({
	type: z.enum(['Png', 'Jpg', 'Webp', 'avif']),
	quality: z.array(z.number().min(0).max(125))
});

const ImageDialog = (props: UseDialogProps) => {
	const selectOptions = ['Png', 'Jpg', 'Webp', 'avif'];

	const form = useZodForm({
		schema,
		mode: 'onChange'
	});

	const formSubmit = form.handleSubmit(async (data) => {
		try {
			console.log('convert api call');
		} catch (error) {
			toast.error('There was an error converting your image. Please try again.');
		}
	});

	return (
		<Dialog
			form={form}
			onSubmit={formSubmit}
			title="Image Conversion"
			dialog={useDialog(props)}
			ctaLabel="Convert"
			closeLabel="Cancel"
		>
			<div className="mt-3 flex flex-col gap-y-3">
				<Controller
					name="type"
					control={form.control}
					render={({ field }) => (
						<Select placeholder="Convert to..." className="w-full" {...field}>
							{selectOptions.map((value) => (
								<SelectOption key={value} value={value}>
									{value}
								</SelectOption>
							))}
						</Select>
					)}
				/>
				<div className="mt-1 space-y-2">
					<p className="text-sm">Quality</p>
					<Controller
						name="quality"
						control={form.control}
						render={({ field }) => (
							<Slider
								{...field}
								onValueChange={(value) => {
									field.onChange(value);
								}}
								defaultValue={[0]}
								max={125}
								min={0}
								step={1}
								className="w-full"
							/>
						)}
					/>

					<p className="text-center text-sm text-ink">{form.watch('quality') ?? 0}</p>
				</div>
			</div>
		</Dialog>
	);
};

export default ImageDialog;
