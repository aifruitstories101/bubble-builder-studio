import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { useEditor } from "@/store/editor";
import { parseScriptForAssets } from "@/lib/script-parser";
import { buildCynoPayload, downloadPayload, speakerPrefixFor } from "@/lib/cyno6-runner";
import { ELEVENLABS_VOICES } from "@/lib/voices";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  Eye,
  EyeOff,
  Film,
  FileCode2,
  Image as ImageIcon,
  Loader2,
  Mic,
  Music4,
  Play,
  Sparkles,
  Upload,
  User as UserIcon,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({ component: App });

function readFile(accept: string, cb: (url: string, name: string) => void) {
  const inp = document.createElement("input");
  inp.type = "file";
  inp.accept = accept;
  inp.onchange = () => {
    const f = inp.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => cb(String(r.result), f.name);
    r.readAsDataURL(f);
  };
  inp.click();
}

function App() {
  const s = useEditor();
  const [phase, setPhase] = useState<"idle" | "rendering" | "done">("idle");
  const [progress, setProgress] = useState(0);
  const [showKey, setShowKey] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const parse = () => {
    const parsed = parseScriptForAssets(s.script);
    s.applyDetected(parsed);
    toast.success(
      `Detected ${parsed.speakers.length} speakers, ${parsed.sfx.length} SFX, ${parsed.images.length} images, ${parsed.contactAvatars.length} contact avatars`
    );
  };

  const uploadScript = () =>
    readFile(".txt,text/plain", (url) => {
      fetch(url)
        .then((r) => r.text())
        .then((txt) => {
          s.setScript(txt);
          const parsed = parseScriptForAssets(txt);
          s.applyDetected(parsed);
          toast.success("Script imported & parsed");
        });
    });

  const voiceMap = useMemo(
    () => new Map(s.customVoices.map((v) => [v.name, v.id])),
    [s.customVoices]
  );

  const warnings = useMemo(() => {
    const w: string[] = [];
    s.detectedSpeakers.forEach((n) => {
      if (!voiceMap.get(n)) w.push(`Add a voice ID for speaker "${n}"`);
    });
    s.detectedSfx.forEach((name) => {
      const f = s.sfxLibrary.find((x) => x.name.toLowerCase() === name.toLowerCase());
      if (!f?.url) w.push(`Upload audio for SFX "${name}"`);
    });
    s.detectedImages.forEach((f) => {
      if (!s.imageAssets[f]) w.push(`Upload image file "${f}"`);
    });
    s.detectedContactAvatars.forEach((f) => {
      if (!s.contactAvatarAssets[f]) w.push(`Upload contact avatar "${f}"`);
    });
    if (!s.sentSfxUrl) w.push("Upload Sent SFX audio");
    if (!s.receivedSfxUrl) w.push("Upload Received SFX audio");
    const key = s.ttsProvider === "elevenlabs" ? s.apiKeys.elevenlabs : s.apiKeys.ai33pro;
    if (!key) w.push(`Add your ${s.ttsProvider} API key`);
    return w;
  }, [s, voiceMap]);

  const render = () => {
    if (warnings.length > 0) {
      toast.warning(`Downloading with ${warnings.length} warning${warnings.length === 1 ? "" : "s"}`);
    }
    const payload = buildCynoPayload(s);
    downloadPayload(payload);
    toast.success("Render payload downloaded — pass to cyno6.js");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <header className="border-b bg-background/80 backdrop-blur sticky top-0 z-10">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-6 py-4">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <h1 className="font-display text-lg font-semibold leading-tight">Cyno Studio</h1>
            <p className="text-xs text-muted-foreground">Script → cyno6.js renderer</p>
          </div>
          <div className="text-xs text-muted-foreground">
            {warnings.length === 0 ? (
              <span className="inline-flex items-center gap-1 text-emerald-600">
                <CheckCircle2 className="h-3.5 w-3.5" /> Ready to render
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-amber-600">
                <AlertTriangle className="h-3.5 w-3.5" /> {warnings.length} item{warnings.length === 1 ? "" : "s"} needed
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-6 py-8">
        {/* Script */}
        <Section
          icon={<FileCode2 className="h-4 w-4" />}
          title="1. Script"
          subtitle="Paste or upload your script. We'll auto-detect speakers, SFX, images and contact avatars."
          actions={
            <>
              <Button size="sm" variant="outline" onClick={uploadScript}>
                <Upload className="mr-1.5 h-3.5 w-3.5" /> Upload .txt
              </Button>
              <Button size="sm" onClick={parse}>
                <Sparkles className="mr-1.5 h-3.5 w-3.5" /> Detect assets
              </Button>
            </>
          }
        >
          <Textarea
            value={s.script}
            onChange={(e) => s.setScript(e.target.value)}
            spellCheck={false}
            className="min-h-[280px] font-mono text-xs leading-relaxed"
            placeholder={`iMessage: John\nSara>me: Hey [sent]\nthem: 1.jpg\n<break: 2s>`}
          />
        </Section>

        {/* Provider + keys */}
        <Section
          icon={<Mic className="h-4 w-4" />}
          title="2. TTS provider"
          subtitle={`Script speaker prefix: ${speakerPrefixFor(s.ttsProvider)}>side: text`}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="text-xs">Provider</Label>
              <div className="mt-1 flex gap-2">
                {(["elevenlabs", "ai33pro", "minimax"] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => s.patch({ ttsProvider: p })}
                    className={cn(
                      "flex-1 rounded-md border px-3 py-2 text-xs capitalize",
                      s.ttsProvider === p && "border-primary bg-primary/5 ring-1 ring-primary"
                    )}
                  >
                    {p === "elevenlabs" ? "ElevenLabs" : p === "ai33pro" ? "AI33Pro" : "MiniMax"}
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-[11px] text-muted-foreground">
                Use <code className="font-mono">{speakerPrefixFor(s.ttsProvider)}&gt;me:</code> /{" "}
                <code className="font-mono">{speakerPrefixFor(s.ttsProvider)}&gt;them:</code> in script.
              </p>
            </div>
            <div>
              <Label className="text-xs">API key</Label>
              <div className="relative mt-1">
                <Input
                  type={showKey ? "text" : "password"}
                  value={
                    s.ttsProvider === "elevenlabs"
                      ? s.apiKeys.elevenlabs
                      : s.ttsProvider === "minimax"
                        ? s.apiKeys.minimax
                        : s.apiKeys.ai33pro
                  }
                  onChange={(e) => {
                    const v = e.target.value;
                    s.patch({
                      apiKeys:
                        s.ttsProvider === "elevenlabs"
                          ? { ...s.apiKeys, elevenlabs: v }
                          : s.ttsProvider === "minimax"
                            ? { ...s.apiKeys, minimax: v }
                            : { ...s.apiKeys, ai33pro: v },
                    });
                  }}
                  className="pr-9 font-mono text-xs"
                  placeholder="Paste API key"
                />
                <button
                  onClick={() => setShowKey((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>


          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {(
              [
                ["stability", "Stability", 0, 1, 0.01],
                ["similarity", "Similarity", 0, 1, 0.01],
                ["style", "Style", 0, 1, 0.01],
                ["speed", "Speed", 0.7, 1.2, 0.01],
              ] as const
            ).map(([k, lbl, min, max, step]) => (
              <div key={k}>
                <div className="mb-1 flex justify-between text-xs">
                  <Label>{lbl}</Label>
                  <span className="font-mono text-muted-foreground">
                    {s.voiceSettings[k].toFixed(2)}
                  </span>
                </div>
                <Slider
                  value={[s.voiceSettings[k]]}
                  min={min}
                  max={max}
                  step={step}
                  onValueChange={(v) =>
                    s.patch({ voiceSettings: { ...s.voiceSettings, [k]: v[0] } })
                  }
                />
              </div>
            ))}
          </div>
        </Section>

        {/* Speakers */}
        <Section
          icon={<UserIcon className="h-4 w-4" />}
          title="3. Speakers"
          subtitle={
            s.detectedSpeakers.length
              ? `${s.detectedSpeakers.length} detected — assign a voice ID to each.`
              : "No speakers detected yet. Click 'Detect assets'."
          }
        >
          {s.detectedSpeakers.length === 0 ? (
            <Empty text="No speakers found in script." />
          ) : (
            <ul className="space-y-2">
              {s.detectedSpeakers.map((name) => {
                const id = voiceMap.get(name) || "";
                const missing = !id;
                return (
                  <li
                    key={name}
                    className="grid grid-cols-[1fr_2fr_auto] items-center gap-2 rounded-md border bg-card px-3 py-2"
                  >
                    <span className="text-sm font-medium">{name}</span>
                    <Input
                      value={id}
                      onChange={(e) => s.setVoiceId(name, e.target.value)}
                      placeholder="Voice ID (e.g. JBFqnCBsd6RMkjVDRZzb)"
                      className={cn(
                        "h-8 font-mono text-xs",
                        missing && "border-amber-400 focus-visible:ring-amber-400"
                      )}
                    />
                    <Badge ok={!missing} okText="Set" warnText="Add ID" />
                  </li>
                );
              })}
            </ul>
          )}
        </Section>

        {/* SFX */}
        <Section
          icon={<Music4 className="h-4 w-4" />}
          title="4. Sound effects"
          subtitle="Default Sent/Received plus any [tokens] in your script."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <SfxRow
              label="Sent"
              name={s.sentSfx}
              url={s.sentSfxUrl}
              onName={(v) => s.patch({ sentSfx: v })}
              onUpload={() =>
                readFile("audio/*", (url) =>
                  s.patch({ sentSfxUrl: url })
                )
              }
            />
            <SfxRow
              label="Received"
              name={s.receivedSfx}
              url={s.receivedSfxUrl}
              onName={(v) => s.patch({ receivedSfx: v })}
              onUpload={() =>
                readFile("audio/*", (url) =>
                  s.patch({ receivedSfxUrl: url })
                )
              }
            />
          </div>

          {s.detectedSfx.length === 0 ? (
            <div className="mt-3">
              <Empty text="No custom SFX tokens detected." />
            </div>
          ) : (
            <ul className="mt-3 space-y-2">
              {s.detectedSfx.map((name) => {
                const entry = s.sfxLibrary.find(
                  (x) => x.name.toLowerCase() === name.toLowerCase()
                );
                const hasFile = !!entry?.url;
                return (
                  <li
                    key={name}
                    className="grid grid-cols-[1fr_auto_auto] items-center gap-2 rounded-md border bg-card px-3 py-2"
                  >
                    <span className="text-sm font-medium">[{name}]</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => entry?.url && new Audio(entry.url).play()}
                      disabled={!hasFile}
                    >
                      <Play className="h-3.5 w-3.5" />
                    </Button>
                    <div className="flex items-center gap-2">
                      <Badge ok={hasFile} okText="Uploaded" warnText="Missing" />
                      <Button
                        size="sm"
                        variant={hasFile ? "ghost" : "default"}
                        onClick={() =>
                          readFile("audio/*", (url) => s.addSfxFile(name, url))
                        }
                      >
                        <Upload className="mr-1 h-3.5 w-3.5" />{" "}
                        {hasFile ? "Replace" : "Upload"}
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Section>

        {/* Images */}
        <Section
          icon={<ImageIcon className="h-4 w-4" />}
          title="5. Images"
          subtitle="Upload each image referenced in your script (e.g. 1.jpg, 2.png)."
        >
          {s.detectedImages.length === 0 ? (
            <Empty text="No image filenames detected." />
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {s.detectedImages.map((file) => (
                <AssetRow
                  key={file}
                  file={file}
                  url={s.imageAssets[file]}
                  onUpload={() =>
                    readFile("image/*", (url) => s.setImageAsset(file, url))
                  }
                />
              ))}
            </div>
          )}
        </Section>

        {/* Contact avatars */}
        <Section
          icon={<UserIcon className="h-4 w-4" />}
          title="6. Contact avatars"
          subtitle="Avatars referenced after iMessage: lines."
        >
          {s.detectedContactAvatars.length === 0 ? (
            <Empty text="No contact avatar files referenced." />
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {s.detectedContactAvatars.map((file) => (
                <AssetRow
                  key={file}
                  file={file}
                  url={s.contactAvatarAssets[file]}
                  onUpload={() =>
                    readFile("image/*", (url) => s.setContactAvatarAsset(file, url))
                  }
                />
              ))}
            </div>
          )}
        </Section>

        {/* Render */}
        <Section icon={<Film className="h-4 w-4" />} title="7. Render with cyno6.js">
          {warnings.length > 0 && (
            <div className="mb-4 rounded-lg border border-amber-400/60 bg-amber-50 p-3 dark:bg-amber-950/30">
              <div className="mb-1.5 flex items-center gap-2 text-amber-800 dark:text-amber-300">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm font-semibold">
                  {warnings.length} item{warnings.length === 1 ? "" : "s"} need attention
                </span>
              </div>
              <ul className="ml-6 list-disc space-y-0.5 text-xs text-amber-900 dark:text-amber-200">
                {warnings.slice(0, 10).map((w) => (
                  <li key={w}>{w}</li>
                ))}
                {warnings.length > 10 && <li>…and {warnings.length - 10} more</li>}
              </ul>
            </div>
          )}

          <div className="flex items-center gap-3">
            {phase === "rendering" ? (
              <Button size="lg" disabled>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Rendering…
              </Button>
            ) : phase === "done" ? (
              <Button
                size="lg"
                onClick={() => {
                  const payload = buildCynoPayload(s);
                  const blob = new Blob([JSON.stringify(payload, null, 2)], {
                    type: "application/json",
                  });
                  const a = document.createElement("a");
                  a.href = URL.createObjectURL(blob);
                  a.download = "cyno6-payload.json";
                  a.click();
                }}
              >
                <Download className="mr-2 h-4 w-4" /> Download payload
              </Button>
            ) : (
              <Button size="lg" onClick={render}>
                <Film className="mr-2 h-4 w-4" /> Render video
              </Button>
            )}
            {phase === "done" && (
              <Button variant="outline" onClick={() => setPhase("idle")}>
                Render again
              </Button>
            )}
          </div>

          {phase !== "idle" && (
            <div className="mt-4 space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Render progress</span>
                <span className="font-mono">{progress} / 100</span>
              </div>
              <Progress value={progress} />
            </div>
          )}
        </Section>
      </main>
    </div>
  );
}

function Section({
  icon,
  title,
  subtitle,
  actions,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
            {icon}
          </div>
          <div>
            <h2 className="font-display text-base font-semibold leading-tight">{title}</h2>
            {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
      </div>
      {children}
    </section>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-md border border-dashed py-6 text-center text-xs text-muted-foreground">
      {text}
    </div>
  );
}

function Badge({ ok, okText, warnText }: { ok: boolean; okText: string; warnText: string }) {
  return ok ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
      <CheckCircle2 className="h-3 w-3" /> {okText}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
      <AlertTriangle className="h-3 w-3" /> {warnText}
    </span>
  );
}

function SfxRow({
  label,
  name,
  url,
  onName,
  onUpload,
}: {
  label: string;
  name: string;
  url?: string;
  onName: (v: string) => void;
  onUpload: () => void;
}) {
  return (
    <div className="rounded-md border bg-card p-3">
      <div className="mb-2 flex items-center justify-between">
        <Label className="text-xs">{label}</Label>
        <Badge ok={!!url} okText="Uploaded" warnText="Missing" />
      </div>
      <div className="flex gap-2">
        <Input value={name} onChange={(e) => onName(e.target.value)} className="h-8 text-xs" />
        <Button
          size="sm"
          variant="outline"
          onClick={() => url && new Audio(url).play()}
          disabled={!url}
        >
          <Play className="h-3.5 w-3.5" />
        </Button>
        <Button size="sm" onClick={onUpload}>
          <Upload className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

function AssetRow({
  file,
  url,
  onUpload,
}: {
  file: string;
  url?: string;
  onUpload: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-md border bg-card p-2">
      <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-md bg-muted">
        {url ? (
          <img src={url} alt={file} className="h-full w-full object-cover" />
        ) : (
          <ImageIcon className="h-5 w-5 text-muted-foreground" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate font-mono text-xs">{file}</div>
        <Badge ok={!!url} okText="Uploaded" warnText="Missing" />
      </div>
      <Button size="sm" variant={url ? "ghost" : "default"} onClick={onUpload}>
        <Upload className="mr-1 h-3.5 w-3.5" /> {url ? "Replace" : "Upload"}
      </Button>
    </div>
  );
}

function VoicePicker({
  label,
  value,
  onChange,
  extra,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  extra: { id: string; name: string }[];
}) {
  const all = [...ELEVENLABS_VOICES, ...extra.filter((v) => v.id)];
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="mt-1 h-9 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {all.map((v) => (
            <SelectItem key={v.id} value={v.id} className="text-xs">
              {v.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
