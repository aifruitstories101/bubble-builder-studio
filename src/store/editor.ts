import { create } from "zustand";
import { persist } from "zustand/middleware";

export type BubbleType =
  | "text"
  | "image"
  | "audio"
  | "break"
  | "promo"
  | "none";

export type PromoKind = "plug" | "rizz";

export type Bubble = {
  id: string;
  type: BubbleType;
  side: "me" | "them";
  text: string;
  ttsOverride?: string;
  speakerVoiceId?: string;
  speakerLabel?: string;
  imageUrl?: string;
  breakSeconds?: number;
  sfx?: string;
  // promo
  promoKind?: PromoKind;
  promoIntroText?: string;
  promoIntroVoiceId?: string;
  promoReplyText?: string;
  promoReplyVoiceId?: string;
};

export type Contact = {
  id: string;
  name: string;
  avatarUrl?: string;
  unread: number;
  bubbles: Bubble[];
};

export type TTSProvider = "elevenlabs" | "ai33pro";

export type SfxItem = { id: string; name: string; url?: string };

export type EditorState = {
  contacts: Contact[];
  activeContactId: string;
  // appearance
  theme: "dark" | "light";
  bubbleColor: "blue" | "green";
  cornerRadius: number;
  bubbleFontSize: number;
  bgColor: string;
  posterEveryPage: boolean;
  revealAnimation: boolean;
  bottomReserveRatio: number;
  // tts
  ttsProvider: TTSProvider;
  apiKeys: { elevenlabs: string; ai33pro: string };
  defaultMeVoice: string;
  defaultThemVoice: string;
  customVoices: { id: string; name: string }[];
  voiceSettings: { stability: number; similarity: number; style: number; speed: number };
  silenceTrim: { enabled: boolean; threshold: number; minSilenceMs: number };
  sfxLibrary: SfxItem[];
  sentSfx: string;
  sentSfxUrl?: string;
  receivedSfx: string;
  receivedSfxUrl?: string;
  // ui
  rawMode: boolean;
};

type Actions = {
  addContact: () => void;
  deleteContact: (id: string) => void;
  setActiveContact: (id: string) => void;
  updateContact: (id: string, patch: Partial<Contact>) => void;
  addBubble: (contactId: string, side?: "me" | "them") => void;
  updateBubble: (contactId: string, bubbleId: string, patch: Partial<Bubble>) => void;
  deleteBubble: (contactId: string, bubbleId: string) => void;
  reorderBubbles: (contactId: string, fromIdx: number, toIdx: number) => void;
  patch: (p: Partial<EditorState>) => void;
  addCustomVoice: (v: { id: string; name: string }) => void;
  updateCustomVoice: (oldId: string, patch: { id?: string; name?: string }) => void;
  removeCustomVoice: (id: string) => void;
  addSfx: (s: SfxItem) => void;
  importFromScript: (
    parsed: { speakers: string[]; sfx: string[] }
  ) => { addedSpeakers: number; addedSfx: number };
};

const uid = () => Math.random().toString(36).slice(2, 10);

const seedContact = (): Contact => ({
  id: uid(),
  name: "John",
  unread: 12,
  bubbles: [
    { id: uid(), type: "text", side: "me", text: "Hello there!" },
    { id: uid(), type: "text", side: "them", text: "Hey whats up?" },
    { id: uid(), type: "break", side: "me", text: "", breakSeconds: 2 },
    { id: uid(), type: "text", side: "me", text: "Wanna see something cool?" },
    {
      id: uid(),
      type: "promo",
      side: "me",
      text: "",
      promoKind: "plug",
      promoIntroText: "Check this out",
      promoReplyText: "That looks amazing!",
    },
  ],
});

