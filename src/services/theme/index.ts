import {
	createTheme,
	updateTheme,
	deleteTheme,
	requestStyles,
	requestApplyTheme,
} from "./theme.plugin";
import {
	saveThemeToStorage,
	deleteThemeFromStorage,
	loadThemeFromStorage,
	importStyles,
	getThemeIds,
} from "./theme.canvas";

export const plugin = { createTheme, updateTheme, deleteTheme, requestStyles, requestApplyTheme };
export const canvas = {
	saveThemeToStorage,
	loadThemeFromStorage,
	deleteThemeFromStorage,
	importStyles,
	getThemeIds,
};

export { PluginAction, PluginActionType, CanvasAction, CanvasActionType } from "./theme.types";
