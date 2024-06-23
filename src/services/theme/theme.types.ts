import * as G from "types/global.js";

export enum PluginActionType {
  requestUploadTheme = "requestUploadTheme",
}

export type PluginActionRequestUploadTheme = G.Message<
  PluginActionType.requestUploadTheme,
  { theme: G.Theme; name: string; fontFamily: { title: string; body: string } }
>;

export type PluginAction = PluginActionRequestUploadTheme;
export type CanvasAction = G.Message<"", void>;
