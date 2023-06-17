import { sendCanvasMessage } from "utilities/channel";
import { getColorTokens, getShadowTokens, getFontTokens } from "utilities/tokens";
import * as G from "types/global";
import * as T from "./theme.types";

const storagePrefix = "theme.";

export const getThemeIds = async () => {
	const storageKeys = await figma.clientStorage.keysAsync();
	return storageKeys.filter((key) => key.startsWith(storagePrefix));
};

export const importStyles = async (payload: {
	colorMode: G.ColorMode;
	fileName: string;
	fileKey?: string;
}) => {
	const { colorMode, fileName, fileKey } = payload;
	const colorTokens = await getColorTokens();
	const shadowTokens = await getShadowTokens();
	const fontTokens = await getFontTokens();

	if (
		Object.keys(colorTokens).length === 0 &&
		Object.keys(shadowTokens).length === 0 &&
		Object.keys(fontTokens).length === 0
	) {
		figma.notify("We couldn't find any published styles in this file", { error: true });
		return;
	}

	const styles = {
		color: colorTokens,
		shadow: shadowTokens,
		font: fontTokens,
	};

	sendCanvasMessage({
		type: T.CanvasActionType.importStyles,
		payload: { styles, colorMode, fileName, fileKey },
	});
};

export const loadThemeFromStorage = async (storageKey: string) => {
	const theme = await figma.clientStorage.getAsync(storageKey);

	sendCanvasMessage({
		type: T.CanvasActionType.loadTheme,
		payload: theme,
	});
};

export const saveThemeToStorage = async (payload: G.Theme) => {
	await figma.clientStorage.setAsync(`${storagePrefix}${payload.id}`, payload);
};

export const deleteThemeFromStorage = async (payload: Pick<G.Theme, "id">) => {
	await figma.clientStorage.deleteAsync(`${storagePrefix}${payload.id}`);
};
