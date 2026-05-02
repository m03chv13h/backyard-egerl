/**
 * Returns the runner display name.
 * Appends a spruce emoji (🌲) when the name is "fichte" (case-insensitive).
 */
export function displayName(name: string): string {
  return name.toLowerCase() === 'fichte' ? `${name} 🌲` : name;
}
