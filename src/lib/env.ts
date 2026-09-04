export function readEnv(name: string): string {
  const fromImport = (import.meta.env as Record<string, string | undefined>)[name];
  const fromProcess = typeof process !== 'undefined' ? process.env[name] : undefined;
  return (fromImport || fromProcess || '').trim().replace(/^["']|["']$/g, '');
}
