import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  type TooltipProps,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { ArrowDown, ArrowUp, Wifi } from 'lucide-react';
import type { TrafficData } from '../../stores/dashboardStore';
import { format } from 'date-fns';

interface TrafficChartProps {
  data: TrafficData[];
  isLoading?: boolean;
  title?: string;
}

// Custom tooltip for better styling
const CustomTooltip = ({
  active,
  payload,
  label,
}: TooltipProps<number, string>) => {
  if (!active || !payload || !payload.length) {
    return null;
  }

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  return (
    <div className="rounded-lg border bg-background p-3 shadow-md">
      <p className="text-sm font-medium mb-2">
        {label ? format(new Date(label), 'HH:mm:ss') : ''}
      </p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2 text-sm">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-medium">{formatBytes(entry.value as number)}</span>
        </div>
      ))}
    </div>
  );
};

export function TrafficChart({ data, isLoading, title = 'Real-time Traffic' }: TrafficChartProps) {
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  const calculateAverage = (key: keyof TrafficData): number => {
    if (data.length === 0) return 0;
    const sum = data.reduce((acc, item) => acc + (item[key] as number), 0);
    return sum / data.length;
  };

  const calculatePeak = (key: keyof TrafficData): number => {
    if (data.length === 0) return 0;
    return Math.max(...data.map((item) => item[key] as number));
  };

  const inboundAvg = calculateAverage('inbound');
  const outboundAvg = calculateAverage('outbound');
  const inboundPeak = calculatePeak('inbound');
  const outboundPeak = calculatePeak('outbound');

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wifi className="h-5 w-5" />
            {title}
          </CardTitle>
          <CardDescription>Live network traffic monitoring</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full flex items-center justify-center">
            <div className="space-y-2">
              <div className="h-4 w-48 bg-muted animate-pulse rounded" />
              <div className="h-4 w-64 bg-muted animate-pulse rounded" />
              <div className="h-4 w-32 bg-muted animate-pulse rounded" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Wifi className="h-5 w-5" />
              {title}
            </CardTitle>
            <CardDescription>Live network traffic monitoring</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-sm">
              <ArrowDown className="h-3 w-3 text-blue-500" />
              <span className="text-muted-foreground">In:</span>
              <span className="font-medium">{formatBytes(inboundAvg)}/s</span>
            </div>
            <div className="flex items-center gap-1 text-sm">
              <ArrowUp className="h-3 w-3 text-green-500" />
              <span className="text-muted-foreground">Out:</span>
              <span className="font-medium">{formatBytes(outboundAvg)}/s</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorInbound" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorOutbound" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" opacity={0.5} />
              <XAxis
                dataKey="timestamp"
                tickFormatter={(value) => format(new Date(value), 'HH:mm:ss')}
                className="text-xs"
                stroke="hsl(var(--muted-foreground))"
              />
              <YAxis
                tickFormatter={formatBytes}
                className="text-xs"
                stroke="hsl(var(--muted-foreground))"
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Area
                type="monotone"
                dataKey="inbound"
                stroke="#3b82f6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorInbound)"
                name="Inbound"
              />
              <Area
                type="monotone"
                dataKey="outbound"
                stroke="#22c55e"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorOutbound)"
                name="Outbound"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        {/* Stats summary */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Avg Inbound</p>
            <p className="font-medium text-blue-500">{formatBytes(inboundAvg)}/s</p>
          </div>
          <div>
            <p className="text-muted-foreground">Avg Outbound</p>
            <p className="font-medium text-green-500">{formatBytes(outboundAvg)}/s</p>
          </div>
          <div>
            <p className="text-muted-foreground">Peak Inbound</p>
            <p className="font-medium">{formatBytes(inboundPeak)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Peak Outbound</p>
            <p className="font-medium">{formatBytes(outboundPeak)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}