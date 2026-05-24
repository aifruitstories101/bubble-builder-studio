import { useEditor } from "@/store/editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Plus, Trash2, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

export function ContactsPanel() {
  const {
    contacts,
    activeContactId,
    addContact,
    deleteContact,
    setActiveContact,
    updateContact,
  } = useEditor();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-semibold">Contacts</h2>
        <Button size="sm" onClick={addContact}>
          <Plus className="mr-1 h-4 w-4" /> New contact
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {contacts.map((c) => {
          const active = c.id === activeContactId;
          return (
            <div
              key={c.id}
              className={cn(
                "group rounded-xl border bg-card p-4 transition-shadow",
                active && "ring-2 ring-primary"
              )}
            >
              <div className="flex items-start gap-3">
                <button
                  onClick={() => setActiveContact(c.id)}
                  className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-muted bg-cover bg-center text-sm font-semibold"
                  style={{
                    backgroundImage: c.avatarUrl ? `url(${c.avatarUrl})` : undefined,
                  }}
                >
                  {!c.avatarUrl && c.name.charAt(0).toUpperCase()}
                </button>
                <div className="flex-1 space-y-2">
                  <Input
                    value={c.name}
                    onChange={(e) => updateContact(c.id, { name: e.target.value })}
                    className="h-8 text-sm font-medium"
                  />
                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-muted-foreground">Unread</Label>
                    <Input
                      type="number"
                      min={0}
                      value={c.unread}
                      onChange={(e) =>
                        updateContact(c.id, { unread: Number(e.target.value) })
                      }
                      className="h-7 w-20 text-xs"
                    />
                  </div>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
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
                        r.onload = () => updateContact(c.id, { avatarUrl: String(r.result) });
                        r.readAsDataURL(f);
                      }
                    };
                    inp.click();
                  }}
                >
                  <Upload className="mr-1 h-3 w-3" /> Avatar
                </Button>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={() => setActiveContact(c.id)}>
                    {active ? "Active" : "Open"}
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete {c.name}?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This deletes the entire conversation for this contact. This cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          onClick={() => deleteContact(c.id)}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
