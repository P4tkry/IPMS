type ProjectLogoProps = {
  name: string;
  size?: number;
  className?: string;
};

const getInitials = (value: string) => {
  const name = value.trim();
  if (!name) {
    return "PR";
  }
  if (name.length === 1) {
    return name.toUpperCase();
  }
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const first = parts[0][0] || "";
    const second = parts[1][0] || "";
    return `${first.toUpperCase()}${second.toLowerCase()}`;
  }
  const first = name[0] || "";
  const second = name[1] || "";
  return `${first.toUpperCase()}${second.toLowerCase()}`;
};

export default function ProjectLogo({ name, size = 64, className }: ProjectLogoProps) {
  const initials = getInitials(name);
  return (
    <div
      className={`flex items-center justify-center rounded-xl text-center font-semibold leading-none tracking-[0.06em] shadow-[0_14px_24px_-18px_rgba(20,16,12,0.6)] ${className || ""}`}
      style={{
        width: size,
        height: size,
        background: "linear-gradient(135deg, #031e39 0%, #0f3f68 100%)",
        color: "#9bb6d6",
        fontFamily: "Geist, sans-serif",
      }}
    >
      <span className="inline-block align-middle pl-[0.08em]">{initials}</span>
    </div>
  );
}
