// Frontend stub for cyno6.js. Bundles the script and all required assets
// into a single payload that a backend renderer (cyno6.js) can consume.

import type { EditorState } from "@/store/editor";

export type CynoPayload = {
  script: string;
  provider: EditorState["ttsProvider"];
  speakerPrefix: "Speaker" | "mx_Speaker";
  apiKey: string;
  voiceMap: Record<string, string>;
  voiceSettings: EditorState["voiceSettings"];
  silenceTrim: EditorState["silenceTrim"];
  sent: { name: string; url?: string };
  received: { name: string; url?: string };
  sfx: Record<string, string>;
  images: Record<string, string>;
  contactAvatars: Record<string, string>;
};

export function speakerPrefixFor(p: EditorState["ttsProvider"]): "Speaker" | "mx_Speaker" {
  return p === "minimax" ? "mx_Speaker" : "Speaker";
}

export function buildCynoPayload(s: EditorState): CynoPayload {
  const voiceMap: Record<string, string> = {};
  s.customVoices.forEach((v) => {
    if (v.id) voiceMap[v.name] = v.id;
  });
  const sfx: Record<string, string> = {};
  s.sfxLibrary.forEach((x) => {
    if (x.url) sfx[x.name] = x.url;
  });
  const apiKey =
    s.ttsProvider === "elevenlabs"
      ? s.apiKeys.elevenlabs
      : s.ttsProvider === "minimax"
        ? s.apiKeys.minimax
        : s.apiKeys.ai33pro;
  return {
    script: s.script,
    provider: s.ttsProvider,
    speakerPrefix: speakerPrefixFor(s.ttsProvider),
    apiKey,
    voiceMap,
    voiceSettings: s.voiceSettings,
    silenceTrim: s.silenceTrim,
    sent: { name: s.sentSfx, url: s.sentSfxUrl },
    received: { name: s.receivedSfx, url: s.receivedSfxUrl },
    sfx,
    images: s.imageAssets,
    contactAvatars: s.contactAvatarAssets,
  };
}

export function downloadPayload(payload: CynoPayload, filename = "cyno6-payload.json") {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
