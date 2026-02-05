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
import { Textarea } from '../ui/Textarea';
import { Switch } from '../ui/Switch';
import { Label } from '../ui/Label';
import { Alert, AlertDescription } from '../ui/Alert';
import { Badge } from '../ui/Badge';
import { Separator } from '../ui/Separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/Tabs';
import { CheckCircle, AlertTriangle, Save, FileText, Settings, AlertCircle, Loader2 } from 'lucide-react';
import type { ConfigNode, ConfigValidationError } from '../../stores/configStore';
import { cn } from '../../utils/cn';

export interface ConfigApplyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: ConfigNode[];
  validationErrors?: ConfigValidationError[];
  onApply: (comment: string, options: ApplyOptions) => void | Promise<void>;
  isApplying?: boolean;
  pendingChanges?: number;
}

export interface ApplyOptions {
  validate?: boolean;
  dryRun?: boolean;
  saveToStartup?: boolean;
}

export function ConfigApplyDialog({
  open,
  onOpenChange,
  config,
  validationErrors = [],
  onApply,
  isApplying = false,
  pendingChanges = 0,
}: ConfigApplyDialogProps) {
  const [comment, setComment] = useState('');
  const [validate, setValidate] = useState(true);
  const [dryRun, setDryRun] = useState(false);
  const [saveToStartup, setSaveToStartup] = useState(true);
  const [activeTab, setActiveTab] = useState<'summary' | 'changes' | 'settings'>('summary');

  const handleApply = () => {
    onApply(comment, { validate, dryRun, saveToStartup });
  };

  const handleCancel = () => {
    if (!isApplying) {
      onOpenChange(false);
    }
  };

  const hasErrors = validationErrors.length > 0;
  const hasWarnings = validationErrors.some((e) => e.severity === 'warning');
  const isValid = !hasErrors;

  const renderSummary = () => {
    const nodeCount = countNodes(config);
    const sections = getSections(config);

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 rounded-lg bg-muted">
            <div className="text-2xl font-bold">{pendingChanges}</div>
            <div className="text-sm text-muted-foreground">Pending Changes</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-muted">
            <div className="text-2xl font-bold">{nodeCount}</div>
            <div className="text-sm text-muted-foreground">Total Nodes</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-muted">
            <div className="text-2xl font-bold">{sections.length}</div>
            <div className="text-sm text-muted-foreground">Sections</div>
          </div>
        </div>

        <Separator />

        <div>
          <h4 className="text-sm font-medium mb-2">Affected Sections</h4>
          <div className="flex flex-wrap gap-2">
            {sections.map((section) => (
              <Badge key={section} variant="secondary">
                {section}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderChanges = () => {
    return (
      <div className="space-y-2">
        {validationErrors.length > 0 ? (
          <Alert variant={hasErrors ? 'destructive' : 'default'}>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {hasErrors
                ? `${validationErrors.length} validation error(s) found. Please fix them before applying.`
                : `${validationErrors.length} warning(s) found. You may still apply, but review carefully.`}
            </AlertDescription>
          </Alert>
        ) : (
          <div className="flex items-center justify-center p-8 text-muted-foreground">
            <CheckCircle className="h-8 w-8 mr-2 text-green-500" />
            No validation errors
          </div>
        )}

        {validationErrors.length > 0 && (
          <div className="space-y-2 max-h-[300px] overflow-auto">
            {validationErrors.map((error, index) => (
              <div
                key={index}
                className={cn(
                  'flex items-start gap-3 p-3 rounded-lg border',
                  error.severity === 'error'
                    ? 'bg-red-500/10 border-red-500/20'
                    : 'bg-yellow-500/10 border-yellow-500/20'
                )}
              >
                {error.severity === 'error' ? (
                  <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-yellow-500 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <code className="text-xs font-mono block text-muted-foreground mb-1">
                    {error.path}
                  </code>
                  <p className="text-sm">{error.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderSettings = () => {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 rounded-lg border">
          <div>
            <p className="font-medium">Validate Configuration</p>
            <p className="text-sm text-muted-foreground">
              Run validation before applying changes
            </p>
          </div>
          <Switch checked={validate} onCheckedChange={setValidate} />
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg border">
          <div>
            <p className="font-medium">Dry Run</p>
            <p className="text-sm text-muted-foreground">
              Preview changes without applying them
            </p>
          </div>
          <Switch checked={dryRun} onCheckedChange={setDryRun} />
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg border">
          <div>
            <p className="font-medium">Save to Startup Config</p>
            <p className="text-sm text-muted-foreground">
              Persist configuration across reboots
            </p>
          </div>
          <Switch checked={saveToStartup} onCheckedChange={setSaveToStartup} />
        </div>

        <Separator />

        <div className="space-y-2">
          <Label htmlFor="comment">Commit Comment (Optional)</Label>
          <Textarea
            id="comment"
            placeholder="Describe the changes you're making..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
          />
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={cn(
              'p-2 rounded-full',
              isValid ? 'bg-green-500/10' : 'bg-red-500/10'
            )}>
              {isValid ? (
                <CheckCircle className="h-6 w-6 text-green-500" />
              ) : (
                <AlertTriangle className="h-6 w-6 text-red-500" />
              )}
            </div>
            <div>
              <DialogTitle>Apply Configuration Changes</DialogTitle>
              <DialogDescription>
                {hasErrors
                  ? 'Fix validation errors before applying'
                  : dryRun
                  ? 'Preview configuration changes (dry run)'
                  : 'Apply configuration changes to the system'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="summary">
              <FileText className="h-4 w-4 mr-2" />
              Summary
            </TabsTrigger>
            <TabsTrigger value="changes">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Validation
              {validationErrors.length > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 px-1 text-xs">
                  {validationErrors.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          <div className="py-4">
            <TabsContent value="summary">{renderSummary()}</TabsContent>
            <TabsContent value="changes">{renderChanges()}</TabsContent>
            <TabsContent value="settings">{renderSettings()}</TabsContent>
          </div>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isApplying}>
            Cancel
          </Button>
          <Button
            onClick={handleApply}
            disabled={isApplying || !isValid || pendingChanges === 0}
          >
            {isApplying ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Applying...
              </>
            ) : dryRun ? (
              <>
                <FileText className="h-4 w-4 mr-2" />
                Preview
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Apply Changes
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Helper functions
function countNodes(nodes: ConfigNode[]): number {
  let count = 0;
  for (const node of nodes) {
    count++;
    if (node.children) {
      count += countNodes(node.children);
    }
  }
  return count;
}

function getSections(nodes: ConfigNode[]): string[] {
  const sections = new Set<string>();

  const traverse = (nodes: ConfigNode[], path: string[] = []) => {
    for (const node of nodes) {
      const currentPath = [...path, node.name];
      if (node.type === 'object' || node.children) {
        sections.add(currentPath.join('.'));
        if (node.children) {
          traverse(node.children, currentPath);
        }
      }
    }
  };

  traverse(nodes);
  return Array.from(sections).slice(0, 10); // Limit to 10 sections for display
}