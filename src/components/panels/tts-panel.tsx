import { useState } from "react";
import { useEditor } from "@/store/editor";
import { ELEVENLABS_VOICES } from "@/lib/voices";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

export function TtsPanel() {
  const s = useEditor();
  const [show, setShow] = useState(false);
  const [customId, setCustomId] = useState("");
  const [customName, setCustomName] = useState("");

  const voices = [...ELEVENLABS_VOICES, ...s.customVoices];

  return (
    <div className="space-y-6">
      <h2 className="font-display text-xl font-semibold">TTS & voices</h2>

      <Section title="Provider">
        <div className="flex gap-2">
          {(["elevenlabs", "ai33pro"] as const).map((p) => (
            <button
              key={p}
              onClick={() => s.patch({ ttsProvider: p })}
              className={cn(
                "flex-1 rounded-lg border p-3 text-sm capitalize",
                s.ttsProvider === p && "border-primary bg-primary/5 ring-1 ring-primary"
              )}
            >
              {p === "elevenlabs" ? "ElevenLabs" : "AI33Pro"}
            </button>
          ))}
        </div>
      </Section>

      <Section title="API key">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              type={show ? "text" : "password"}
              value={s.ttsProvider === "elevenlabs" ? s.apiKeys.elevenlabs : s.apiKeys.ai33pro}
              onChange={(e) =>
                s.patch({
                  apiKeys:
                    s.ttsProvider === "elevenlabs"
                      ? { ...s.apiKeys, elevenlabs: e.target.value }
                      : { ...s.apiKeys, ai33pro: e.target.value },
                })
              }
              placeholder={`Paste ${s.ttsProvider} API key`}
              className="pr-10"
            />
            <button
              onClick={() => setShow((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground">
          Stored locally in your browser. Never logged or sent to our servers.
        </p>
      </Section>

      <Section title="Default voices">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label className="text-xs">Me</Label>
            <Select
              value={s.defaultMeVoice}
              onValueChange={(v) => s.patch({ defaultMeVoice: v })}
            >
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {voices.map((v) => (
                  <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Them</Label>
            <Select
              value={s.defaultThemVoice}
              onValueChange={(v) => s.patch({ defaultThemVoice: v })}
            >
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {voices.map((v) => (
                  <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Section>

      <Section title="Custom voices">
        <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
          <Input
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            placeholder="Name (e.g. My voice clone)"
          />
          <Input
            value={customId}
            onChange={(e) => setCustomId(e.target.value)}
            placeholder="Voice ID"
            className="font-mono text-xs"
          />
          <Button
            disabled={!customId || !customName}
            onClick={() => {
              s.addCustomVoice({ id: customId, name: customName });
              setCustomId(""); setCustomName("");
            }}
          >
            <Plus className="mr-1 h-4 w-4" /> Save
          </Button>
        </div>
        {s.customVoices.length > 0 && (
          <ul className="mt-3 space-y-1">
            {s.customVoices.map((v) => (
              <li key={v.id} className="flex items-center justify-between rounded-md bg-muted px-3 py-1.5 text-xs">
                <span><span className="font-medium">{v.name}</span> <span className="ml-2 font-mono text-muted-foreground">{v.id}</span></span>
                <button onClick={() => s.removeCustomVoice(v.id)} className="text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Voice settings">
        <div className="space-y-4">
          {([
            ["stability", "Stability", 0, 1, 0.01],
            ["similarity", "Similarity boost", 0, 1, 0.01],
            ["style", "Style", 0, 1, 0.01],
            ["speed", "Speed", 0.7, 1.2, 0.01],
          ] as const).map(([k, label, min, max, step]) => (
            <div key={k}>
              <div className="mb-1.5 flex justify-between text-xs">
                <Label>{label}</Label>
                <span className="font-mono text-muted-foreground">
                  {s.voiceSettings[k].toFixed(2)}
                </span>
              </div>
              <Slider
                value={[s.voiceSettings[k]]}
                min={min}
                max={max}
                step={step}
                onValueChange={(v) => s.patch({ voiceSettings: { ...s.voiceSettings, [k]: v[0] } })}
              />
            </div>
          ))}
        </div>
      </Section>

      <Section title="Silence remover">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Enable silence trimming</Label>
            <Switch
              checked={s.silenceTrim.enabled}
              onCheckedChange={(v) => s.patch({ silenceTrim: { ...s.silenceTrim, enabled: v } })}
            />
          </div>
          <div>
            <div className="mb-1.5 flex justify-between text-xs">
              <Label>Threshold ({s.silenceTrim.threshold} dB)</Label>
            </div>
            <Slider
              value={[s.silenceTrim.threshold]}
              min={-60}
              max={-20}
              step={1}
              onValueChange={(v) => s.patch({ silenceTrim: { ...s.silenceTrim, threshold: v[0] } })}
            />
          </div>
          <div>
            <div className="mb-1.5 flex justify-between text-xs">
              <Label>Min silence ({s.silenceTrim.minSilenceMs} ms)</Label>
            </div>
            <Slider
              value={[s.silenceTrim.minSilenceMs]}
              min={50}
              max={1000}
              step={10}
              onValueChange={(v) => s.patch({ silenceTrim: { ...s.silenceTrim, minSilenceMs: v[0] } })}
            />
          </div>
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
