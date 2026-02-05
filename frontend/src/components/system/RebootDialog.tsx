import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Label } from '../ui/Label';
import { Alert, AlertDescription } from '../ui/Alert';
import { Loader2, RefreshCw, AlertTriangle } from 'lucide-react';

interface RebootDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReboot: (delay?: number) => Promise<void>;
}

export function RebootDialog({ open, onOpenChange, onReboot }: RebootDialogProps) {
  const [delay, setDelay] = useState<number>(0);
  const [isRebooting, setIsRebooting] = useState(false);

  const handleReboot = async () => {
    setIsRebooting(true);
    try {
      await onReboot(delay);
    } catch (error) {
      setIsRebooting(false);
    }
  };

  const delayOptions = [
    { value: 0, label: 'Immediately' },
    { value: 60, label: 'After 1 minute' },
    { value: 300, label: 'After 5 minutes' },
    { value: 600, label: 'After 10 minutes' },
    { value: 1800, label: 'After 30 minutes' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-yellow-500" />
            Reboot System
          </DialogTitle>
          <DialogDescription>
            Restart the VyOS system. All connections will be temporarily interrupted.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Rebooting the system will interrupt all network traffic and disconnect all active sessions.
              Make sure you have saved any important changes before proceeding.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="delay">Delay before reboot</Label>
            <select
              id="delay"
              value={delay}
              onChange={(e) => setDelay(parseInt(e.target.value))}
              className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              disabled={isRebooting}
            >
              {delayOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isRebooting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleReboot}
            disabled={isRebooting}
          >
            {isRebooting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Rebooting...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Reboot System
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}