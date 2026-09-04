export default function EmptyState({ message }: { message: string }) {
  return (
    <p className="rounded-3xl border border-brand/15 bg-forest px-6 py-10 text-center text-mist">
      {message}
    </p>
  );
}
