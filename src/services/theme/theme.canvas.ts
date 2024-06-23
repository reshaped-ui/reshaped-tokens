import type * as G from "types/global.js";
import { uploadJsonTheme } from "utilities/tokens.js";

export const uploadTheme = (theme: G.Theme, name: string) => {
  try {
    uploadJsonTheme(theme, name);
  } catch (e) {
    if (e instanceof Error) {
      figma.notify("Error while uploading the theme, check console for more info", { error: true });
      throw new Error(e.message);
    }
  }

  figma.notify("Theme uploaded");
};
