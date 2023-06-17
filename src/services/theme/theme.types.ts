import * as G from "types/global";

export enum PluginActionType {
	createTheme = "createTheme",
	updateTheme = "updateTheme",
	deleteTheme = "deleteTheme",
	requestApplyTheme = "requestApplyTheme",
	requestStyles = "requestStyles",
}

export type PluginActionCreateTheme = G.Message<PluginActionType.createTheme, G.Theme>;
export type PluginActionUpdateTheme = G.Message<PluginActionType.updateTheme, G.Theme>;
export type PluginActionDeleteTheme = G.Message<PluginActionType.deleteTheme, Pick<G.Theme, "id">>;
export type PluginActionRequestApplyTheme = G.Message<
	PluginActionType.requestApplyTheme,
	G.ThemeStyles
>;
export type PluginActionRequestStyles = G.Message<
	PluginActionType.requestStyles,
	{ colorMode: G.ColorMode }
>;
export type PluginAction =
	| PluginActionCreateTheme
	| PluginActionUpdateTheme
	| PluginActionDeleteTheme
	| PluginActionRequestApplyTheme
	| PluginActionRequestStyles;

export enum CanvasActionType {
	loadTheme = "loadTheme",
	importStyles = "importStyles",
}

export type CanvasActionLoadTheme = G.Message<CanvasActionType.loadTheme, G.Theme>;
export type CanvasActionImportStyles = G.Message<
	CanvasActionType.importStyles,
	{ colorMode: G.ColorMode; styles: G.ThemeStyles; fileName: string; fileKey?: string }
>;
export type CanvasAction = CanvasActionLoadTheme | CanvasActionImportStyles;
