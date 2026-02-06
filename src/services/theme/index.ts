import { requestUploadTheme, requestExtractTheme } from "./theme.plugin.js";
import { uploadTheme, extractTheme } from "./theme.canvas.js";

export const plugin = {
  requestUploadTheme,
  requestExtractTheme,
};

export const canvas = {
  uploadTheme,
  extractTheme,
};

export { type PluginAction, PluginActionType, type CanvasAction, CanvasActionType } from "./theme.types.js";
