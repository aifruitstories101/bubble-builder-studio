import { useEditor } from "@/store/editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Play, Upload, Trash2 } from "lucide-react";
import { toast } from "sonner";

export function SfxPanel() {
  const s = useEditor();

  const upload = (cb: (url: string, name: string) => void) => {
    const inp = document.createElement("input");
    inp.type = "file";
    inp.accept = "audio/*";
    inp.onchange = () => {
      const f = inp.files?.[0];
      if (f) {
        const r = new FileReader();
        r.onload = () => cb(String(r.result), f.name.replace(/\.[^.]+$/, ""));
        r.readAsDataURL(f);
      }
    };
    inp.click();
  };

  const play = (url?: string) => {
    if (!url) return toast.info("No audio attached to this preset");
    const a = new Audio(url);
    a.play().catch(() => toast.error("Failed to play audio"));
  };

  return (
    <div className="space-y-6">
      <h2 className="font-display text-xl font-semibold">Sound effects</h2>

      <div className="rounded-xl border bg-card p-4">
        <h3 className="mb-3 text-sm font-semibold">Default chat sounds</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label className="text-xs">Sent</Label>
            <div className="mt-1 flex gap-2">
              <Input value={s.sentSfx} onChange={(e) => s.patch({ sentSfx: e.target.value })} />
              <Button
                variant="outline"
                size="icon"
                onClick={() => upload((url, name) => s.patch({ sentSfx: url || name }))}
              >
                <Upload className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div>
            <Label className="text-xs">Received</Label>
            <div className="mt-1 flex gap-2">
              <Input value={s.receivedSfx} onChange={(e) => s.patch({ receivedSfx: e.target.value })} />
              <Button
                variant="outline"
                size="icon"
                onClick={() => upload((url, name) => s.patch({ receivedSfx: url || name }))}
              >
                <Upload className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">SFX library</h3>
          <Button
            size="sm"
            onClick={() =>
              upload((url, name) =>
                s.addSfx({ id: `${name}-${Date.now()}`, name, url })
              )
            }
          >
            <Upload className="mr-1 h-4 w-4" /> Upload SFX
          </Button>
        </div>
        <ul className="divide-y">
          {s.sfxLibrary.map((x) => (
            <li key={x.id} className="flex items-center justify-between py-2 text-sm">
              <span className="font-medium">{x.name}</span>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={() => play(x.url)}>
                  <Play className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive"
                  onClick={() =>
                    s.patch({ sfxLibrary: s.sfxLibrary.filter((y) => y.id !== x.id) })
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-muted-foreground">
          Attach any SFX per bubble from the chat editor.
        </p>
      </div>
    </div>
  );
}
