import { Camera, ImageIcon, Loader2 } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (source: 'camera' | 'library') => void;
  isCapturing: boolean;
  isProcessing: boolean;
}

export function CameraCapture({ onCapture, isCapturing, isProcessing }: CameraCaptureProps) {
  const isLoading = isCapturing || isProcessing;

  return (
    <div className="grid grid-cols-2 gap-3">
      <button
        onClick={() => onCapture('camera')}
        disabled={isLoading}
        className="flex flex-col items-center justify-center gap-3 p-6 rounded-xl bg-card border-2 border-dashed border-border hover:border-primary/50 transition-colors disabled:opacity-50"
      >
        {isCapturing ? (
          <Loader2 className="h-8 w-8 text-primary pull-spinner" />
        ) : (
          <Camera className="h-8 w-8 text-primary" />
        )}
        <span className="text-sm font-medium">Take Photo</span>
      </button>

      <button
        onClick={() => onCapture('library')}
        disabled={isLoading}
        className="flex flex-col items-center justify-center gap-3 p-6 rounded-xl bg-card border-2 border-dashed border-border hover:border-primary/50 transition-colors disabled:opacity-50"
      >
        {isProcessing ? (
          <Loader2 className="h-8 w-8 text-primary pull-spinner" />
        ) : (
          <ImageIcon className="h-8 w-8 text-primary" />
        )}
        <span className="text-sm font-medium">Choose Photo</span>
      </button>

      {isProcessing && (
        <p className="col-span-2 text-center text-sm text-muted-foreground">
          Analyzing receipt...
        </p>
      )}
    </div>
  );
}
