import { Images } from '@phosphor-icons/react';
import clsx from 'clsx';
import { useState } from 'react';
import { Controller } from 'react-hook-form';
import z from 'zod';
import { useZodForm } from '@sd/client';
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
import Accordion from '~/components/Accordion';

import { useExplorerStore } from '../store';

type QualityLevel = {
    name: 'Low' | 'Medium' | 'High';
    value: number;
};

const schema = z.object({
    type: z.enum(['PNG', 'Jpg', 'WebP', 'avif']),
    qualitySlider: z.array(z.number().min(0).max(125)).optional(),
    selectedQuality: z.number().optional(),
    keepOriginal: z.boolean()
});

const selectOptions = ['PNG', 'Jpg', 'WebP', 'avif'];

const qualityLevels: QualityLevel[] = [
    { name: 'Low', value: 25 },
    { name: 'Medium', value: 50 },
    { name: 'High', value: 125 }
];

const ImageDialog = (props: UseDialogProps) => {
    const explorerStore = useExplorerStore();
    const [selectedQuality, setSelectedQuality] = useState<QualityLevel | null>({
        name: 'High',
        value: 100
    });

    const form = useZodForm({
        schema,
        mode: 'onChange',
        defaultValues: {
            type: explorerStore.selectedImageConvert.chosenExtension,
            quality: [0],
            keepOriginal: true
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
            title="Convert Image"
            dialog={useDialog(props)}
            ctaLabel="Convert"
            description="Transform your image to a different format and quality"
            closeLabel="Cancel"
            icon={<Images weight="fill" width={20} height={20} />}
        >
            <div className="flex flex-col mt-3 gap-y-3">
                <div className="grid items-center justify-between grid-cols-2 gap-2">
                    <div>
                        <p className="mb-1.5 text-sm">From</p>
                        <Input
                            value={explorerStore.selectedImageConvert.fileExtension}
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
                                <Select className="w-full" {...field}>
                                    {selectOptions.map((value) => (
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

