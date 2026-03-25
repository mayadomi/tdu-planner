import { router, useForm } from '@inertiajs/react';
import { ImageIcon, Loader2, Trash2, Upload } from 'lucide-react';
import { useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
    /** Current image URL (null if none uploaded yet) */
    currentUrl: string | null;
    /** POST route to upload a new image */
    uploadRoute: string;
    /** DELETE route to remove the current image */
    deleteRoute: string;
    /** Form field name expected by the server */
    fieldName?: string;
    /** Descriptive label shown above the control */
    label: string;
    /** Hint text shown below the label */
    hint?: string;
    /** CSS aspect-ratio applied to the preview container, e.g. "16/9" or "1/1" */
    aspectRatio?: string;
    className?: string;
}

export function ImageUpload({
    currentUrl,
    uploadRoute,
    deleteRoute,
    fieldName = 'image',
    label,
    hint,
    aspectRatio = '16/9',
    className,
}: ImageUploadProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const deleteForm = useForm({});

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const data = new FormData();
        data.append(fieldName, file);
        setUploading(true);
        setUploadError(null);
        router.post(uploadRoute, data, {
            preserveScroll: true,
            onSuccess: () => {
                if (inputRef.current) inputRef.current.value = '';
            },
            onError: (errors) => {
                setUploadError(errors[fieldName] ?? 'Upload failed.');
            },
            onFinish: () => setUploading(false),
        });
    };

    const handleDelete = () => {
        deleteForm.delete(deleteRoute, { preserveScroll: true });
    };

    const isBusy = uploading || deleteForm.processing;

    return (
        <div className={cn('space-y-2', className)}>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium">{label}</p>
                    {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
                </div>
                {currentUrl && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={handleDelete}
                        disabled={isBusy}
                    >
                        {deleteForm.processing ? (
                            <Loader2 className="size-4 animate-spin" />
                        ) : (
                            <Trash2 className="size-4" />
                        )}
                        <span className="ml-1.5">Remove</span>
                    </Button>
                )}
            </div>

            {/* Preview / placeholder */}
            <div
                className="relative overflow-hidden rounded-lg border bg-muted/30"
                style={{ aspectRatio }}
            >
                {currentUrl ? (
                    <img
                        src={currentUrl}
                        alt={label}
                        className="h-full w-full object-cover"
                    />
                ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
                        <ImageIcon className="size-8 opacity-40" />
                        <span className="text-xs">No image</span>
                    </div>
                )}

                {/* Uploading overlay */}
                {uploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/60">
                        <Loader2 className="size-6 animate-spin text-primary" />
                    </div>
                )}
            </div>

            {/* Upload button */}
            <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                className="hidden"
                onChange={handleFileChange}
                disabled={isBusy}
            />
            <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => inputRef.current?.click()}
                disabled={isBusy}
            >
                {uploading ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                    <Upload className="mr-2 size-4" />
                )}
                {currentUrl ? 'Replace image' : 'Upload image'}
            </Button>

            {/* Validation errors */}
            {uploadError && (
                <p className="text-sm text-destructive">{uploadError}</p>
            )}
        </div>
    );
}
