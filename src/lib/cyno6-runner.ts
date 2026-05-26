// Frontend stub for cyno6.js. Bundles the script and all required assets
// into a single payload that a backend renderer (cyno6.js) can consume.

import type { EditorState } from "@/store/editor";

export type CynoPayload = {
  script: string;
  provider: EditorState["ttsProvider"];
  apiKey: string;
  defaultVoices: { me: string; them: string };
  voiceMap: Record<string, string>;
  voiceSettings: EditorState["voiceSettings"];
  sent: { name: string; url?: string };
  received: { name: string; url?: string };
  sfx: Record<string, string>;
  images: Record<string, string>;
  contactAvatars: Record<string, string>;
};

export function buildCynoPayload(s: EditorState): CynoPayload {
  const voiceMap: Record<string, string> = {};
  s.customVoices.forEach((v) => {
    if (v.id) voiceMap[v.name] = v.id;
  });
  const sfx: Record<string, string> = {};
  s.sfxLibrary.forEach((x) => {
    if (x.url) sfx[x.name] = x.url;
  });
  return {
    script: s.script,
    provider: s.ttsProvider,
    apiKey: s.ttsProvider === "elevenlabs" ? s.apiKeys.elevenlabs : s.apiKeys.ai33pro,
    defaultVoices: { me: s.defaultMeVoice, them: s.defaultThemVoice },
    voiceMap,
    voiceSettings: s.voiceSettings,
    sent: { name: s.sentSfx, url: s.sentSfxUrl },
    received: { name: s.receivedSfx, url: s.receivedSfxUrl },
    sfx,
    images: s.imageAssets,
    contactAvatars: s.contactAvatarAssets,
  };
}

// Mock progress runner. Replace with a real fetch to your cyno6.js renderer.
export async function runCyno6(
  payload: CynoPayload,
  onProgress: (pct: number) => void,
  signal?: AbortSignal
): Promise<{ ok: true; payload: CynoPayload }> {
  const totalMs = 4000;
  const step = 80;
  let elapsed = 0;
  return new Promise((resolve, reject) => {
    const t = setInterval(() => {
      if (signal?.aborted) {
        clearInterval(t);
        reject(new Error("aborted"));
        return;
      }
      elapsed += step;
      onProgress(Math.min(100, Math.round((elapsed / totalMs) * 100)));
      if (elapsed >= totalMs) {
        clearInterval(t);
        resolve({ ok: true, payload });
      }
    }, step);
  });
}
