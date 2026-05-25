import { useEditor, type Bubble } from "@/store/editor";
import { ELEVENLABS_VOICES } from "@/lib/voices";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  GripVertical,
  X,
  Type,
  Image as ImageIcon,
  Mic,
  Clock,
  Megaphone,
  CircleSlash,
  AlertTriangle,
} from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";

const TYPES: { value: Bubble["type"]; label: string; icon: typeof Type }[] = [
  { value: "text", label: "Text", icon: Type },
  { value: "image", label: "Image", icon: ImageIcon },
  { value: "audio", label: "Audio only", icon: Mic },
  { value: "break", label: "Break", icon: Clock },
  { value: "promo", label: "Promo", icon: Megaphone },
  { value: "none", label: "None", icon: CircleSlash },
];

export function BubbleCard({ contactId, bubble }: { contactId: string; bubble: Bubble }) {
  const update = useEditor((s) => s.updateBubble);
  const del = useEditor((s) => s.deleteBubble);
  const customVoices = useEditor((s) => s.customVoices);
  const sfxLibrary = useEditor((s) => s.sfxLibrary);
  const defaultMeVoice = useEditor((s) => s.defaultMeVoice);
  const defaultThemVoice = useEditor((s) => s.defaultThemVoice);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: bubble.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const voices = [...ELEVENLABS_VOICES, ...customVoices.filter((v) => v.id)];
  const sfxOptions = [
    { id: "sent", name: "Sent (default)" },
    { id: "received", name: "Received (default)" },
    ...sfxLibrary,
  ];

  // Warnings
  const warnings: string[] = [];
  if (bubble.type === "image" && !bubble.imageUrl) warnings.push("Add an image");
  if (
    (bubble.type === "text" || bubble.type === "audio") &&
    !bubble.speakerVoiceId
  ) {
    const def = bubble.side === "me" ? defaultMeVoice : defaultThemVoice;
    if (!def) warnings.push("Set a voice ID for this speaker");
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group rounded-xl border bg-card p-3 shadow-sm transition-shadow",
        "hover:shadow-md",
        warnings.length && "border-amber-400/60"
      )}
    >
      <div className="flex items-start gap-2">
        <button
          {...attributes}
          {...listeners}
          className="mt-1 cursor-grab text-muted-foreground hover:text-foreground"
          aria-label="Drag"
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <div className="flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <div className="flex rounded-md border bg-muted p-0.5 text-xs">
              {(["me", "them"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => update(contactId, bubble.id, { side: s })}
                  className={cn(
                    "rounded px-2 py-0.5 font-medium capitalize transition-colors",
                    bubble.side === s
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>

            <Select
              value={bubble.type}
              onValueChange={(v) => update(contactId, bubble.id, { type: v as Bubble["type"] })}
            >
              <SelectTrigger className="h-7 w-28 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value} className="text-xs">
                    <span className="inline-flex items-center gap-1.5">
                      <t.icon className="h-3 w-3" /> {t.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(bubble.type === "text" || bubble.type === "audio") && (
              <Select
                value={bubble.speakerVoiceId ?? "__default"}
                onValueChange={(v) =>
                  update(contactId, bubble.id, {
                    speakerVoiceId: v === "__default" ? undefined : v,
                  })
                }
              >
                <SelectTrigger className="h-7 w-36 text-xs">
                  <SelectValue placeholder="Voice" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__default" className="text-xs">Default ({bubble.side})</SelectItem>
                  {voices.map((v) => (
                    <SelectItem key={v.id} value={v.id} className="text-xs">
                      {v.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {bubble.type === "text" && (
              <Select
                value={bubble.sfx ?? "__none"}
                onValueChange={(v) =>
                  update(contactId, bubble.id, { sfx: v === "__none" ? undefined : v })
                }
              >
                <SelectTrigger className="h-7 w-32 text-xs">
                  <SelectValue placeholder="SFX" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none" className="text-xs">No SFX</SelectItem>
                  {sfxOptions.map((x) => (
                    <SelectItem key={x.id} value={x.id} className="text-xs">
                      {x.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <div className="flex-1" />
            {warnings.length > 0 && (
              <Badge
                variant="outline"
                className="gap-1 border-amber-400/60 text-amber-700"
                title={warnings.join(" · ")}
              >
                <AlertTriangle className="h-3 w-3" /> {warnings.length}
              </Badge>
            )}
            <button
              onClick={() => del(contactId, bubble.id)}
              className="rounded-md p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
              aria-label="Delete"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {bubble.type === "text" && (
            <>
              <Textarea
                value={bubble.text}
                onChange={(e) => update(contactId, bubble.id, { text: e.target.value })}
                placeholder="Type message…"
                className="min-h-[44px] resize-none text-sm"
              />
              <Input
                value={bubble.ttsOverride ?? ""}
                onChange={(e) => update(contactId, bubble.id, { ttsOverride: e.target.value })}
                placeholder="TTS override (optional) — what the voice actually says"
                className="h-8 text-xs"
              />
            </>
          )}

          {bubble.type === "audio" && (
            <Textarea
              value={bubble.text}
              onChange={(e) => update(contactId, bubble.id, { text: e.target.value })}
              placeholder="Spoken text (no bubble shown)"
              className="min-h-[44px] resize-none text-sm"
            />
          )}

          {bubble.type === "image" && (
            <div className="flex items-center gap-2">
              <Input
                value={bubble.imageUrl ?? ""}
                onChange={(e) => update(contactId, bubble.id, { imageUrl: e.target.value })}
                placeholder="photo.jpg or URL"
                className="h-8 text-xs"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const inp = document.createElement("input");
                  inp.type = "file";
                  inp.accept = "image/*";
                  inp.onchange = () => {
                    const f = inp.files?.[0];
                    if (f) {
                      const r = new FileReader();
                      r.onload = () =>
                        update(contactId, bubble.id, { imageUrl: String(r.result) });
                      r.readAsDataURL(f);
                    }
                  };
                  inp.click();
                }}
              >
                Upload
              </Button>
            </div>
          )}

          {bubble.type === "break" && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Pause for</span>
              <Input
                type="number"
                min={1}
                value={bubble.breakSeconds ?? 2}
                onChange={(e) =>
                  update(contactId, bubble.id, { breakSeconds: Number(e.target.value) })
                }
                className="h-8 w-20 text-xs"
              />
              <span className="text-xs text-muted-foreground">seconds</span>
            </div>
          )}

          {bubble.type === "promo" && (
            <div className="space-y-2 rounded-lg bg-muted/40 p-2.5">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px]">Monetization</Badge>
                <Select
                  value={bubble.promoKind ?? "plug"}
                  onValueChange={(v) =>
                    update(contactId, bubble.id, { promoKind: v as "plug" | "rizz" })
                  }
                >
                  <SelectTrigger className="h-7 w-28 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="plug" className="text-xs">Plug AI</SelectItem>
                    <SelectItem value="rizz" className="text-xs">Rizz</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 gap-1.5">
                <Input
                  value={bubble.promoIntroText ?? ""}
                  onChange={(e) =>
                    update(contactId, bubble.id, { promoIntroText: e.target.value })
                  }
                  placeholder="Intro line (plugsay / rizzsay)"
                  className="h-8 text-xs"
                />
                <Input
                  value={bubble.promoReplyText ?? ""}
                  onChange={(e) =>
                    update(contactId, bubble.id, { promoReplyText: e.target.value })
                  }
                  placeholder="Reply line (plug / rizzy) — leave empty to skip TTS"
                  className="h-8 text-xs"
                />
              </div>
            </div>
          )}

          {bubble.type === "none" && (
            <p className="text-xs italic text-muted-foreground">
              Silent bubble — shown in chat but no TTS played.
            </p>
          )}

          {warnings.length > 0 && (
            <div className="flex items-start gap-1.5 rounded-md bg-amber-50 p-2 text-[11px] text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
              <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
              <span>{warnings.join(" · ")}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
