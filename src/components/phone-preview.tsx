import { useEditor } from "@/store/editor";
import { cn } from "@/lib/utils";
import { Sparkles, Megaphone } from "lucide-react";

export function PhonePreview() {
  const {
    contacts,
    activeContactId,
    theme,
    bubbleColor,
    cornerRadius,
    bubbleFontSize,
    bgColor,
    revealAnimation,
    bottomReserveRatio,
  } = useEditor();
  const c = contacts.find((x) => x.id === activeContactId);
  if (!c) return null;

  const dark = theme === "dark";
  const meColor = bubbleColor === "green" ? "var(--imessage-green)" : "var(--imessage-blue)";
  const themColor = dark ? "oklch(0.27 0.02 256)" : "var(--imessage-gray)";
  const themText = dark ? "white" : "oklch(0.2 0.03 256)";

  return (
    <div className="sticky top-6 flex items-start justify-center">
      <div className="relative">
        <div
          className="phone-shadow relative overflow-hidden rounded-[44px] border-[10px] border-black"
          style={{ width: 330, height: 660, background: bgColor }}
        >
          {/* iMessage screen */}
          <div
            className="absolute inset-0 flex flex-col"
            style={{
              background: dark ? "#000" : "#fefefe",
              color: dark ? "#fff" : "#111",
            }}
          >
            {/* Notch */}
            <div className="relative z-10 flex h-7 items-center justify-center">
              <div className="h-5 w-24 rounded-b-2xl bg-black" />
            </div>
            {/* Header */}
            <div
              className="flex flex-col items-center gap-1 px-3 pb-3 pt-1"
              style={{ background: dark ? "#1b191c" : "#F2F2F7" }}
            >
              <div
                className="grid h-12 w-12 place-items-center rounded-full text-sm font-semibold"
                style={{
                  background: dark ? "#2a2a2c" : "#d1d1d6",
                  backgroundImage: c.avatarUrl ? `url(${c.avatarUrl})` : undefined,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  color: dark ? "#fff" : "#333",
                }}
              >
                {!c.avatarUrl && c.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex items-center gap-1 text-[11px] font-medium">
                {c.name}
                {c.unread > 0 && (
                  <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[9px] text-white">
                    {c.unread}
                  </span>
                )}
              </div>
            </div>

            {/* Messages */}
            <div
              className="flex-1 overflow-hidden px-3 py-3"
              style={{
                paddingBottom: `${bottomReserveRatio * 100}%`,
              }}
            >
              <div className="flex flex-col gap-1.5">
                {c.bubbles.map((b, i) => {
                  const isMe = b.side === "me";
                  if (b.type === "break")
                    return (
                      <div
                        key={b.id}
                        className="my-1 self-center text-[10px] uppercase tracking-wider opacity-40"
                      >
                        — {b.breakSeconds ?? 2}s pause —
                      </div>
                    );
                  if (b.type === "audio" || b.type === "none") return null;
                  if (b.type === "promo")
                    return (
                      <div
                        key={b.id}
                        className={cn(
                          "max-w-[80%] rounded-2xl p-2 text-[11px] shadow-sm",
                          isMe ? "self-end" : "self-start"
                        )}
                        style={{
                          background:
                            b.promoKind === "rizz"
                              ? "linear-gradient(135deg, #ff6b6b, #c44569)"
                              : "linear-gradient(135deg, #4f46e5, #06b6d4)",
                          color: "white",
                          borderRadius: cornerRadius,
                        }}
                      >
                        <div className="flex items-center gap-1.5 text-[10px] font-semibold opacity-90">
                          <Megaphone className="h-3 w-3" />
                          {b.promoKind === "rizz" ? "Rizz" : "Plug AI"}
                        </div>
                        <div className="mt-0.5">{b.promoIntroText || "Promo card"}</div>
                      </div>
                    );
                  if (b.type === "image")
                    return (
                      <div
                        key={b.id}
                        className={cn("max-w-[70%]", isMe ? "self-end" : "self-start")}
                      >
                        <div
                          className="h-28 w-40 bg-cover bg-center"
                          style={{
                            borderRadius: cornerRadius,
                            backgroundImage: b.imageUrl
                              ? `url(${b.imageUrl})`
                              : "linear-gradient(135deg,#94a3b8,#cbd5e1)",
                          }}
                        />
                      </div>
                    );
                  return (
                    <div
                      key={b.id}
                      className={cn(
                        "max-w-[78%] px-3 py-1.5 leading-snug shadow-sm",
                        isMe ? "self-end" : "self-start",
                        revealAnimation && "animate-fade-in"
                      )}
                      style={{
                        background: isMe ? meColor : themColor,
                        color: isMe ? "white" : themText,
                        fontSize: bubbleFontSize * 0.7,
                        borderRadius: cornerRadius,
                        animationDelay: `${Math.min(i * 30, 600)}ms`,
                      }}
                    >
                      {b.text || <span className="opacity-40">…</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <Sparkles className="h-3 w-3" /> Live preview · 1080×1920
        </div>
      </div>
    </div>
  );
}
