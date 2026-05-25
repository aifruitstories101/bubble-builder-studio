import { useEditor } from "@/store/editor";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

export function AppearancePanel() {
  const s = useEditor();

  return (
    <div className="space-y-6">
      <h2 className="font-display text-xl font-semibold">Appearance</h2>

      <Section title="Theme">
        <div className="flex gap-2">
          {(["light", "dark"] as const).map((t) => (
            <button
              key={t}
              onClick={() => s.patch({ theme: t })}
              className={cn(
                "flex-1 rounded-lg border p-3 text-sm capitalize transition-all",
                s.theme === t ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-muted"
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Bubble color">
        <div className="flex gap-2">
          {(["blue", "green"] as const).map((c) => (
            <button
              key={c}
              onClick={() => s.patch({ bubbleColor: c })}
              className={cn(
                "flex-1 rounded-lg border p-3 text-sm capitalize",
                s.bubbleColor === c && "border-primary ring-1 ring-primary"
              )}
            >
              <div
                className="mx-auto mb-1 h-6 w-12 rounded-full"
                style={{
                  background: c === "blue" ? "var(--imessage-blue)" : "var(--imessage-green)",
                }}
              />
              {c === "blue" ? "iMessage" : "SMS"}
            </button>
          ))}
        </div>
      </Section>

      <Section title={`Bubble font size — ${s.bubbleFontSize}px`}>
        <Slider
          value={[s.bubbleFontSize]}
          min={30}
          max={80}
          step={1}
          onValueChange={(v) => s.patch({ bubbleFontSize: v[0] })}
        />
      </Section>

      <Section title={`Bottom reserve — ${(s.bottomReserveRatio * 100).toFixed(0)}%`}>
        <Slider
          value={[s.bottomReserveRatio]}
          min={0}
          max={0.6}
          step={0.01}
          onValueChange={(v) => s.patch({ bottomReserveRatio: v[0] })}
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Empty space reserved at the bottom of the screen.
        </p>
      </Section>

      <Section title="Toggles">
        <div className="space-y-3">
          <Row>
            <Label>Reveal animation</Label>
            <Switch
              checked={s.revealAnimation}
              onCheckedChange={(v) => s.patch({ revealAnimation: v })}
            />
          </Row>
          <Row>
            <div>
              <Label>Poster on every page</Label>
              <p className="text-xs text-muted-foreground">Off = first page only.</p>
            </div>
            <Switch
              checked={s.posterEveryPage}
              onCheckedChange={(v) => s.patch({ posterEveryPage: v })}
            />
          </Row>
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <h3 className="mb-3 text-sm font-semibold">{title}</h3>
      {children}
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center justify-between gap-3">{children}</div>;
}
