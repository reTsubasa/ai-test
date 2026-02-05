import type { VyOSImage } from '../../stores/systemStore';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Star, Trash2, Download, Package } from 'lucide-react';

interface ImageListProps {
  images: VyOSImage[];
  isLoading: boolean;
  onSetDefault: (imageName: string) => void;
  onDelete: (imageName: string) => void;
}

export function ImageList({ images, isLoading, onSetDefault, onDelete }: ImageListProps) {
  const formatBytes = (bytes: number): string => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let unitIndex = 0;
    let value = bytes;

    while (value >= 1024 && unitIndex < units.length - 1) {
      value /= 1024;
      unitIndex++;
    }

    return `${value.toFixed(2)} ${units[unitIndex]}`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getImageStatus = (image: VyOSImage) => {
    if (image.current) return { text: 'Default', variant: 'default' as const };
    if (image.installed) return { text: 'Installed', variant: 'secondary' as const };
    return { text: 'Available', variant: 'outline' as const };
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4 rounded-lg border bg-card">
            <div className="space-y-2">
              <div className="h-5 w-48 bg-muted animate-pulse rounded" />
              <div className="h-4 w-32 bg-muted animate-pulse rounded" />
              <div className="h-3 w-full bg-muted animate-pulse rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Package className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Images Found</h3>
        <p className="text-muted-foreground">
          Upload a VyOS image to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {images.map((image) => {
        const status = getImageStatus(image);
        return (
          <div
            key={image.name}
            className="flex items-center justify-between p-4 rounded-lg border bg-card hover:border-muted-foreground/30 transition-colors"
          >
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <p className="font-semibold">{image.name}</p>
                <Badge variant={status.variant}>
                  {status.text}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{image.version}</p>
              {image.description && (
                <p className="text-sm">{image.description}</p>
              )}
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>Size: {formatBytes(image.size)}</span>
                {image.installed && (
                  <span>Installed: {formatDate(image.installDate)}</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!image.current && image.installed && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSetDefault(image.name)}
                  title="Set as default boot image"
                >
                  <Star className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.href = `/system/images/${image.name}/download`}
                title="Download image"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onDelete(image.name)}
                disabled={image.current}
                title="Delete image"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}