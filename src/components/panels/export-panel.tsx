import { useEditor } from "@/store/editor";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Download, Film, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

type Warning = { id: string; message: string };

export function ExportPanel() {
  const s = useEditor();
  const [phase, setPhase] = useState<"idle" | "rendering" | "done">("idle");
  const [progress, setProgress] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const warnings = useMemo<Warning[]>(() => {
    const out: Warning[] = [];
    const knownSfx = new Set<string>([
      "sent",
      "received",
      ...s.sfxLibrary.map((x) => x.id),
      ...s.sfxLibrary.map((x) => x.name.toLowerCase()),
    ]);
    const sfxHasUrl = new Map<string, boolean>([
      ["sent", !!s.sentSfxUrl],
      ["received", !!s.receivedSfxUrl],
      ...s.sfxLibrary.map((x) => [x.id, !!x.url] as [string, boolean]),
    ]);
    const customVoiceIds = new Set(s.customVoices.map((v) => v.id).filter(Boolean));

    if (!s.defaultMeVoice) out.push({ id: "def-me", message: "No default voice for 'me'" });
    if (!s.defaultThemVoice) out.push({ id: "def-them", message: "No default voice for 'them'" });

    s.customVoices.forEach((v) => {
      if (!v.id) {
        out.push({
          id: `voice-${v.name}`,
          message: `Voice ID missing for speaker "${v.name}" — add it in TTS panel`,
        });
      }
    });

    s.contacts.forEach((c) => {
      c.bubbles.forEach((b, i) => {
        const where = `${c.name} · bubble ${i + 1}`;
        if (b.type === "image" && !b.imageUrl) {
          out.push({ id: `img-${c.id}-${b.id}`, message: `${where}: add an image` });
        }
        if (b.type === "text" || b.type === "audio") {
          if (b.speakerVoiceId && !customVoiceIds.has(b.speakerVoiceId)) {
            // assume built-in voice id, fine
          }
          if (!b.speakerVoiceId) {
            const def = b.side === "me" ? s.defaultMeVoice : s.defaultThemVoice;
            if (!def) {
              out.push({
                id: `voice-${c.id}-${b.id}`,
                message: `${where}: assign a voice ID for ${b.side}`,
              });
            }
          }
        }
        if (b.sfx) {
          const known = knownSfx.has(b.sfx) || knownSfx.has(b.sfx.toLowerCase());
          if (!known) {
            out.push({
              id: `sfx-missing-${c.id}-${b.id}`,
              message: `${where}: SFX "${b.sfx}" not in library — upload it in SFX panel`,
            });
          } else if (sfxHasUrl.get(b.sfx) === false || sfxHasUrl.get(b.sfx.toLowerCase()) === false) {
            out.push({
              id: `sfx-noaudio-${c.id}-${b.id}`,
              message: `${where}: SFX "${b.sfx}" has no audio file uploaded`,
            });
          }
        }
      });
    });

    return out;
  }, [s]);

  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);

  const start = () => {
    if (warnings.length > 0) {
      toast.warning(`Rendering with ${warnings.length} warning${warnings.length === 1 ? "" : "s"}`);
    }
    setPhase("rendering");
    setProgress(0);
    const totalMs = 4000;
    const step = 50;
    let elapsed = 0;
    timer.current = setInterval(() => {
      elapsed += step;
      const p = Math.min(100, Math.round((elapsed / totalMs) * 100));
      setProgress(p);
      if (p >= 100) {
        if (timer.current) clearInterval(timer.current);
        setPhase("done");
        toast.success("Render complete (mock)");
      }
    }, step);
  };

  const totalBubbles = s.contacts.reduce((n, c) => n + c.bubbles.length, 0);

  return (
    <div className="space-y-6">
      <h2 className="font-display text-xl font-semibold">Export video</h2>

      {warnings.length > 0 && (
        <div className="rounded-xl border border-amber-400/60 bg-amber-50 p-4 dark:bg-amber-950/30">
          <div className="mb-2 flex items-center gap-2 text-amber-800 dark:text-amber-300">
            <AlertTriangle className="h-4 w-4" />
            <h3 className="text-sm font-semibold">
              {warnings.length} render warning{warnings.length === 1 ? "" : "s"}
            </h3>
          </div>
          <ul className="ml-6 list-disc space-y-1 text-xs text-amber-900 dark:text-amber-200">
            {warnings.slice(0, 12).map((w) => (
              <li key={w.id}>{w.message}</li>
            ))}
            {warnings.length > 12 && <li>…and {warnings.length - 12} more</li>}
          </ul>
        </div>
      )}

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
              onClick={() => toast.info("Hook this up to your backend renderer to download.")}
            >
              <Download className="mr-2 h-4 w-4" /> Download MP4
            </Button>
          )}
        </div>

        {phase !== "idle" && (
          <div className="mt-5 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Render progress</span>
              <span className="font-mono">{progress} / 100</span>
            </div>
            <Progress value={progress} />
          </div>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Theme" value={s.theme} />
        <Stat label="Bubble" value={s.bubbleColor} />
        <Stat label="Font size" value={`${s.bubbleFontSize}px`} />
        <Stat label="Voices" value={String(s.customVoices.length + 2)} />
        <Stat label="SFX library" value={String(s.sfxLibrary.length)} />
        <Stat label="Warnings" value={String(warnings.length)} />
      </div>

      {phase === "done" && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 text-sm text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="h-4 w-4" />
          Mock render complete. Connect a backend renderer to ship real MP4s.
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
