import type * as G from "types/global.js";
import { uploadJsonTheme } from "utilities/tokens.js";
import { extractThemeFromFigma } from "utilities/tokens-from-figma.js";
import { sendCanvasMessage } from "utilities/channel.js";
import * as T from "./theme.types.js";

export const uploadTheme = (theme: G.Theme, name: string, fontFamily: { body: string; title: string }) => {
  try {
    uploadJsonTheme(theme, name, fontFamily);
  } catch (e) {
    if (e instanceof Error) {
      figma.notify("Error while uploading the theme, check console for more info", { error: true });
      throw new Error(e.message);
    }
  }

  figma.notify("Theme uploaded");
};

export const extractTheme = (modeName: string) => {
  try {
    const theme = extractThemeFromFigma(modeName);
    // Cast to G.Theme for type compatibility, but it's actually ThemeDefinition structure
    sendCanvasMessage({
      type: T.CanvasActionType.themeExtracted,
      payload: { theme: theme as G.Theme },
    });
    figma.notify("Theme extracted successfully");
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : "Unknown error occurred";
    sendCanvasMessage({
      type: T.CanvasActionType.themeExtracted,
      payload: { error: errorMessage },
    });
    figma.notify(`Error extracting theme: ${errorMessage}`, { error: true });
  }
};
