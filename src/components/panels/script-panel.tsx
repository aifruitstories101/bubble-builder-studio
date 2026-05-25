import { useMemo } from "react";
import { useEditor } from "@/store/editor";
import { serializeScript } from "@/lib/script-serializer";
import { parseScriptForAssets } from "@/lib/script-parser";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Download, Upload } from "lucide-react";
import { toast } from "sonner";

export function ScriptPanel() {
  const state = useEditor();
  const importFromScript = useEditor((s) => s.importFromScript);
  const script = useMemo(() => serializeScript(state), [state]);

  const handleUpload = () => {
    const inp = document.createElement("input");
    inp.type = "file";
    inp.accept = ".txt,text/plain";
    inp.onchange = () => {
      const f = inp.files?.[0];
      if (!f) return;
      f.text().then((raw) => {
        const parsed = parseScriptForAssets(raw);
        const { addedSpeakers, addedSfx } = importFromScript(parsed);
        toast.success(
          `Imported script — ${addedSpeakers} new speaker${addedSpeakers === 1 ? "" : "s"}, ${addedSfx} new SFX. Add voice IDs in TTS panel & upload SFX audio.`
        );
      });
    };
    inp.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-semibold">Raw script</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              navigator.clipboard.writeText(script);
              toast.success("Script copied");
            }}
          >
            <Copy className="mr-1 h-4 w-4" /> Copy
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const blob = new Blob([script], { type: "text/plain" });
              const a = document.createElement("a");
              a.href = URL.createObjectURL(blob);
              a.download = "script.txt";
              a.click();
            }}
          >
            <Download className="mr-1 h-4 w-4" /> Download
          </Button>
          <Button size="sm" onClick={handleUpload}>
            <Upload className="mr-1 h-4 w-4" /> Upload
          </Button>
        </div>
      </div>
      <Textarea
        value={script}
        readOnly
        className="min-h-[500px] font-mono text-xs"
      />
      <p className="text-xs text-muted-foreground">
        Uploading a script auto-extracts speakers and SFX. Assign voice IDs in the TTS panel and upload SFX audio in the SFX panel.
      </p>
    </div>
  );
}
