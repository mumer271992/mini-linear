export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1">
      <div className="flex w-full flex-col items-center justify-center px-6 py-12 md:w-1/2">
        {children}
      </div>
      <div className="hidden flex-col items-center justify-center bg-zinc-950 px-12 text-center md:flex md:w-1/2">
        <h2 className="max-w-sm text-3xl font-semibold leading-tight tracking-tight text-zinc-50">
          Plan, track, and ship work — all in one place.
        </h2>
        <p className="mt-4 max-w-sm text-zinc-400">
          Mini Linear helps your team move fast without losing track of what
          matters.
        </p>
      </div>
    </div>
  );
}