export const useEditor = create<EditorState & Actions>()(
  persist(
    (set, get) => {
      const first = seedContact();
      return {
        contacts: [first],
        activeContactId: first.id,
        theme: "light",
        bubbleColor: "blue",
        cornerRadius: 22,
        bubbleFontSize: 40,
        bgColor: "#00ff00",
        posterEveryPage: false,
        revealAnimation: true,
        bottomReserveRatio: 0.3,
        ttsProvider: "elevenlabs",
        apiKeys: { elevenlabs: "", ai33pro: "" },
        defaultMeVoice: "JBFqnCBsd6RMkjVDRZzb",
        defaultThemVoice: "EXAVITQu4vr4xnSDxMaL",
        customVoices: [],
        voiceSettings: { stability: 0.5, similarity: 0.75, style: 0.5, speed: 1 },
        silenceTrim: { enabled: true, threshold: -40, minSilenceMs: 250 },
        sfxLibrary: [],
        sentSfx: "sent",
        receivedSfx: "received",
        rawMode: false,

        addContact: () => {
          const c: Contact = { id: uid(), name: "New Contact", unread: 0, bubbles: [] };
          set((s) => ({ contacts: [...s.contacts, c], activeContactId: c.id }));
        },
        deleteContact: (id) => {
          const s = get();
          const remaining = s.contacts.filter((c) => c.id !== id);
          set({
            contacts: remaining.length ? remaining : [seedContact()],
            activeContactId:
              s.activeContactId === id
                ? (remaining[0]?.id ?? "")
                : s.activeContactId,
          });
        },
        setActiveContact: (id) => set({ activeContactId: id }),
        updateContact: (id, patch) =>
          set((s) => ({
            contacts: s.contacts.map((c) => (c.id === id ? { ...c, ...patch } : c)),
          })),
        addBubble: (contactId, side = "me") =>
          set((s) => ({
            contacts: s.contacts.map((c) =>
              c.id === contactId
                ? {
                    ...c,
                    bubbles: [
                      ...c.bubbles,
                      { id: uid(), type: "text", side, text: "" },
                    ],
                  }
                : c
            ),
          })),
        updateBubble: (contactId, bubbleId, patch) =>
          set((s) => ({
            contacts: s.contacts.map((c) =>
              c.id === contactId
                ? {
                    ...c,
                    bubbles: c.bubbles.map((b) =>
                      b.id === bubbleId ? { ...b, ...patch } : b
                    ),
                  }
                : c
            ),
          })),
        deleteBubble: (contactId, bubbleId) =>
          set((s) => ({
            contacts: s.contacts.map((c) =>
              c.id === contactId
                ? { ...c, bubbles: c.bubbles.filter((b) => b.id !== bubbleId) }
                : c
            ),
          })),
        reorderBubbles: (contactId, fromIdx, toIdx) =>
          set((s) => ({
            contacts: s.contacts.map((c) => {
              if (c.id !== contactId) return c;
              const arr = [...c.bubbles];
              const [m] = arr.splice(fromIdx, 1);
              arr.splice(toIdx, 0, m);
              return { ...c, bubbles: arr };
            }),
          })),
        patch: (p) => set(p as EditorState),
        addCustomVoice: (v) =>
          set((s) => ({ customVoices: [...s.customVoices, v] })),
        updateCustomVoice: (oldId, patch) =>
          set((s) => ({
            customVoices: s.customVoices.map((v) =>
              v.id === oldId ? { ...v, ...patch } : v
            ),
          })),
        removeCustomVoice: (id) =>
          set((s) => ({ customVoices: s.customVoices.filter((v) => v.id !== id) })),
        addSfx: (s2) => set((s) => ({ sfxLibrary: [...s.sfxLibrary, s2] })),
        importFromScript: ({ speakers, sfx }) => {
          const s = get();
          const existingVoiceNames = new Set([
            ...s.customVoices.map((v) => v.name.toLowerCase()),
          ]);
          const newVoices = speakers
            .filter((n) => !existingVoiceNames.has(n.toLowerCase()))
            .map((name) => ({ id: "", name }));

          const existingSfx = new Set(
            s.sfxLibrary.map((x) => x.name.toLowerCase())
          );
          const reserved = new Set(["sent", "received"]);
          const newSfx = sfx
            .filter(
              (n) =>
                !existingSfx.has(n.toLowerCase()) && !reserved.has(n.toLowerCase())
            )
            .map((name) => ({ id: `${name}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, name }));

          if (newVoices.length || newSfx.length) {
            set({
              customVoices: [...s.customVoices, ...newVoices],
              sfxLibrary: [...s.sfxLibrary, ...newSfx],
            });
          }
          return { addedSpeakers: newVoices.length, addedSfx: newSfx.length };
        },
      };
    },
    { name: "imsg-editor-v1" }
  )
);
