import * as G from "types/global.js";

export enum PluginActionType {
  requestUploadTheme = "requestUploadTheme",
  requestExtractTheme = "requestExtractTheme",
}

export enum CanvasActionType {
  themeExtracted = "themeExtracted",
}

export type PluginActionRequestUploadTheme = G.Message<
  PluginActionType.requestUploadTheme,
  { theme: G.Theme; name: string; fontFamily: { title: string; body: string } }
>;

export type PluginActionRequestExtractTheme = G.Message<PluginActionType.requestExtractTheme, { modeName: string }>;

export type CanvasActionThemeExtracted = G.Message<
  CanvasActionType.themeExtracted,
  { theme: G.Theme } | { error: string }
>;

export type PluginAction = PluginActionRequestUploadTheme | PluginActionRequestExtractTheme;
export type CanvasAction = CanvasActionThemeExtracted;
