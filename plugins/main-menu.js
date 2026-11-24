// AKIRA V3 — menu par catégories, alimenté par les commandes chargées.
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
const LIST_GROUPS = [
  ['infos', 'Informations', ['INFORMATIONS']],
  ['groupes', 'Groupes', ['GROUPES']],
  ['medias', 'Médias et téléchargements', ['TELECHARGEMENTS', 'AUDIO & MUSIQUE', 'MEDIAS & CONVERSION']],
  ['stickers', 'Stickers et logos', ['STICKERS', 'LOGOS & TEXTE']],
  ['jeux', 'Jeux et divertissement', ['JEUX', 'ANIME & PERSONNAGES', 'DIVERTISSEMENT']],
  ['economie', 'Économie', ['ECONOMIE']],
  ['outils', 'Outils et IA', ['OUTILS', 'RECHERCHE', 'INTELLIGENCE ARTIFICIELLE', 'AUTRES COMMANDES']],
  ['owner', 'Propriétaire', ['PROPRIETAIRE']],
];

const MENU_IMAGE = 'https://files.catbox.moe/9fi9ue.jpg';

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

function collectCommands(plugins) {
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
  for (const commands of sections.values()) commands.sort((a, b) => a.localeCompare(b));
  return sections;
}

function formatSections(sections, labels, prefix) {
  return labels.filter(label => sections.has(label)).map(label => {
    const commands = sections.get(label);
    return '╭─〔 *' + label + '* 〕\n' + commands.map((name, i) =>
      (i === commands.length - 1 ? '╰' : '│') + '  ' + prefix + name
    ).join('\n');
  });
}

function formatHeader(sections, prefix) {
  const total = [...sections.values()].reduce((count, commands) => count + commands.length, 0);
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
    '│  Commandes : ' + total,
    '│  Runtime : ' + runtime,
    '╰━━━━━━━━━━━━╯',
  ].join('\n');
}

export function buildAkiraMenu(plugins, prefix = '.') {
  const sections = collectCommands(plugins);
  return [
    formatHeader(sections, prefix),
    ...formatSections(sections, [...RULES.map(([label]) => label), 'AUTRES COMMANDES'], prefix),
  ].join('\n\n');
}

export function buildCategoryList(plugins, prefix = '.') {
  const sections = collectCommands(plugins);
  const rows = LIST_GROUPS.filter(([, , labels]) => labels.some(label => sections.has(label)))
    .map(([key, title]) => ({ title, id: `${prefix}menu ${key}` }));
  const text = [
    formatHeader(sections, prefix),
    'Choisis une catégorie dans la liste ou tape sa commande.',
    ...rows.map(row => `${row.title} · ${row.id}`),
    `Toutes les commandes · ${prefix}allmenu`,
  ].join('\n');
  return { rows, text };
}

function menuPrefix(usedPrefix) {
  return typeof usedPrefix === 'string' && usedPrefix.length < 5 ? usedPrefix : '.';
}

async function sendCategoryList(conn, m, rows, text) {
  const { generateWAMessageFromContent, prepareWAMessageMedia } =
    await import('@whiskeysockets/baileys');
  let media;
  try {
    media = await prepareWAMessageMedia({ image: { url: MENU_IMAGE } }, {
      upload: conn.waUploadToServer,
    });
  } catch (error) {
    console.warn('[AKIRA MENU] Image indisponible:', error?.message || error);
  }
  const message = generateWAMessageFromContent(m.chat, {
    viewOnceMessage: {
      message: {
        messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
        interactiveMessage: {
          header: { title: 'AKIRA V3', ...media, hasMediaAttachment: Boolean(media?.imageMessage) },
          body: { text },
          nativeFlowMessage: {
            buttons: [{
              name: 'single_select',
              buttonParamsJson: JSON.stringify({
                title: 'Voir les catégories',
                sections: [{ title: 'Commandes AKIRA V3', rows }],
              }),
            }],
          },
        },
      },
    },
  }, { userJid: conn.user?.jid || conn.user?.id, quoted: m });
  return conn.relayMessage(m.chat, message.message, { messageId: message.key.id });
}

const handler = async (m, { conn, usedPrefix, args = [] }) => {
  const prefix = menuPrefix(usedPrefix);
  const requested = args[0]?.toLowerCase();
  const group = LIST_GROUPS.find(([key]) => key === requested);
  if (group) {
    const [, title, labels] = group;
    const formatted = formatSections(collectCommands(global.plugins), labels, prefix);
    const text = formatted.length
      ? [`*AKIRA V3 · ${title}*`, ...formatted].join('\n\n')
      : `Aucune commande disponible dans cette catégorie. Tape ${prefix}menu.`;
    return conn.sendMessage(m.chat, { text }, { quoted: m });
  }
  const { rows, text } = buildCategoryList(global.plugins, prefix);
  if (rows.length && typeof conn.relayMessage === 'function') {
    try {
      return await sendCategoryList(conn, m, rows, text);
    } catch (error) {
      console.warn('[AKIRA MENU] Liste interactive indisponible:', error?.message || error);
    }
  }
  return conn.sendMessage(m.chat, { text }, { quoted: m });
};

handler.all = function readCategorySelection(m) {
  const response = m.message?.interactiveResponseMessage ??
    (m.mtype === 'interactiveResponseMessage' ? m.msg : undefined);
  const nativeFlow = response?.nativeFlowResponseMessage;
  if (nativeFlow?.name !== 'single_select' || typeof nativeFlow.paramsJson !== 'string') return;
  let id;
  try {
    ({ id } = JSON.parse(nativeFlow.paramsJson));
  } catch {
    return;
  }
  const selected = typeof id === 'string' && /^[^\w\s]{0,4}menu ([a-z]+)$/.exec(id);
  if (selected && LIST_GROUPS.some(([key]) => key === selected[1])) m.text = id;
};

export function sendFullMenu(m, { conn, usedPrefix }) {
  const text = buildAkiraMenu(global.plugins, menuPrefix(usedPrefix));
  return conn.sendMessage(m.chat, { text }, { quoted: m });
}
handler.help = ['menu'];
handler.tags = ['main'];
handler.command = ['menu', 'help', 'h', 'commands'];
export default handler;
