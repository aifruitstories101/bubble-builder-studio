// Extract speaker labels and SFX names from a raw script.
// Speakers appear in lines like:
//   Speaker>me: text
//   Speaker>them: text
//   Speaker>audio: text
//   plugsay>Speaker: ...
//   plug>Speaker: ...
//   rizzsay>Speaker: ...
//   rizz>Speaker: ...
// SFX appear as inline tokens like [sfxName] inside text bubbles.

export function parseScriptForAssets(raw: string): {
  speakers: string[];
  sfx: string[];
} {
  const speakers = new Set<string>();
  const sfx = new Set<string>();

  const lines = raw.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    // Plug/Rizz formats: kind>Speaker: text
    const plugRizz = trimmed.match(
      /^(plug|plugsay|rizz|rizzsay|rizzy)\s*>\s*([^:]+?)\s*:/i
    );
    if (plugRizz) {
      const spk = plugRizz[2].trim();
      if (spk && spk.toLowerCase() !== "speaker") speakers.add(spk);
    } else {
      // Generic: Speaker>side: text
      const m = trimmed.match(/^([^>:#<]+?)\s*>\s*(me|them|audio)\s*:/i);
      if (m) {
        const spk = m[1].trim();
        if (
          spk &&
          !/^(me|them|audio|image|iMessage|UM|CR)$/i.test(spk)
        ) {
          speakers.add(spk);
        }
      }
    }

    // SFX tokens [name]
    const sfxMatches = trimmed.matchAll(/\[([a-zA-Z0-9 _\-]{1,40})\]/g);
    for (const sm of sfxMatches) {
      const name = sm[1].trim();
      if (name) sfx.add(name);
    }
  }

  return { speakers: [...speakers], sfx: [...sfx] };
}
