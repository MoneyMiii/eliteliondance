export default function EmptyState({ message, i18n }: { message: string; i18n?: string }) {
  return (
    <p
      className="rounded-3xl border border-brand/15 bg-forest px-6 py-10 text-center text-mist"
      data-i18n={i18n}
      data-i18n-empty={i18n ? 'hide' : undefined}
      hidden={!message}
    >
      {message}
    </p>
  );
}
