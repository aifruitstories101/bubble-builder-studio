import type { Bubble, Contact, EditorState } from "@/store/editor";

export function serializeScript(state: Pick<EditorState, "contacts" | "cornerRadius">) {
  const lines: string[] = [];
  lines.push("# iMessage Script");
  lines.push(`CR: ${state.cornerRadius}`);
  lines.push("");
  for (const c of state.contacts) {
    lines.push(`UM: ${c.unread}`);
    lines.push(`iMessage: ${c.name}${c.avatarUrl ? `: ${c.avatarUrl}` : ""}`);
    for (const b of c.bubbles) {
      const spk = b.speakerLabel || b.speakerVoiceId || "Speaker";
      if (b.type === "break") lines.push(`<break: ${b.breakSeconds ?? 2}s>`);
      else if (b.type === "image")
        lines.push(`${b.side}: ${b.imageUrl ?? "image.jpg"}`);
      else if (b.type === "audio")
        lines.push(`${spk}>audio: ${b.text}`);
      else if (b.type === "none") lines.push(`# (silent) ${b.text}`);
      else if (b.type === "promo") {
        const kind = b.promoKind ?? "plug";
        lines.push(`${kind}say>${spk}: ${b.promoIntroText ?? ""}`);
        lines.push(`${kind === "plug" ? "plug" : "rizzy"}>${spk}: ${b.promoReplyText ?? ""}`);
      } else {
        const sfx = b.sfx ? ` [${b.sfx}]` : "";
        const tts = b.ttsOverride ? ` == ${b.ttsOverride}` : "";
        lines.push(`${spk}>${b.side}: ${b.text}${sfx}${tts}`);
      }
    }
    lines.push("");
  }
  return lines.join("\n");
}
