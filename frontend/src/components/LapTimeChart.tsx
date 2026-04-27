import { useMemo } from 'react';
import { parseDuration, formatDuration } from '../utils/duration';

interface LapTimeChartProps {
  name: string;
  laps: string[];
}

const W = 480;
const H = 140;
const PAD = { top: 12, right: 12, bottom: 28, left: 52 };
const INNER_W = W - PAD.left - PAD.right;
const INNER_H = H - PAD.top - PAD.bottom;

/** Number of Y-axis grid lines / labels to target */
const Y_TICKS = 4;
/** Fallback Y-axis range in seconds when all lap times are identical */
const DEFAULT_RANGE_SECONDS = 60;

function niceStep(range: number, ticks: number): number {
  const raw = range / ticks;
  const magnitude = Math.pow(10, Math.floor(Math.log10(raw)));
  const normalized = raw / magnitude;
  let nice: number;
  if (normalized <= 1) nice = 1;
  else if (normalized <= 2) nice = 2;
  else if (normalized <= 5) nice = 5;
  else nice = 10;
  return nice * magnitude;
}

export function LapTimeChart({ name, laps }: LapTimeChartProps) {
  const data = useMemo(
    () =>
      laps
        .map((iso, i) => ({
          lap: i + 1,
          seconds: parseDuration(iso),
          label: formatDuration(iso),
        }))
        .filter((d) => !isNaN(d.seconds)),
    [laps],
  );

  if (data.length < 2) return null;

  const secValues = data.map((d) => d.seconds);
  const minSec = Math.min(...secValues);
  const maxSec = Math.max(...secValues);
  const avgSec = secValues.reduce((a, b) => a + b, 0) / data.length;

  /* Build nice Y-axis ticks */
  const rawRange = maxSec - minSec || DEFAULT_RANGE_SECONDS;
  const step = niceStep(rawRange * 1.2, Y_TICKS);
  const yMin = Math.floor(minSec / step) * step;
  const yMax = Math.ceil(maxSec / step) * step;
  const yRange = yMax - yMin || step;

  const xScale = (lap: number) =>
    data.length > 1 ? ((lap - 1) / (data.length - 1)) * INNER_W : INNER_W / 2;

  const yScale = (sec: number) =>
    INNER_H - ((sec - yMin) / yRange) * INNER_H;

  const polyPoints = data
    .map((d) => `${xScale(d.lap).toFixed(1)},${yScale(d.seconds).toFixed(1)}`)
    .join(' ');

  const avgY = yScale(avgSec);

  /* Y-axis ticks */
  const yTicks: number[] = [];
  for (let t = yMin; t <= yMax + 0.001; t += step) yTicks.push(t);

  /* X-axis: show label every N laps to avoid crowding */
  const maxXLabels = 10;
  const xLabelStep = Math.ceil(data.length / maxXLabels);

  /* Index of fastest lap */
  const fastestIdx = secValues.reduce(
    (best, s, i) => (s < secValues[best] ? i : best),
    0,
  );

  /* Format seconds as mm:ss for Y labels */
  const fmtSec = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.round(s % 60);
    return `${m}:${String(sec).padStart(2, '0')}`;
  };

  return (
    <div className="lap-chart-wrapper">
      <div className="lap-chart-name">{name}</div>
      <svg
        className="lap-chart-svg"
        viewBox={`0 0 ${W} ${H}`}
        aria-label={`Lap time chart for ${name}`}
      >
        <g transform={`translate(${PAD.left},${PAD.top})`}>
          {/* Y-axis grid lines + labels */}
          {yTicks.map((t) => {
            const y = yScale(t);
            if (y < -1 || y > INNER_H + 1) return null;
            return (
              <g key={t}>
                <line
                  x1={0}
                  x2={INNER_W}
                  y1={y}
                  y2={y}
                  className="lap-chart-grid"
                />
                <text
                  x={-6}
                  y={y}
                  dy="0.35em"
                  textAnchor="end"
                  className="lap-chart-axis-label"
                >
                  {fmtSec(t)}
                </text>
              </g>
            );
          })}

          {/* Average reference line */}
          <line
            x1={0}
            x2={INNER_W}
            y1={avgY}
            y2={avgY}
            className="lap-chart-avg"
          />
          <text
            x={INNER_W + 4}
            y={avgY}
            dy="0.35em"
            className="lap-chart-avg-label"
          >
            avg
          </text>

          {/* Lap time line */}
          <polyline
            points={polyPoints}
            className="lap-chart-line"
          />

          {/* Data points */}
          {data.map((d, i) => (
            <circle
              key={d.lap}
              cx={xScale(d.lap)}
              cy={yScale(d.seconds)}
              r={i === fastestIdx ? 4.5 : 3}
              className={
                i === fastestIdx ? 'lap-chart-dot fastest' : 'lap-chart-dot'
              }
            >
              <title>{`Lap ${d.lap}: ${d.label}`}</title>
            </circle>
          ))}

          {/* X-axis labels */}
          {data
            .filter((d) => d.lap === 1 || (d.lap - 1) % xLabelStep === 0)
            .map((d) => (
              <text
                key={d.lap}
                x={xScale(d.lap)}
                y={INNER_H + 16}
                textAnchor="middle"
                className="lap-chart-axis-label"
              >
                {d.lap}
              </text>
            ))}

          {/* Axis lines */}
          <line x1={0} x2={0} y1={0} y2={INNER_H} className="lap-chart-axis" />
          <line x1={0} x2={INNER_W} y1={INNER_H} y2={INNER_H} className="lap-chart-axis" />
        </g>
      </svg>
    </div>
  );
}
