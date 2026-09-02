export function lockPageScroll() {
  const header = document.getElementById('site-header');
  const widthBefore = document.documentElement.clientWidth;
  document.body.style.overflow = 'hidden';
  const gutter = `${Math.max(0, document.documentElement.clientWidth - widthBefore)}px`;
  document.body.style.paddingRight = gutter;
  if (header instanceof HTMLElement) header.style.paddingRight = gutter;

  return () => {
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
    if (header instanceof HTMLElement) header.style.paddingRight = '';
  };
}
