import { Satellite, FileText } from 'lucide-react';
import { PlaceholderPage } from './PlaceholderPage';

export function ForecastPage() {
  return (
    <PlaceholderPage
      eyebrow="Predictive intelligence"
      title="AI Forecast"
      description="Ensemble machine-learning forecasts for river discharge, rainfall, and flood probability up to 7 days ahead."
      icon={<Satellite className="h-6 w-6" />}
      features={[
        '7-day ensemble discharge forecasts',
        'Confidence interval visualization',
        'Anomaly detection on sensor drift',
        'Scenario comparison tooling',
      ]}
    />
  );
}

export function ReportsPage() {
  return (
    <PlaceholderPage
      eyebrow="Compliance"
      title="Reports"
      description="Audit-ready incident reports, regional summaries, and exportable telemetry archives for after-action review."
      icon={<FileText className="h-6 w-6" />}
      features={[
        'Automated daily situation reports',
        'Incident timeline reconstruction',
        'CSV / PDF export pipelines',
        'Regulatory submission templates',
      ]}
    />
  );
}


