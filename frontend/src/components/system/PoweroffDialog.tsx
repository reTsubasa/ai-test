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
import { Loader2, PowerOff, AlertTriangle } from 'lucide-react';

interface PoweroffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPoweroff: (delay?: number) => Promise<void>;
}

export function PoweroffDialog({ open, onOpenChange, onPoweroff }: PoweroffDialogProps) {
  const [delay, setDelay] = useState<number>(0);
  const [isPoweringOff, setIsPoweringOff] = useState(false);

  const handlePoweroff = async () => {
    setIsPoweringOff(true);
    try {
      await onPoweroff(delay);
    } catch (error) {
      setIsPoweringOff(false);
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
            <PowerOff className="h-5 w-5 text-red-500" />
            Power Off System
          </DialogTitle>
          <DialogDescription>
            Shut down the VyOS system. The system will need to be manually powered on again.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Warning:</strong> Powering off the system will terminate all network connections and services.
              Make sure this is safe for your environment before proceeding.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="delay">Delay before shutdown</Label>
            <select
              id="delay"
              value={delay}
              onChange={(e) => setDelay(parseInt(e.target.value))}
              className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              disabled={isPoweringOff}
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
            disabled={isPoweringOff}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handlePoweroff}
            disabled={isPoweringOff}
          >
            {isPoweringOff ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Shutting down...
              </>
            ) : (
              <>
                <PowerOff className="mr-2 h-4 w-4" />
                Power Off
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}