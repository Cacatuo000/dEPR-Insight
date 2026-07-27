import { clsx } from "clsx";

interface GlassPanelProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  as?: "div" | "button";
  onClick?: () => void;
}

export function GlassPanel({
  children,
  className,
  hover = false,
  as: Component = "div",
  onClick,
}: GlassPanelProps) {
  return (
    <Component
      onClick={onClick}
      className={clsx(
        "glass-panel rounded-xl",
        hover && "transition-all hover:bg-surface-variant/40 glow-hover cursor-pointer",
        className
      )}
    >
      {children}
    </Component>
  );
}
