import z from 'zod';
import { useZodForm } from '@sd/client';
import { Dialog, Select, SelectOption, Slider, toast, useDialog, UseDialogProps } from '@sd/ui';

const schema = z.object({
	type: z.enum(['Png', 'Jpg', 'Webp', 'avif']),
	quality: z.number().min(1).max(125).optional()
});
type schemaType = z.infer<typeof schema>;

const ImageDialog = (props: UseDialogProps) => {
	const selectOptions = ['Png', 'Jpg', 'Webp', 'avif'];

	const form = useZodForm({
		schema,
		mode: 'onBlur',
		defaultValues: {
			type: selectOptions[0] as schemaType['type'],
			quality: 100
		}
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
			<div className="flex flex-col gap-y-3">
				<Select {...form.register('type')} className="w-full">
					{selectOptions.map((option) => (
						<SelectOption key={option} value={option.toLowerCase()}>
							{option}
						</SelectOption>
					))}
				</Select>
				<Slider />
			</div>
		</Dialog>
	);
};

export default ImageDialog;
