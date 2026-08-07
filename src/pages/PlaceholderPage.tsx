import type { ReactNode } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { GlassCard } from '@/components/ui/GlassCard';
import { Construction } from '@/components/ui/Construction';

interface PlaceholderProps {
  eyebrow: string;
  title: string;
  description: string;
  icon: ReactNode;
  features: string[];
}

/** Shared scaffold for not-yet-deep pages so every route has a real, usable view. */
export function PlaceholderPage({ eyebrow, title, description, icon, features }: PlaceholderProps) {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow={eyebrow} title={title} description={description} />
      <Construction icon={icon} features={features} title={title} />
    </div>
  );
}

export { GlassCard };
