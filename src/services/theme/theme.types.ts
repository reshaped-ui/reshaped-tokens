import * as G from "types/global";

export enum PluginActionType {
	createTheme = "createTheme",
	updateTheme = "updateTheme",
	deleteTheme = "deleteTheme",
	requestApplyTheme = "requestApplyTheme",
	requestStyles = "requestStyles",
	requestUploadTheme = "requestUploadTheme",
}

export type PluginActionCreateTheme = G.Message<PluginActionType.createTheme, G.Theme>;
export type PluginActionUpdateTheme = G.Message<PluginActionType.updateTheme, G.Theme>;
export type PluginActionDeleteTheme = G.Message<PluginActionType.deleteTheme, Pick<G.Theme, "id">>;
export type PluginActionRequestApplyTheme = G.Message<
	PluginActionType.requestApplyTheme,
	{ styles: G.ThemeStyles; variables: G.ThemeVariables }
>;
export type PluginActionRequestUploadTheme = G.Message<
	PluginActionType.requestUploadTheme,
	{ theme: any }
>;

export type PluginActionRequestStyles = G.Message<PluginActionType.requestStyles, {}>;
export type PluginAction =
	| PluginActionCreateTheme
	| PluginActionUpdateTheme
	| PluginActionDeleteTheme
	| PluginActionRequestApplyTheme
	| PluginActionRequestStyles
	| PluginActionRequestUploadTheme;

export enum CanvasActionType {
	loadTheme = "loadTheme",
	importStyles = "importStyles",
}

export type CanvasActionLoadTheme = G.Message<CanvasActionType.loadTheme, G.Theme>;
export type CanvasActionImportStyles = G.Message<
	CanvasActionType.importStyles,
	{
		styles: G.ThemeStyles;
		variables: G.ThemeVariables;
		fileName: string;
		fileKey?: string;
	}
>;
export type CanvasAction = CanvasActionLoadTheme | CanvasActionImportStyles;
