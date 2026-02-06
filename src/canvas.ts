import * as ThemeService from "services/theme/index.js";
import * as FigmaService from "services/figma/index.js";
import { subscribeToPlugin, receivePluginMessage } from "utilities/channel.js";

figma.showUI(__html__, { height: 436, themeColors: true });

(async () => {
  subscribeToPlugin((msg) => {
    receivePluginMessage(msg, ThemeService.PluginActionType.requestUploadTheme, (payload) => {
      ThemeService.canvas.uploadTheme(payload.theme, payload.name, payload.fontFamily);
    });

    receivePluginMessage(msg, ThemeService.PluginActionType.requestExtractTheme, (payload) => {
      ThemeService.canvas.extractTheme(payload.modeName);
    });

    receivePluginMessage(msg, FigmaService.PluginActionType.notify, ({ message }) => {
      figma.notify(message);
    });
  });
})();
