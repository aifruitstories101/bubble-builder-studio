import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ParsedAssets } from "@/lib/script-parser";

export type TTSProvider = "elevenlabs" | "ai33pro" | "minimax";
export type SfxItem = { id: string; name: string; url?: string };

export type SilenceTrim = {
  enabled: boolean;
  thresholdDb: number;
  minSilenceMs: number;
  keepPaddingMs: number;
};

export type EditorState = {
  script: string;
  // tts
  ttsProvider: TTSProvider;
  apiKeys: { elevenlabs: string; ai33pro: string; minimax: string };
  // name -> voice id
  customVoices: { id: string; name: string }[];
  voiceSettings: { stability: number; similarity: number; style: number; speed: number };
  silenceTrim: SilenceTrim;
  // sfx
  sfxLibrary: SfxItem[];
  sentSfx: string;
  sentSfxUrl?: string;
  receivedSfx: string;
  receivedSfxUrl?: string;
  // assets keyed by filename
  imageAssets: Record<string, string>;
  contactAvatarAssets: Record<string, string>;
  // detected (last parse)
  detectedSpeakers: string[];
  detectedSfx: string[];
  detectedImages: string[];
  detectedContactAvatars: string[];
};

type Actions = {
  patch: (p: Partial<EditorState>) => void;
  setScript: (s: string) => void;
  applyDetected: (p: ParsedAssets) => void;
  setVoiceId: (name: string, id: string) => void;
  removeVoice: (name: string) => void;
  addSfxFile: (name: string, url: string) => void;
  setImageAsset: (filename: string, url: string) => void;
  setContactAvatarAsset: (filename: string, url: string) => void;
};

export const useEditor = create<EditorState & Actions>()(
  persist(
    (set, get) => ({
      script: `# Sample
iMessage: John
Sara>me: Hey! [sent]
Bob>them: Whats up [received]
me: 1.jpg
<break: 2s>
Sara>me: Check this {pic}
plugsay>Sara: What do you think?
plug>Sara: That looks amazing!
`,
      ttsProvider: "elevenlabs",
      apiKeys: { elevenlabs: "", ai33pro: "", minimax: "" },
      customVoices: [],
      voiceSettings: { stability: 0.5, similarity: 0.75, style: 0.5, speed: 1 },
      silenceTrim: { enabled: true, thresholdDb: -40, minSilenceMs: 300, keepPaddingMs: 80 },
      sfxLibrary: [],
      sentSfx: "sent",
      receivedSfx: "received",
      imageAssets: {},
      contactAvatarAssets: {},
      detectedSpeakers: [],
      detectedSfx: [],
      detectedImages: [],
      detectedContactAvatars: [],

      patch: (p) => set(p as EditorState),
      setScript: (script) => set({ script }),
      applyDetected: (p) => {
        const s = get();
        const have = new Set(s.customVoices.map((v) => v.name.toLowerCase()));
        const newVoices = p.speakers
          .filter((n) => !have.has(n.toLowerCase()))
          .map((name) => ({ id: "", name }));
        const haveSfx = new Set(s.sfxLibrary.map((x) => x.name.toLowerCase()));
        const reserved = new Set(["sent", "received"]);
        const newSfx = p.sfx
          .filter((n) => !haveSfx.has(n.toLowerCase()) && !reserved.has(n.toLowerCase()))
          .map((name) => ({ id: `${name}-${Math.random().toString(36).slice(2, 7)}`, name }));
        set({
          customVoices: [...s.customVoices, ...newVoices],
          sfxLibrary: [...s.sfxLibrary, ...newSfx],
          detectedSpeakers: p.speakers,
          detectedSfx: p.sfx,
          detectedImages: p.images,
          detectedContactAvatars: p.contactAvatars,
        });
      },
      setVoiceId: (name, id) =>
        set((s) => {
          const exists = s.customVoices.some((v) => v.name === name);
          return {
            customVoices: exists
              ? s.customVoices.map((v) => (v.name === name ? { ...v, id } : v))
              : [...s.customVoices, { name, id }],
          };
        }),
      removeVoice: (name) =>
        set((s) => ({ customVoices: s.customVoices.filter((v) => v.name !== name) })),
      addSfxFile: (name, url) =>
        set((s) => {
          const idx = s.sfxLibrary.findIndex((x) => x.name.toLowerCase() === name.toLowerCase());
          if (idx >= 0) {
            const arr = [...s.sfxLibrary];
            arr[idx] = { ...arr[idx], url };
            return { sfxLibrary: arr };
          }
          return {
            sfxLibrary: [
              ...s.sfxLibrary,
              { id: `${name}-${Math.random().toString(36).slice(2, 7)}`, name, url },
            ],
          };
        }),
      setImageAsset: (filename, url) =>
        set((s) => ({ imageAssets: { ...s.imageAssets, [filename]: url } })),
      setContactAvatarAsset: (filename, url) =>
        set((s) => ({ contactAvatarAssets: { ...s.contactAvatarAssets, [filename]: url } })),
    }),
    { name: "cyno-script-v2" }
  )
);
