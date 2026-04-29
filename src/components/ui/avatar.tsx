import { cn } from "@/lib/utils";

const COLORS = [
  "from-pink-500 to-violet-500",
  "from-cyan-500 to-blue-500",
  "from-emerald-500 to-teal-500",
  "from-amber-500 to-orange-500",
  "from-fuchsia-500 to-rose-500",
  "from-indigo-500 to-cyan-500",
  "from-lime-500 to-emerald-500",
];

function colorFor(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return COLORS[h % COLORS.length];
}

export function Avatar({
  name,
  src,
  size = 32,
  className,
}: {
  name: string;
  src?: string | null;
  size?: number;
  className?: string;
}) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        alt={name}
        src={src}
        width={size}
        height={size}
        className={cn("rounded-full object-cover", className)}
        style={{ width: size, height: size }}
      />
    );
  }
  const initials = name
    .split(/[\s_-]/)
    .filter(Boolean)
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div
      className={cn(
        "rounded-full bg-gradient-to-br flex items-center justify-center text-white font-semibold",
        colorFor(name),
        className,
      )}
      style={{
        width: size,
        height: size,
        fontSize: Math.max(10, size * 0.4),
      }}
    >
      {initials || "?"}
    </div>
  );
}
