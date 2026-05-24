import { useEditor } from "@/store/editor";
import { BubbleCard } from "./bubble-card";
import { Button } from "@/components/ui/button";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus, MessageSquarePlus } from "lucide-react";

export function ChatEditor() {
  const { contacts, activeContactId, addBubble, reorderBubbles } = useEditor();
  const c = contacts.find((x) => x.id === activeContactId);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  if (!c) return null;

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const from = c.bubbles.findIndex((b) => b.id === active.id);
    const to = c.bubbles.findIndex((b) => b.id === over.id);
    if (from < 0 || to < 0) return;
    reorderBubbles(c.id, from, to);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-semibold">{c.name}</h2>
          <p className="text-xs text-muted-foreground">
            {c.bubbles.length} bubble{c.bubbles.length === 1 ? "" : "s"} · drag to reorder
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => addBubble(c.id, "them")}>
            <MessageSquarePlus className="mr-1 h-4 w-4" /> Them
          </Button>
          <Button size="sm" onClick={() => addBubble(c.id, "me")}>
            <Plus className="mr-1 h-4 w-4" /> Me
          </Button>
        </div>
      </div>

      <div className="space-y-2 pb-8">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={c.bubbles.map((b) => b.id)} strategy={verticalListSortingStrategy}>
            {c.bubbles.map((b) => (
              <BubbleCard key={b.id} contactId={c.id} bubble={b} />
            ))}
          </SortableContext>
        </DndContext>

        {c.bubbles.length === 0 && (
          <div className="rounded-xl border border-dashed py-12 text-center text-sm text-muted-foreground">
            No bubbles yet. Add your first message above.
          </div>
        )}
      </div>
    </div>
  );
}
