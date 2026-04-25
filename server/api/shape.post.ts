import { defineEventHandler, readBody } from 'h3';
import { shapeText } from '../utils/harfbuzz';

export default defineEventHandler(async (event) => {
	const body = await readBody<{ text?: string; font?: string }>(event);
	return await shapeText(body?.text ?? '', body?.font);
});
