import { useEffect, useCallback, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Progress } from '../../components/ui/Progress';
import { Alert, AlertDescription } from '../../components/ui/Alert';
import { useSystemStore } from '../../stores/systemStore';
import { systemService } from '../../services/SystemService';
import { ImageUploadDialog } from '../../components/system/ImageUploadDialog';
import { ImageList } from '../../components/system/ImageList';
import {
  HardDrive,
  RefreshCw,
  Upload,
  CheckCircle,
  AlertTriangle,
  Download,
  Trash2,
  Star,
} from 'lucide-react';

export function ImageManagerPage() {
  const {
    images,
    isLoadingImages,
    isUploading,
    uploadProgress,
    setImages,
    setLoadingImages,
    setUploading,
    setUploadProgress,
    setError,
  } = useSystemStore();

  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [error, setErrorState] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load images on mount
  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = useCallback(async () => {
    try {
      setLoadingImages(true);
      const imagesData = await systemService.getImages();
      setImages(imagesData);
      setErrorState(null);
    } catch (error) {
      setErrorState(error instanceof Error ? error.message : 'Failed to load images');
    } finally {
      setLoadingImages(false);
    }
  }, [setLoadingImages, setImages]);

  const handleUpload = async (file: File) => {
    try {
      setUploading(true);
      setUploadProgress(0);
      setErrorState(null);

      const result = await systemService.addImage(file, (progress) => {
        setUploadProgress(progress);
      });

      setSuccessMessage(`Image ${result.name} (${result.version}) uploaded successfully`);
      setShowUploadDialog(false);
      await loadImages();
    } catch (error) {
      setErrorState(error instanceof Error ? error.message : 'Failed to upload image');
      setUploading(false);
      setUploadProgress(0);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleSetDefault = async (imageName: string) => {
    try {
      await systemService.setDefaultImage(imageName);
      setSuccessMessage(`Image ${imageName} set as default`);
      await loadImages();
    } catch (error) {
      setErrorState(error instanceof Error ? error.message : 'Failed to set default image');
    }
  };

  const handleDelete = async (imageName: string) => {
    if (!confirm(`Are you sure you want to delete image ${imageName}?`)) {
      return;
    }

    try {
      await systemService.deleteImage(imageName);
      setSuccessMessage(`Image ${imageName} deleted successfully`);
      await loadImages();
    } catch (error) {
      setErrorState(error instanceof Error ? error.message : 'Failed to delete image');
    }
  };

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

  const currentImage = images.find((img) => img.current);
  const installedImages = images.filter((img) => img.installed);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Image Manager</h1>
          <p className="text-muted-foreground">
            Manage VyOS system images and installations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={loadImages} disabled={isLoadingImages || isUploading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoadingImages ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => setShowUploadDialog(true)} disabled={isUploading}>
            <Upload className="mr-2 h-4 w-4" />
            Upload Image
          </Button>
        </div>
      </div>

      {/* Upload Progress */}
      {isUploading && (
        <Alert>
          <Upload className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Uploading image...</span>
            <span className="font-semibold">{uploadProgress}%</span>
          </AlertDescription>
        </Alert>
      )}

      {/* Error Message */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Success Message */}
      {successMessage && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}

      {/* Current Boot Image */}
      {currentImage && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Current Boot Image
            </CardTitle>
            <CardDescription>
              The system will boot from this image
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
              <div className="space-y-1">
                <p className="font-semibold text-lg">{currentImage.name}</p>
                <p className="text-sm text-muted-foreground">{currentImage.version}</p>
                {currentImage.description && (
                  <p className="text-sm">{currentImage.description}</p>
                )}
              </div>
              <Badge variant="default">
                <CheckCircle className="mr-1 h-3 w-3" />
                Active
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Installed Images */}
      {installedImages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="h-5 w-5" />
              Installed Images
            </CardTitle>
            <CardDescription>
              {installedImages.length} image(s) installed on system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {installedImages.map((image) => (
                <div
                  key={image.name}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{image.name}</p>
                      {image.current && (
                        <Badge variant="default">
                          <Star className="mr-1 h-3 w-3" />
                          Default
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{image.version}</p>
                    {image.description && (
                      <p className="text-sm">{image.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Size: {formatBytes(image.size)}</span>
                      <span>Installed: {image.installDate}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!image.current && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetDefault(image.name)}
                      >
                        <Star className="mr-1 h-4 w-4" />
                        Set Default
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(image.name)}
                      disabled={image.current}
                    >
                      <Trash2 className="mr-1 h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Image Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload New Image
          </CardTitle>
          <CardDescription>
            Install a new VyOS image on the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-6 border-2 border-dashed rounded-lg text-center">
              <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">Upload VyOS Image</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Supported formats: ISO, VMDK, QEMU2
              </p>
              <Button onClick={() => setShowUploadDialog(true)}>
                <Upload className="mr-2 h-4 w-4" />
                Select Image File
              </Button>
            </div>
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Make sure you have sufficient disk space before uploading a new image.
                The system needs at least 2x the image size available.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <ImageUploadDialog
        open={showUploadDialog}
        onOpenChange={setShowUploadDialog}
        onUpload={handleUpload}
        isUploading={isUploading}
        progress={uploadProgress}
      />

      {/* Image List Component */}
      <ImageList
        images={images}
        isLoading={isLoadingImages}
        onSetDefault={handleSetDefault}
        onDelete={handleDelete}
      />
    </div>
  );
}