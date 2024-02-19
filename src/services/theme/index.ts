import {
	createTheme,
	updateTheme,
	deleteTheme,
	requestStyles,
	requestApplyTheme,
	requestUploadTheme,
} from "./theme.plugin";
import {
	saveThemeToStorage,
	deleteThemeFromStorage,
	loadThemeFromStorage,
	importStyles,
	getThemeIds,
	uploadTheme,
} from "./theme.canvas";

export const plugin = {
	createTheme,
	updateTheme,
	deleteTheme,
	requestStyles,
	requestApplyTheme,
	requestUploadTheme,
};
export const canvas = {
	saveThemeToStorage,
	loadThemeFromStorage,
	deleteThemeFromStorage,
	importStyles,
	getThemeIds,
	uploadTheme,
};

export { PluginAction, PluginActionType, CanvasAction, CanvasActionType } from "./theme.types";
