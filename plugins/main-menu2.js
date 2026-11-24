// AKIRA V3 — liste complète des commandes.
import { sendFullMenu } from './main-menu.js';
const handler = (m, context) => sendFullMenu(m, context);
handler.help = ['allmenu'];
handler.tags = ['main'];
handler.command = ['allmenu'];
export default handler;
