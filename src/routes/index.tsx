import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import { AppSidebar, type PanelKey } from "@/components/app-sidebar";
import { ChatEditor } from "@/components/chat-editor";
import { ContactsPanel } from "@/components/panels/contacts-panel";
import { AppearancePanel } from "@/components/panels/appearance-panel";
import { TtsPanel } from "@/components/panels/tts-panel";
import { SfxPanel } from "@/components/panels/sfx-panel";
import { ScriptPanel } from "@/components/panels/script-panel";
import { ExportPanel } from "@/components/panels/export-panel";
import { useEditor } from "@/store/editor";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/")({
  component: App,
});

function App() {
  const [panel, setPanel] = useState<PanelKey>("chat");
  const { contacts, activeContactId, setActiveContact } = useEditor();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar active={panel} onSelect={setPanel} />
        <SidebarInset>
          <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur">
            <SidebarTrigger />
            <div className="h-5 w-px bg-border" />
            <div className="flex-1">
              <h1 className="font-display text-base font-semibold">
                {panelTitle(panel)}
              </h1>
            </div>
            {panel === "chat" && (
              <Select value={activeContactId} onValueChange={setActiveContact}>
                <SelectTrigger className="h-8 w-44 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {contacts.map((c) => (
                    <SelectItem key={c.id} value={c.id} className="text-xs">
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </header>

          <main className="mx-auto w-full max-w-5xl p-6">
            {panel === "chat" && <ChatEditor />}
            {panel === "contacts" && <ContactsPanel />}
            {panel === "script" && <ScriptPanel />}
            {panel === "appearance" && <AppearancePanel />}
            {panel === "tts" && <TtsPanel />}
            {panel === "sfx" && <SfxPanel />}
            {panel === "export" && <ExportPanel />}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

function panelTitle(k: PanelKey) {
  return {
    chat: "Visual chat editor",
    contacts: "Contacts",
    script: "Raw script",
    appearance: "Appearance",
    tts: "TTS & voices",
    sfx: "Sound effects",
    export: "Export video",
  }[k];
}
