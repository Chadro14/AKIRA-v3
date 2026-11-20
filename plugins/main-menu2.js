// AKIRA V3 — ancien raccourci allmenu vers le nouveau menu unique.
import akiraMenu from './main-menu.js';
const handler = async (m, context) => akiraMenu(m, context);
handler.help = ['allmenu'];
handler.tags = ['main'];
handler.command = ['allmenu'];
export default handler;
