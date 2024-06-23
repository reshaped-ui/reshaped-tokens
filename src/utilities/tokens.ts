import type * as G from "types/global.js";

const THEME_COLLECTION_NAME = "Theme";
const FIGMA_DEFAULT_MODE_NAME = "Mode 1";

function hexToRgba(hex: string, alpha?: number) {
  const hexAlpha = hex.length === 9 ? parseInt(hex.slice(7, 9), 16) : undefined;

  return {
    r: parseInt(hex.slice(1, 3), 16) / 255,
    g: parseInt(hex.slice(3, 5), 16) / 255,
    b: parseInt(hex.slice(5, 7), 16) / 255,
    a: (hexAlpha ? hexAlpha / 255 : alpha) ?? 1,
  };
}

const formatTokenName = (s: string) => {
  const name = s.replace(/([a-z][a-z])([A-Z]|[0-9])/g, "$1 $2").toLowerCase();
  return name.charAt(0).toUpperCase() + name.slice(1);
};

/**
 * General utilities for working with Figma variables, styles, modes and collections
 */
let cachedVariabes: Record<string, Variable> = {};
let cachedCollections: Record<string, VariableCollection> = {};

const getOrCreateCollection = (name: string) => {
  if (cachedCollections[name]) return cachedCollections[name];

  const localCollections = figma.variables.getLocalVariableCollections();
  const localCollection = localCollections.find((collection) => name === collection.name);
  const resolvedCollection = localCollection ?? figma.variables.createVariableCollection(name);

  cachedCollections[name] = resolvedCollection;
  return resolvedCollection;
};

const getOrCreateVariable = (name: string, collection: VariableCollection, type: Variable["resolvedType"]) => {
  if (cachedVariabes[name]) return cachedVariabes[name];

  const localVariables = figma.variables.getLocalVariables();
  const localVariable = localVariables.find((variable) => name === variable.name);
  const resolvedVariable = localVariable ?? figma.variables.createVariable(name, collection, type);

  cachedVariabes[name] = resolvedVariable;
  return resolvedVariable;
};

/**
 * Handlers for different types of Reshaped tokens
 */

const uploadRadiusVariables = (theme: G.Theme, themeModeId: string) => {
  const collection = getOrCreateCollection(THEME_COLLECTION_NAME);

  Object.keys(theme.radius).forEach((key) => {
    const value = theme.radius[key];
    const name = `Radius/${formatTokenName(key)}`;

    getOrCreateVariable(name, collection, "FLOAT").setValueForMode(themeModeId, value.px);
  });

  getOrCreateVariable("Radius/Circular", collection, "FLOAT").setValueForMode(themeModeId, 999);
  getOrCreateVariable("Radius/None", collection, "FLOAT").setValueForMode(themeModeId, 0);
};

const uploadUnitVariables = (theme: G.Theme, themeModeId: string) => {
  const collection = getOrCreateCollection(THEME_COLLECTION_NAME);
  const baseUnit = theme.unit.base;

  [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 14, 16, 18, 20].forEach((multiplier) => {
    getOrCreateVariable(`Unit/x${multiplier}`, collection, "FLOAT").setValueForMode(
      themeModeId,
      baseUnit.px * multiplier,
    );
  });
};

const uploadShadowVariables = (theme: G.Theme, themeModeId: string) => {
  const collection = getOrCreateCollection(THEME_COLLECTION_NAME);

  Object.keys(theme.shadow).forEach((key) => {
    const tokenArray = theme.shadow[key];

    tokenArray.forEach((token, index) => {
      const baseName = `Shadow/Styles/${formatTokenName(key)}/Layer ${index + 1}`;
      const colorToken = theme.color[token.colorToken];

      const xVariable = getOrCreateVariable(`${baseName}/X`, collection, "FLOAT");

      xVariable.setValueForMode(themeModeId, token.offsetX);
      xVariable.hiddenFromPublishing = true;

      const yVariable = getOrCreateVariable(`${baseName}/Y`, collection, "FLOAT");

      yVariable.setValueForMode(themeModeId, token.offsetY);
      yVariable.hiddenFromPublishing = true;

      const blurVariable = getOrCreateVariable(`${baseName}/Blur`, collection, "FLOAT");

      blurVariable.setValueForMode(themeModeId, token.blurRadius ?? 0);
      blurVariable.hiddenFromPublishing = true;

      const spreadVariable = getOrCreateVariable(`${baseName}/Spread`, collection, "FLOAT");

      spreadVariable.setValueForMode(themeModeId, token.spreadRadius ?? 0);
      spreadVariable.hiddenFromPublishing = true;

      const colorVariable = getOrCreateVariable(`${baseName}/Color`, collection, "COLOR");

      colorVariable.setValueForMode(themeModeId, hexToRgba(colorToken.hex, token.opacity));
      colorVariable.hiddenFromPublishing = true;
    });
  });
};

const uploadViewportVariables = (theme: G.Theme, themeModeId: string) => {
  const collection = getOrCreateCollection(THEME_COLLECTION_NAME);

  Object.keys(theme.viewport).forEach((key) => {
    const token = theme.viewport[key as keyof typeof theme.viewport];

    if (!token.minPx) return;

    const viewportVariable = getOrCreateVariable(`Viewport/${key.toUpperCase()}`, collection, "FLOAT");

    viewportVariable.setValueForMode(themeModeId, token.minPx);
    viewportVariable.hiddenFromPublishing = true;
  });
};

