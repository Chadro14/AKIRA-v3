// AKIRA V3 — menu unique, classe par commandes effectivement chargees.
const BANNER = [
  '██╗  ██╗ █████╗ ██╗  ██╗██╗██████╗  █████╗',
  '██║ ██╔╝██╔══██╗██║ ██╔╝██║██╔══██╗██╔══██╗',
  '█████╔╝ ███████║█████╔╝ ██║██████╔╝███████║',
  '██╔═██╗ ██╔══██║██╔═██╗ ██║██╔══██╗██╔══██║',
  '██║  ██╗██║  ██║██║  ██╗██║██║  ██║██║  ██║',
  '╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝╚═╝  ╚═╝╚═╝  ╚═╝',
].join('\n');

const RULES = [
  ['INFORMATIONS', ['main', 'info', 'information', 'bot', 'help', 'general']],
  ['TELECHARGEMENTS', ['download', 'downloader', 'dl', 'music', 'youtube', 'instagram', 'tiktok']],
  ['RECHERCHE', ['search', 'internet', 'google', 'pinterest', 'web']],
  ['GROUPES', ['group', 'groups', 'gc', 'gp', 'admin']],
  ['INTELLIGENCE ARTIFICIELLE', ['ai', 'ia', 'gpt', 'chatbot']],
  ['STICKERS', ['sticker', 'stickers']],
  ['AUDIO & MUSIQUE', ['audio', 'sound', 'voice', 'effect']],
  ['MEDIAS & CONVERSION', ['convert', 'converter', 'video', 'image', 'media']],
  ['ANIME & PERSONNAGES', ['anime', 'otaku', 'character', 'waifu']],
  ['JEUX', ['game', 'games', 'rpg']],
  ['DIVERTISSEMENT', ['fun', 'random', 'meme', 'reaction']],
  ['ECONOMIE', ['economy', 'economics', 'economia', 'bank']],
  ['LOGOS & TEXTE', ['logo', 'text', 'textpro', 'maker', 'style']],
  ['OUTILS', ['tools', 'tool', 'utility', 'util', 'other']],
  ['CONTENU ADULTE', ['nsfw', 'adult']],
  ['PROPRIETAIRE', ['owner', 'rowner', 'creator', 'mods']],
];
const VALID = /^[a-z0-9][a-z0-9_-]{0,48}$/i;

function regexOptions(pattern) {
  if (!(pattern instanceof RegExp)) return [];
  let s = pattern.source.replace(/^\^/, '').replace(/\$$/, '');
  if (s.startsWith('(?:') && s.endsWith(')')) s = s.slice(3, -1);
  else if (s.startsWith('(') && s.endsWith(')')) s = s.slice(1, -1);
  return /^[\w-]+(?:\|[\w-]+)*$/.test(s) ? s.split('|') : [];
}

function accepts(plugin, name) {
  const specs = Array.isArray(plugin.command) ? plugin.command : [plugin.command];
  return specs.some(spec => {
    if (typeof spec === 'string') return spec.toLowerCase() === name;
    if (spec instanceof RegExp) {
      spec.lastIndex = 0;
      return spec.test(name);
    }
    return false;
  });
}

function commandsFor(plugin) {
  const specs = Array.isArray(plugin.command) ? plugin.command : [plugin.command];
  const commands = specs.flatMap(spec =>
    typeof spec === 'string' ? [spec] : regexOptions(spec)
  );
  // Pour les regex complexes, n'utiliser l'aide que si elle correspond vraiment.
  if (!commands.length) {
    for (const help of Array.isArray(plugin.help) ? plugin.help : []) {
      if (typeof help !== 'string') continue;
      const name = help.trim().replace(/^\W+/, '').split(/[\s<\[({]/)[0].toLowerCase();
      if (VALID.test(name) && accepts(plugin, name)) commands.push(name);
    }
  }
  return [...new Set(commands.map(s => String(s).toLowerCase())
    .filter(s => VALID.test(s) && accepts(plugin, s)))];
}

function categoryFor(plugin, file) {
  const tags = (Array.isArray(plugin.tags) ? plugin.tags : [plugin.tags])
    .filter(Boolean).map(s => String(s).toLowerCase().trim());
  if (plugin.owner || plugin.rowner || /^owner-/.test(file)) return 'PROPRIETAIRE';
  for (const [label, keys] of RULES) {
    if (tags.some(tag => keys.includes(tag))) return label;
  }
  const prefix = file.replace(/^plugins\//, '').toLowerCase().split(/[-_.]/)[0];
  for (const [label, keys] of RULES) {
    if (keys.includes(prefix)) return label;
  }
  return 'AUTRES COMMANDES';
}

export function buildAkiraMenu(plugins, prefix = '.') {
  const sections = new Map();
  const seen = new Set();
  for (const [file, raw] of Object.entries(plugins || {})) {
    const plugin = raw?.default || raw;
    if (typeof plugin !== 'function' || plugin.disabled) continue;
    const label = categoryFor(plugin, file);
    for (const command of commandsFor(plugin)) {
      if (seen.has(command)) continue;
      seen.add(command);
      if (!sections.has(label)) sections.set(label, []);
      sections.get(label).push(command);
    }
  }
  const output = [];
  for (const label of [...RULES.map(rule => rule[0]), 'AUTRES COMMANDES']) {
    const commands = sections.get(label);
    if (!commands?.length) continue;
    commands.sort((a, b) => a.localeCompare(b));
    output.push('╭─〔 *' + label + '* 〕\n' + commands.map((name, i) =>
      (i === commands.length - 1 ? '╰' : '│') + '  ' + prefix + name
    ).join('\n'));
  }
  const up = Math.floor(process.uptime());
  const pad = n => String(n).padStart(2, '0');
  const runtime = pad(Math.floor(up / 3600)) + ':' +
    pad(Math.floor(up / 60) % 60) + ':' + pad(up % 60);
  const fence = String.fromCharCode(96).repeat(3);
  return [
    fence + BANNER + fence,
    '╭━━〔 *AKIRA V3* 〕━━╮',
    '│  Owner : Son Altesse',
    '│  Prefix : ' + prefix,
    '│  Commandes : ' + seen.size,
    '│  Runtime : ' + runtime,
    '╰━━━━━━━━━━━━╯',
    ...output,
    '*AKIRA V3*  •  Tape ' + prefix + 'menu pour revoir les commandes.',
  ].join('\n\n');
}

const handler = async (m, { conn, usedPrefix }) => {
  const prefix = typeof usedPrefix === 'string' && usedPrefix.length < 5 ? usedPrefix : '.';
  const menu = buildAkiraMenu(global.plugins, prefix);
  // Image et texte separes pour eviter la limite des legendes WhatsApp.
  try {
    await conn.sendMessage(m.chat, {
      image: { url: 'https://files.catbox.moe/9fi9ue.jpg' },
      caption: '*AKIRA V3*  •  L’univers des commandes.\nChoisis ta categorie ci-dessous.',
    }, { quoted: m });
  } catch (error) {
    console.warn('[AKIRA MENU] Image indisponible:', error?.message || error);
  }
  return conn.sendMessage(m.chat, { text: menu }, { quoted: m });
};
handler.help = ['menu'];
handler.tags = ['main'];
handler.command = ['menu', 'help', 'h', 'commands'];
export default handler;
