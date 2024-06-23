import { requestUploadTheme } from "./theme.plugin.js";
import { uploadTheme } from "./theme.canvas.js";

export const plugin = {
  requestUploadTheme,
};

export const canvas = {
  uploadTheme,
};

export { PluginAction, PluginActionType, CanvasAction } from "./theme.types.js";
