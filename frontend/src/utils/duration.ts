/**
 * Parse an ISO 8601 duration string (e.g. "PT1H2M30.5S") to total seconds.
 * Only the time portion (hours, minutes, seconds) is supported; day/year/month
 * components are not expected for lap timing values and will be ignored.
 * Returns NaN if the string cannot be parsed.
 */
export function parseDuration(iso: string): number {
  const m = iso.match(
    /^P(?:\d+Y)?(?:\d+M)?(?:(\d+)D)?T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?$/,
  );
  if (!m) return NaN;
  const days = Number(m[1] ?? 0);
  const hours = Number(m[2] ?? 0);
  const minutes = Number(m[3] ?? 0);
  const seconds = Number(m[4] ?? 0);
  return days * 24 * 3600 + hours * 3600 + minutes * 60 + seconds;
}

/**
 * Format an ISO 8601 duration string to a human-readable time string.
 * Examples:
 *   "PT1M30.5S"   → "1:30.500"
 *   "PT2H3M4.56S" → "2:03:04.560"
 *   null          → "—"
 * Falls back to the raw string if it cannot be parsed.
 */
export function formatDuration(iso: string | null): string {
  if (!iso) return '—';
  const total = parseDuration(iso);
  if (isNaN(total)) return iso;

  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const rawSecs = total % 60;
  const wholeSeconds = Math.floor(rawSecs);
  const ms = Math.round((rawSecs - wholeSeconds) * 1000);

  const secStr = String(wholeSeconds).padStart(2, '0');
  const msStr = String(ms).padStart(3, '0');

  if (hours > 0) {
    const minStr = String(minutes).padStart(2, '0');
    return `${hours}:${minStr}:${secStr}.${msStr}`;
  }
  return `${minutes}:${secStr}.${msStr}`;
}

/**
 * Given an array of rows with a `name` and `min_laptime` field, returns the
 * names of the runners with the fastest and slowest best lap times.
 */
export function computeFastestSlowest(
  rows: { name: string; min_laptime: string | null }[],
): { fastestMin: string | null; slowestMin: string | null } {
  const valid = rows
    .filter((r) => r.min_laptime !== null)
    .map((r) => ({ name: r.name, secs: parseDuration(r.min_laptime!) }))
    .filter((x) => !isNaN(x.secs));
  if (valid.length === 0) return { fastestMin: null, slowestMin: null };
  const sorted = [...valid].sort((a, b) => a.secs - b.secs);
  return {
    fastestMin: sorted[0].name,
    slowestMin: sorted[sorted.length - 1].name,
  };
}
