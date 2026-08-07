import { Play, Pause, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface TimelineSliderProps {
  /** Number of frames in the animation. */
  frames: number;
  /** Current frame index. */
  frame: number;
  onFrameChange: (frame: number) => void;
  /** ms between frames when playing. */
  intervalMs?: number;
  /** Label for the timeline, e.g. "Radar — past 2h". */
  label?: string;
}

/** Animated timeline scrubber with play/pause and frame markers. */
export function TimelineSlider({
  frames,
  frame,
  onFrameChange,
  intervalMs = 700,
  label = 'Timeline',
}: TimelineSliderProps) {
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      onFrameChange((frame + 1) % frames);
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [playing, frame, frames, intervalMs, onFrameChange]);

  const pct = frames > 1 ? (frame / (frames - 1)) * 100 : 0;

  return (
    <div className="glass-panel p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-brand-500" />
          <span className="text-sm font-semibold text-ink-800 dark:text-ink-100">{label}</span>
        </div>
        <button
          onClick={() => setPlaying((p) => !p)}
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-lg transition',
            playing
              ? 'bg-brand-600 text-white hover:bg-brand-700'
              : 'bg-ink-100 text-ink-600 hover:bg-ink-200 dark:bg-ink-800 dark:text-ink-300',
          )}
          aria-label={playing ? 'Pause' : 'Play'}
        >
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </button>
      </div>

      <div className="relative">
        <div className="h-2 w-full overflow-hidden rounded-full bg-ink-200/70 dark:bg-ink-800/70">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-500 transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
        <input
          type="range"
          min={0}
          max={Math.max(0, frames - 1)}
          value={frame}
          onChange={(e) => {
            setPlaying(false);
            onFrameChange(Number(e.target.value));
          }}
          className="absolute inset-0 h-2 w-full cursor-pointer opacity-0"
          aria-label="Timeline frame"
        />
      </div>

      <div className="mt-2 flex items-center justify-between text-[11px] text-ink-400 dark:text-ink-500">
        <span>Frame {frame + 1} / {frames}</span>
        <span>{playing ? 'Auto-playing' : 'Paused'}</span>
      </div>
    </div>
  );
}
