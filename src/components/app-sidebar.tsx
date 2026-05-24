import { useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { MessageSquare, Users, Palette, Mic, Music4, Download, FileCode2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export type PanelKey = "chat" | "contacts" | "appearance" | "tts" | "sfx" | "script" | "export";

const items: { key: PanelKey; title: string; icon: typeof MessageSquare }[] = [
  { key: "chat", title: "Chat editor", icon: MessageSquare },
  { key: "contacts", title: "Contacts", icon: Users },
  { key: "script", title: "Raw script", icon: FileCode2 },
  { key: "appearance", title: "Appearance", icon: Palette },
  { key: "tts", title: "TTS & voices", icon: Mic },
  { key: "sfx", title: "Sound effects", icon: Music4 },
  { key: "export", title: "Export video", icon: Download },
];

export function AppSidebar({
  active,
  onSelect,
}: {
  active: PanelKey;
  onSelect: (k: PanelKey) => void;
}) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </div>
          {!collapsed && (
            <div className="leading-tight">
              <div className="font-display text-sm font-semibold">Cyno Studio</div>
              <div className="text-[11px] text-muted-foreground">iMessage video editor</div>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((it) => (
                <SidebarMenuItem key={it.key}>
                  <SidebarMenuButton
                    isActive={active === it.key}
                    onClick={() => onSelect(it.key)}
                    className={cn(active === it.key && "bg-sidebar-accent")}
                  >
                    <it.icon className="h-4 w-4" />
                    {!collapsed && <span>{it.title}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

export function useActivePanel() {
  return useState<PanelKey>("chat");
}
