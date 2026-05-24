import { useEditor } from "@/store/editor";
import { Button } from "@/components/ui/button";
import { Download, Film, Loader2, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function ExportPanel() {
  const s = useEditor();
  const [phase, setPhase] = useState<"idle" | "rendering" | "done">("idle");

  const start = () => {
    setPhase("rendering");
    setTimeout(() => {
      setPhase("done");
      toast.success("Render complete (mock)");
    }, 2500);
  };

  const totalBubbles = s.contacts.reduce((n, c) => n + c.bubbles.length, 0);

  return (
    <div className="space-y-6">
      <h2 className="font-display text-xl font-semibold">Export video</h2>

      <div className="rounded-xl border bg-gradient-to-br from-card to-muted/40 p-6">
        <div className="flex items-center gap-4">
          <div className="grid h-14 w-14 place-items-center rounded-xl bg-primary/10 text-primary">
            <Film className="h-7 w-7" />
          </div>
          <div className="flex-1">
            <h3 className="font-display text-lg font-semibold">1080 × 1920 · MP4</h3>
            <p className="text-sm text-muted-foreground">
              {s.contacts.length} contact{s.contacts.length === 1 ? "" : "s"} · {totalBubbles} bubbles · {s.ttsProvider}
            </p>
          </div>
          {phase === "idle" && (
            <Button size="lg" onClick={start}>
              <Film className="mr-2 h-4 w-4" /> Render video
            </Button>
          )}
          {phase === "rendering" && (
            <Button size="lg" disabled>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Rendering…
            </Button>
          )}
          {phase === "done" && (
            <Button
              size="lg"
              variant="default"
              onClick={() => toast.info("Hook this up to your backend renderer to download.")}
            >
              <Download className="mr-2 h-4 w-4" /> Download MP4
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Theme" value={s.theme} />
        <Stat label="Bubble" value={s.bubbleColor} />
        <Stat label="Corner radius" value={`${s.cornerRadius}px`} />
        <Stat label="Font size" value={`${s.bubbleFontSize}px`} />
        <Stat label="Reveal anim" value={s.revealAnimation ? "On" : "Off"} />
        <Stat label="Poster mode" value={s.posterEveryPage ? "Every page" : "First page"} />
      </div>

      {phase === "done" && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 text-sm text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="h-4 w-4" />
          Mock render complete. Connect a backend renderer (Lovable Cloud) to ship real MP4s.
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-base font-semibold capitalize">{value}</div>
    </div>
  );
}
