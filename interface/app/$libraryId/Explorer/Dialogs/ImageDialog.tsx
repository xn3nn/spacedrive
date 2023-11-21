import clsx from 'clsx';
import { useState } from 'react';
import { Controller } from 'react-hook-form';
import z from 'zod';
import {
	ConvertableExtension,
	ExplorerItem,
	useBridgeQuery,
	useLibraryMutation,
	useZodForm
} from '@sd/client';
import {
	Button,
	Dialog,
	Input,
	RadixCheckbox,
	Select,
	SelectOption,
	Slider,
	toast,
	useDialog,
	UseDialogProps
} from '@sd/ui';
import { LocationIdParamsSchema } from '~/app/route-schemas';
import { Accordion, Icon } from '~/components';
import { useZodRouteParams } from '~/hooks';

type QualityLevel = {
	name: 'Low' | 'Medium' | 'High';
	value: number;
};

const schema = z.object({
	type: z.string(),
	qualitySlider: z.array(z.number().min(0).max(125)).optional(),
	selectedQuality: z.number().nullable().optional(),
	keepOriginal: z.boolean()
});

const qualityLevels: QualityLevel[] = [
	{ name: 'Low', value: 25 },
	{ name: 'Medium', value: 50 },
	{ name: 'High', value: 125 }
];

interface DialogProps extends UseDialogProps {
	selectedItem: ExplorerItem;
}

const ImageDialog = (props: DialogProps) => {
	const [selectedQuality, setSelectedQuality] = useState<QualityLevel | null>({
		name: 'High',
		value: 100
	});
	const locationId = useZodRouteParams(LocationIdParamsSchema).id;

	const extensions = useBridgeQuery(['files.getConvertableImageExtensions']);
	const convertImage = useLibraryMutation(['files.convertImage']);

	const form = useZodForm({
		schema,
		mode: 'onChange',
		defaultValues: {
			keepOriginal: true,
			selectedQuality: selectedQuality?.value
		}
	});

	const formSubmit = form.handleSubmit(async (data) => {
		try {
			await convertImage.mutateAsync({
				location_id: locationId,
				file_path_id: ('id' in props.selectedItem.item
					? props.selectedItem.item.id
					: null) as number,
				delete_src: data.keepOriginal,
				desired_extension: data.type as ConvertableExtension,
				quality_percentage: (data.qualitySlider?.[0] ?? data.selectedQuality) as number
			});
		} catch (error) {
			toast.error('There was an error converting your image. Please try again.');
		}
	});

	return (
		<Dialog
			form={form}
			onSubmit={formSubmit}
			title="Convert Image"
			loading={convertImage.isLoading}
			dialog={useDialog(props)}
			ctaLabel="Convert"
			description="Transform your image to a different format and quality"
			closeLabel="Cancel"
			className="relative"
			icon={<Icon className="" size={34} name="Image" />}
		>
			<div className="flex flex-col mt-3 gap-y-3">
				<div className="grid items-center justify-between grid-cols-2 gap-2">
					<div>
						<p className="mb-1.5 text-sm">From</p>
						<Input
							value={
								'extension' in props.selectedItem.item
									? (props.selectedItem.item.extension as string)
									: ''
							}
							className="text-ink/50"
							disabled
						/>
					</div>
					<div>
						<p className="mb-1.5 text-sm">To</p>
						<Controller
							name="type"
							control={form.control}
							render={({ field }) => (
								<Select
									placeholder="Select type..."
									className="h-[30px] w-full"
									{...field}
								>
									{extensions.data?.map((value) => (
										<SelectOption key={value} value={value}>
											{value}
										</SelectOption>
									))}
								</Select>
							)}
						/>
					</div>
				</div>
				<div className="mt-1 space-y-1.5">
					<p className="text-sm">Quality</p>
					<div className="flex justify-between gap-2 pb-0.5">
						{qualityLevels.map((level) => (
							<Button
								key={level.name}
								className={clsx(
									'w-full !cursor-pointer',
									selectedQuality?.name === level.name && '!bg-accent'
								)}
								variant="gray"
								onClick={() => {
									setSelectedQuality(level);
									form.setValue('qualitySlider', [0]);
									form.setValue('selectedQuality', level.value);
								}}
							>
								{level.name}
							</Button>
						))}
					</div>
					<Accordion title="Custom options">
						<p className="text-sm text-center text-ink">
							Or pick your own quality level
						</p>
						<Controller
							name="qualitySlider"
							control={form.control}
							render={({ field }) => (
								<Slider
									{...field}
									onValueChange={(value) => {
										setSelectedQuality(null);
										form.setValue('selectedQuality', null);
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
						<p className="text-sm text-center text-ink">
							{form.watch('qualitySlider') ?? 0}
						</p>
					</Accordion>
					<div className="flex items-center gap-1.5 pt-3">
						<Controller
							name="keepOriginal"
							control={form.control}
							render={({ field }) => (
								<RadixCheckbox
									className="!border-app-line !bg-app-box"
									defaultChecked={field.value}
									onCheckedChange={(value) => {
										field.onChange(value);
									}}
								/>
							)}
						/>
						<p className="text-xs text-ink">Keep original file</p>
					</div>
				</div>
			</div>
		</Dialog>
	);
};

export default ImageDialog;