const uploadFontFamilyVariables = (
  theme: G.Theme,
  themeModeId: string,
  fontFamily: { body: string; title: string },
) => {
  const collection = getOrCreateCollection(THEME_COLLECTION_NAME);

  Object.keys(theme.fontFamily).forEach((key) => {
    const tokenName = key as "title" | "body";
    const familyVariable = getOrCreateVariable(`Font/Family/${formatTokenName(key)}`, collection, "STRING");

    familyVariable.setValueForMode(themeModeId, fontFamily[tokenName]);
    familyVariable.hiddenFromPublishing = true;
  });
};

const uploadFontWeightVariables = (theme: G.Theme, themeModeId: string) => {
  const collection = getOrCreateCollection(THEME_COLLECTION_NAME);

  Object.keys(theme.fontWeight).forEach((key) => {
    const token = theme.fontWeight[key];

    const weightVariable = getOrCreateVariable(`Font/Weight/${formatTokenName(key)}`, collection, "FLOAT");

    weightVariable.setValueForMode(themeModeId, token.weight);
    weightVariable.hiddenFromPublishing = true;
  });
};

const uploadFontVariables = (theme: G.Theme, themeModeId: string) => {
  const collection = getOrCreateCollection(THEME_COLLECTION_NAME);

  Object.keys(theme.font).forEach((key) => {
    const token = theme.font[key];

    const sizeVariable = getOrCreateVariable(`Font/Styles/${formatTokenName(key)}/Size`, collection, "FLOAT");

    sizeVariable.setValueForMode(themeModeId, token.fontSize.px);
    sizeVariable.hiddenFromPublishing = true;

    const lineHeightVariable = getOrCreateVariable(
      `Font/Styles/${formatTokenName(key)}/Line Height`,
      collection,
      "FLOAT",
    );

    lineHeightVariable.setValueForMode(themeModeId, token.lineHeight.px);

    // Resolve font weight
    // If there is no weight token, font support 3 predefined weights
    const weights = token.fontWeightToken ? [token.fontWeightToken] : ["regular", "medium", "bold"];

    weights.forEach((weightName) => {
      const formattedWeightName = formatTokenName(weightName);
      const weightVariable = getOrCreateVariable(`Font/Weight/${formattedWeightName}`, collection, "FLOAT");
      const alias = figma.variables.createVariableAlias(weightVariable);
      const tokenName = `Font/Styles/${formatTokenName(key)}`;

      const weightAliasVariable = getOrCreateVariable(
        weights.length === 1 ? `${tokenName}/Weight` : `${tokenName}/${formattedWeightName}/Weight`,
        collection,
        "FLOAT",
      );

      weightAliasVariable.setValueForMode(themeModeId, alias);
      weightAliasVariable.hiddenFromPublishing = true;
    });

    // Resolve font family
    if (token.fontFamilyToken) {
      const familyVariable = getOrCreateVariable(
        `Font/Family/${formatTokenName(token.fontFamilyToken)}`,
        collection,
        "FLOAT",
      );
      const alias = figma.variables.createVariableAlias(familyVariable);

      const familyAliasVariabel = getOrCreateVariable(
        `Font/Styles/${formatTokenName(key)}/Family`,
        collection,
        "STRING",
      );

      familyAliasVariabel.setValueForMode(themeModeId, alias);
      familyAliasVariabel.hiddenFromPublishing = true;
    }
  });
};

const uploadColorVariables = (theme: G.Theme, themeModeId: string) => {
  const collection = getOrCreateCollection(THEME_COLLECTION_NAME);
  const groupNames = ["background", "foreground", "border", "onBackground"];
  const staticNames = ["black", "white", "brand"];

  Object.keys(theme.color).forEach((key) => {
    const token = theme.color[key];
    const groupName = staticNames.includes(key) ? "static" : groupNames.find((name) => key.startsWith(name)) || "meta";

    if (key.startsWith("rgb") || key.startsWith("onBrand")) return;

    const lightColorVariable = getOrCreateVariable(
      `Color/Light/${formatTokenName(groupName)}/${formatTokenName(key.replace(groupName, ""))}`,
      collection,
      "COLOR",
    );

    lightColorVariable.setValueForMode(themeModeId, hexToRgba(token.hex));
    lightColorVariable.hiddenFromPublishing = true;

    const darkColorVariable = getOrCreateVariable(
      `Color/Dark/${formatTokenName(groupName)}/${formatTokenName(key.replace(groupName, ""))}`,
      collection,
      "COLOR",
    );

    darkColorVariable.setValueForMode(themeModeId, hexToRgba(token.hexDark || token.hex));
    darkColorVariable.hiddenFromPublishing = true;
  });
};

export const uploadJsonTheme = async (
  theme: G.Theme,
  themeName: string,
  fontFamily: { body: string; title: string },
) => {
  cachedCollections = {};
  cachedVariabes = {};

  const collection = getOrCreateCollection(THEME_COLLECTION_NAME);
  const existingThemeMode = collection.modes.find((mode) => mode.name === themeName);
  const themeModeId = existingThemeMode ? existingThemeMode.modeId : collection.addMode(themeName);

  /**
   * Figma automatically adds a default mode for an empty collection
   * We can only clean it up once another mode was added
   */
  if (collection.modes[0].name === FIGMA_DEFAULT_MODE_NAME) {
    collection.removeMode(collection.modes[0].modeId);
  }

  uploadColorVariables(theme, themeModeId);
  uploadRadiusVariables(theme, themeModeId);
  uploadUnitVariables(theme, themeModeId);
  uploadShadowVariables(theme, themeModeId);
  uploadFontFamilyVariables(theme, themeModeId, fontFamily);
  uploadFontWeightVariables(theme, themeModeId);
  uploadFontVariables(theme, themeModeId);
  uploadViewportVariables(theme, themeModeId);
};
