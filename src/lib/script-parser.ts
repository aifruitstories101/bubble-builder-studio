// Extract speakers, SFX, image filenames, and contact-avatar filenames from a raw script.

export type ParsedAssets = {
  speakers: string[];
  sfx: string[];
  images: string[];
  contactAvatars: string[];
};

const IMG_EXT = /\.(jpg|jpeg|png|webp|gif)$/i;
const FILE_TOKEN = /([\w\-]+\.(?:jpg|jpeg|png|webp|gif))/gi;

export function parseScriptForAssets(raw: string): ParsedAssets {
  const speakers = new Set<string>();
  const sfx = new Set<string>();
  const images = new Set<string>();
  const contactAvatars = new Set<string>();

  const lines = raw.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    // Contact header: "iMessage: Name" or "iMessage: Name: avatar.jpg"
    const contact = trimmed.match(/^iMessage\s*:\s*([^:]+?)(?:\s*:\s*([\w\-]+\.(?:jpg|jpeg|png|webp|gif)))?\s*$/i);
    if (contact) {
      if (contact[2]) contactAvatars.add(contact[2]);
      continue;
    }

    // Plug/Rizz: kind>Speaker: text
    const plugRizz = trimmed.match(/^(plug|plugsay|rizz|rizzsay|rizzy)\s*>\s*([^:]+?)\s*:/i);
    if (plugRizz) {
      const spk = plugRizz[2].trim();
      if (spk && spk.toLowerCase() !== "speaker") speakers.add(spk);
    } else {
      // Generic Speaker>side: text   OR   side: filename.ext (image bubble)
      const sideOnly = trimmed.match(/^(me|them)\s*:\s*(.+)$/i);
      if (sideOnly && IMG_EXT.test(sideOnly[2].trim())) {
        images.add(sideOnly[2].trim());
      } else {
        const m = trimmed.match(/^([^>:#<]+?)\s*>\s*(me|them|audio)\s*:/i);
        if (m) {
          const spk = m[1].trim();
          if (spk && !/^(me|them|audio|image|iMessage|UM|CR)$/i.test(spk)) {
            speakers.add(spk);
          }
        }
      }
    }

    // Any other image filenames referenced in the line
    const fileMatches = trimmed.matchAll(FILE_TOKEN);
    for (const fm of fileMatches) {
      const f = fm[1];
      if (!contactAvatars.has(f)) images.add(f);
    }

    // SFX tokens [name]  (skip if it's actually an image-like token)
    const sfxMatches = trimmed.matchAll(/\[([a-zA-Z0-9 _\-]{1,40})\]/g);
    for (const sm of sfxMatches) {
      const name = sm[1].trim();
      if (name && !IMG_EXT.test(name)) sfx.add(name);
    }
  }

  // Avatars shouldn't double as bubble images
  for (const a of contactAvatars) images.delete(a);

  return {
    speakers: [...speakers],
    sfx: [...sfx],
    images: [...images],
    contactAvatars: [...contactAvatars],
  };
}
