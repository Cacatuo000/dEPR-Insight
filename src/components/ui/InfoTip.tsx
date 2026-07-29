"use client";

import { useState, useRef, useEffect, useCallback, useId } from "react";
import { CircleHelp, X } from "lucide-react";

interface InfoTipProps {
  content: string;
  title?: string;
  className?: string;
}

const WIDTH = 256; // w-64
const GAP = 8;
const EST_HEIGHT = 240; // matches max-h-60

export function InfoTip({ content, title, className }: InfoTipProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, below: true, arrowLeft: WIDTH - 20 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tooltipId = useId();

  const clearTimers = useCallback(() => {
    if (openTimer.current) { clearTimeout(openTimer.current); openTimer.current = null; }
    if (closeTimer.current) { clearTimeout(closeTimer.current); closeTimer.current = null; }
  }, []);

  const computePos = useCallback(() => {
    if (!btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - r.bottom;
    const below = spaceBelow >= EST_HEIGHT + GAP || spaceBelow >= r.top;
    let left = r.right - WIDTH;
    left = Math.max(8, Math.min(left, window.innerWidth - WIDTH - 8));
    const arrowLeft = Math.min(Math.max(r.left + r.width / 2 - left - 6, 12), WIDTH - 24);
    setPos({
      top: below ? r.bottom + GAP : r.top - GAP,
      left,
      below,
      arrowLeft,
    });
  }, []);

  const show = useCallback(() => {
    clearTimers();
    openTimer.current = setTimeout(() => { computePos(); setOpen(true); }, 200);
  }, [clearTimers, computePos]);

  const hide = useCallback(() => {
    clearTimers();
    closeTimer.current = setTimeout(() => setOpen(false), 150);
  }, [clearTimers]);

  const toggle = useCallback(() => {
    clearTimers();
    if (open) {
      setOpen(false);
    } else {
      computePos();
      setOpen(true);
    }
  }, [open, clearTimers, computePos]);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (btnRef.current?.contains(t) || popRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    // Close when the page/sidebar scrolls, but allow scrolling inside the tooltip itself
    const onScroll = (e: Event) => {
      if (popRef.current && e.target instanceof Node && popRef.current.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open]);

  useEffect(() => clearTimers, [clearTimers]);

  return (
    <span className={`inline-flex ${className ?? ""}`}>
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        aria-expanded={open}
        aria-describedby={open ? tooltipId : undefined}
        aria-label="Show info"
        className="inline-flex items-center justify-center w-[20px] h-[20px] rounded-full text-primary/45 hover:text-primary hover:bg-primary/10 transition-all cursor-pointer shrink-0 hover:shadow-[0_0_8px_rgba(219,252,255,0.25)]"
      >
        <CircleHelp size={14} />
      </button>
      {open && (
        <div
          ref={popRef}
          onMouseEnter={clearTimers}
          onMouseLeave={hide}
          className="fixed z-50"
          style={{
            top: pos.top,
            left: pos.left,
            transform: pos.below ? undefined : "translateY(-100%)",
          }}
        >
          <div
            id={tooltipId}
            role="tooltip"
            className="relative w-64 max-h-60 overflow-y-auto custom-scrollbar p-3.5 rounded-xl tip-panel shadow-xl shadow-black/50 text-on-surface leading-relaxed animate-fadeIn normal-case"
          >
            {/* Arrow */}
            <div
              className={`absolute w-3 h-3 rotate-45 bg-surface-container-highest border-primary/25 ${
                pos.below ? "-top-[6px] border-l border-t" : "-bottom-[6px] border-r border-b"
              }`}
              style={{ left: pos.arrowLeft }}
            />

            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              {title && (
                <div className="text-[11px] font-bold uppercase tracking-[0.05em] text-primary">{title}</div>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="ml-auto p-0.5 rounded text-on-surface-variant/50 hover:text-on-surface-variant hover:bg-surface-variant/30 transition-colors cursor-pointer shrink-0"
                aria-label="Close"
              >
                <X size={12} />
              </button>
            </div>

            {/* Content */}
            <div className={`text-[11.5px] text-on-surface ${title ? "mt-1.5" : ""}`}>
              {content}
            </div>
          </div>
        </div>
      )}
    </span>
  );
}
