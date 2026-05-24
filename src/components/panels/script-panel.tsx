import { useMemo } from "react";
import { useEditor } from "@/store/editor";
import { serializeScript } from "@/lib/script-serializer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Download, Upload } from "lucide-react";
import { toast } from "sonner";

export function ScriptPanel() {
  const state = useEditor();
  const script = useMemo(() => serializeScript(state), [state]);

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
          <Button
            size="sm"
            onClick={() => {
              const inp = document.createElement("input");
              inp.type = "file";
              inp.accept = ".txt,text/plain";
              inp.onchange = () => {
                const f = inp.files?.[0];
                if (!f) return;
                f.text().then(() => toast.success("Imported — visual editor sync coming next."));
              };
              inp.click();
            }}
          >
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
        Live-generated from the visual editor. Two-way sync is available in the next update.
      </p>
    </div>
  );
}
