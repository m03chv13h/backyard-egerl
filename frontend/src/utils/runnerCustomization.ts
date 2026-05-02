const STORAGE_KEY = 'runner_customizations';

export interface RunnerCustomization {
  emoji: string;
  nameOverride: string;
  statusOverride?: string;
}

export type RunnerCustomizations = Record<string, RunnerCustomization>;

export function loadCustomizations(): RunnerCustomizations {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as RunnerCustomizations;
  } catch {
    return {};
  }
}

export function saveCustomizations(data: RunnerCustomizations): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getCustomization(name: string): RunnerCustomization | undefined {
  return loadCustomizations()[name];
}

/**
 * Returns the effective status for a runner, taking status overrides into account.
 * Falls back to the original API status when no override is set.
 */
export function getEffectiveStatus(name: string, apiStatus: string): string {
  const custom = getCustomization(name);
  return custom?.statusOverride || apiStatus;
}

export function setCustomization(
  name: string,
  custom: RunnerCustomization,
): void {
  const all = loadCustomizations();
  if (!custom.emoji && !custom.nameOverride && !custom.statusOverride) {
    delete all[name];
  } else {
    all[name] = custom;
  }
  saveCustomizations(all);
}
