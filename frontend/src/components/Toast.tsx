export default function Toast({ message }: { message: string }) {
  if (!message) return null;

  return (
    <div className="fixed top-20 right-5 z-999 rounded-xl bg-black/80 px-4 py-2 text-sm text-white shadow-lg">
      {message}
    </div>
  );
}
