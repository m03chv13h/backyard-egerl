import { getCustomization } from './runnerCustomization';

/**
 * Returns the runner display name.
 * If a name override is set, uses it; otherwise uses the original name.
 * If an emoji is set, appends it at the end.
 * Falls back to the legacy spruce emoji for "fichte" when no customisation exists.
 */
export function displayName(name: string): string {
  const custom = getCustomization(name);
  if (custom) {
    const base = custom.nameOverride || name;
    return custom.emoji ? `${base} ${custom.emoji}` : base;
  }
  // legacy default
  return name.toLowerCase() === 'fichte' ? `${name} 🌲` : name;
}
