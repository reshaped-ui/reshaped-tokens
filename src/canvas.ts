import * as ThemeService from "services/theme/index.js";
import * as FigmaService from "services/figma/index.js";
import { subscribeToPlugin, receivePluginMessage } from "utilities/channel.js";

figma.showUI(__html__, { height: 240, themeColors: true });

(async () => {
  subscribeToPlugin((msg) => {
    receivePluginMessage(msg, ThemeService.PluginActionType.requestUploadTheme, (payload) => {
      ThemeService.canvas.uploadTheme(payload.theme, payload.name);
    });

    receivePluginMessage(msg, FigmaService.PluginActionType.notify, ({ message }) => {
      figma.notify(message);
    });
  });
})();
