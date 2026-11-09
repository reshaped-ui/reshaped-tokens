import type * as G from "types/global.js";
import { uploadJsonTheme } from "utilities/tokens.js";
import { extractThemeFromFigma } from "utilities/tokens-from-figma.js";
import { sendCanvasMessage } from "utilities/channel.js";
import * as T from "./theme.types.js";

export const uploadTheme = async (theme: G.Theme, name: string, fontFamily: { body: string; title: string }) => {
  try {
    const { issues } = await uploadJsonTheme(theme, name, fontFamily);

    if (issues.length) {
      console.warn(`Theme "${name}" uploaded with ${issues.length} skipped token(s):\n${issues.join("\n")}`);
      figma.notify(`Theme "${name}" uploaded, ${issues.length} token(s) skipped`, { error: true });
    } else {
      figma.notify(`Theme "${name}" uploaded`);
    }

    sendCanvasMessage({ type: T.CanvasActionType.themeUploaded, payload: { issues } });
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : String(e);

    console.error(e);
    figma.notify(`Error while uploading the theme: ${errorMessage}`, { error: true });
    sendCanvasMessage({ type: T.CanvasActionType.themeUploaded, payload: { error: errorMessage } });
  }
};

export const extractTheme = async (modeName: string) => {
  try {
    const theme = await extractThemeFromFigma(modeName);
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
