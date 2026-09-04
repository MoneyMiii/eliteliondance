export type Labels = Record<string, string>;
type TVars = Record<string, string | number>;

function fill(template: string, vars?: TVars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, key) => (vars[key] == null ? match : String(vars[key])));
}

export function t(labels: Labels | undefined, key: string, vars?: TVars): string {
  return fill(labels?.[key] ?? '', vars);
}

export function closeLabel(labels?: Labels): string {
  return t(labels, 'common.close') || t(labels, 'gallery.close');
}

export function createT(labels?: Labels) {
  const dict = labels ?? {};
  return (key: string, vars?: TVars) => fill(dict[key] ?? '', vars);
}
