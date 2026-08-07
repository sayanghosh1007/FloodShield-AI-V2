import { TrendingUp, Droplets, Wind, Gauge } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Sparkline } from '@/components/ui/Sparkline';

interface WeatherChartsProps {
  series: {
    temperature: number[];
    rainfall: number[];
    wind: number[];
    humidity: number[];
    pressure: number[];
  };
}

function ChartCard({
  title,
  unit,
  values,
  color,
  icon,
}: {
  title: string;
  unit: string;
  values: number[];
  color: string;
  icon: React.ReactNode;
}) {
  const current = values[values.length - 1] ?? 0;
  const max = Math.max(...values);
  const min = Math.min(...values);
  return (
    <GlassCard className="p-4" hover>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: `${color}20`, color }}>
            {icon}
          </span>
          <span className="text-[13px] font-medium text-ink-700 dark:text-ink-200">{title}</span>
        </div>
        <span className="text-[11px] text-ink-400 dark:text-ink-500">24h</span>
      </div>
      <div className="mt-3 flex items-baseline gap-1">
        <span className="stat-value text-2xl text-ink-900 dark:text-white">{current.toFixed(1)}</span>
        <span className="text-xs text-ink-400 dark:text-ink-500">{unit}</span>
      </div>
      <div className="mt-2 h-12" style={{ color }}>
        <Sparkline values={values} className="h-12 w-full" color="currentColor" />
      </div>
      <div className="mt-2 flex justify-between text-[11px] text-ink-400 dark:text-ink-500">
        <span>Low {min.toFixed(1)}</span>
        <span>High {max.toFixed(1)}</span>
      </div>
    </GlassCard>
  );
}

export function WeatherCharts({ series }: WeatherChartsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <ChartCard title="Temperature" unit="°C" values={series.temperature} color="#ef4444" icon={<TrendingUp className="h-4 w-4" />} />
      <ChartCard title="Rainfall" unit="mm" values={series.rainfall} color="#0284c7" icon={<Droplets className="h-4 w-4" />} />
      <ChartCard title="Wind Speed" unit="km/h" values={series.wind} color="#0ea5e9" icon={<Wind className="h-4 w-4" />} />
      <ChartCard title="Pressure" unit="hPa" values={series.pressure} color="#6366f1" icon={<Gauge className="h-4 w-4" />} />
    </div>
  );
}
