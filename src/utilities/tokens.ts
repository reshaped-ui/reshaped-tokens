import type * as G from "types/global.js";

const THEME_COLLECTION_NAME = "Theme";
const FIGMA_DEFAULT_MODE_NAME = "Mode 1";

const formatTokenName = (s: string) => {
  const name = s.replace(/([a-z][a-z])([A-Z]|[0-9])/g, "$1 $2").toLowerCase();
  return name.charAt(0).toUpperCase() + name.slice(1);
};

function hexToRgba(hex: string, alpha?: number): RGBA {
  if (typeof hex !== "string" || !/^#([0-9a-f]{6}|[0-9a-f]{8})$/i.test(hex)) {
    throw new Error(`invalid hex color "${hex}"`);
  }

  const hexAlpha = hex.length === 9 ? parseInt(hex.slice(7, 9), 16) / 255 : undefined;

  return {
    r: parseInt(hex.slice(1, 3), 16) / 255,
    g: parseInt(hex.slice(3, 5), 16) / 255,
    b: parseInt(hex.slice(5, 7), 16) / 255,
    a: hexAlpha ?? alpha ?? 1,
  };
}

/**
 * Upload context, shared by all token handlers
 */
type Context = {
  collection: VariableCollection;
  modeId: string;
  /** Variables of the theme collection, by name */
  variables: Map<string, Variable>;
  /** Non-fatal problems, reported back to the plugin UI */
  issues: string[];
};

/**
 * Run a single token handler without letting its failure abort the whole upload
 */
const safely = (ctx: Context, label: string, fn: () => void) => {
  try {
    fn();
  } catch (e) {
    ctx.issues.push(`${label}: ${e instanceof Error ? e.message : String(e)}`);
  }
};

const getOrCreateVariable = (ctx: Context, name: string, type: VariableResolvedDataType) => {
  const existing = ctx.variables.get(name);

  if (existing) {
    if (existing.resolvedType !== type) {
      throw new Error(
        `existing variable "${name}" has type ${existing.resolvedType}, expected ${type}. Delete or retype it in Figma to update it`,
      );
    }

    return existing;
  }

  const variable = figma.variables.createVariable(name, ctx.collection, type);
  ctx.variables.set(name, variable);
  return variable;
};

const setVariable = (
  ctx: Context,
  name: string,
  type: VariableResolvedDataType,
  value: VariableValue,
  options: { hidden?: boolean } = {},
) => {
  const variable = getOrCreateVariable(ctx, name, type);

  variable.setValueForMode(ctx.modeId, value);
  if (options.hidden) variable.hiddenFromPublishing = true;

  return variable;
};

const assertNumber = (value: unknown, label: string): number => {
  if (typeof value !== "number" || !Number.isFinite(value)) throw new Error(`${label} is not a number`);
  return value;
};

/**
 * Handlers for different types of Reshaped tokens
 */

const uploadRadiusVariables = (ctx: Context, theme: G.Theme) => {
  Object.entries(theme.radius ?? {}).forEach(([key, token]) => {
    safely(ctx, `radius.${key}`, () => {
      setVariable(ctx, `Radius/${formatTokenName(key)}`, "FLOAT", assertNumber(token?.px, "px"));
    });
  });

  safely(ctx, "radius.circular", () => setVariable(ctx, "Radius/Circular", "FLOAT", 999));
  safely(ctx, "radius.none", () => setVariable(ctx, "Radius/None", "FLOAT", 0));
};

const uploadUnitVariables = (ctx: Context, theme: G.Theme) => {
  const baseUnit = theme.unit?.base?.px;

  if (typeof baseUnit !== "number") {
    ctx.issues.push("unit.base is missing, unit variables were skipped");
    return;
  }

  [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 14, 16, 18, 20].forEach((multiplier) => {
    safely(ctx, `unit.x${multiplier}`, () => {
      setVariable(ctx, `Unit/x${multiplier}`, "FLOAT", baseUnit * multiplier);
    });
  });
};

const normalizeShadow = (shadow: G.ThemeShadow | G.ThemeShadowPart[]): G.ThemeShadow => {
  // v3 themes stored shadows as an array of parts
  if (Array.isArray(shadow)) return { parts: shadow };
  if (shadow && Array.isArray(shadow.parts)) return shadow;
  throw new Error("unsupported shadow format, expected { parts: [...] }");
};

const uploadShadowLayers = (
  ctx: Context,
  theme: G.Theme,
  baseName: string,
  parts: G.ThemeShadowPart[],
  dark: boolean,
) => {
  parts.forEach((part, index) => {
    const layerName = `${baseName}/Layer ${index + 1}`;
    const color = theme.color?.[part.colorToken];

    if (!color) throw new Error(`layer ${index + 1} uses unknown color token "${part.colorToken}"`);

    const hex = dark ? color.hexDark || color.hex : color.hex;

    setVariable(ctx, `${layerName}/X`, "FLOAT", assertNumber(part.offsetX, "offsetX"), { hidden: true });
    setVariable(ctx, `${layerName}/Y`, "FLOAT", assertNumber(part.offsetY, "offsetY"), { hidden: true });
    setVariable(ctx, `${layerName}/Blur`, "FLOAT", part.blurRadius ?? 0, { hidden: true });
    setVariable(ctx, `${layerName}/Spread`, "FLOAT", part.spreadRadius ?? 0, { hidden: true });
    setVariable(ctx, `${layerName}/Color`, "COLOR", hexToRgba(hex, part.opacity), { hidden: true });
  });

  // Other modes might use more layers for the same shadow, make the extra ones invisible in this mode
  for (let index = parts.length + 1; ctx.variables.has(`${baseName}/Layer ${index}/X`); index++) {
    const layerName = `${baseName}/Layer ${index}`;

    ["X", "Y", "Blur", "Spread"].forEach((prop) => {
      if (ctx.variables.has(`${layerName}/${prop}`)) setVariable(ctx, `${layerName}/${prop}`, "FLOAT", 0);
    });

    if (ctx.variables.has(`${layerName}/Color`)) {
      setVariable(ctx, `${layerName}/Color`, "COLOR", { r: 0, g: 0, b: 0, a: 0 });
    }
  }
};

const uploadShadowVariables = (ctx: Context, theme: G.Theme) => {
  Object.entries(theme.shadow ?? {}).forEach(([key, value]) => {
    safely(ctx, `shadow.${key}`, () => {
      const shadow = normalizeShadow(value);
      const baseName = `Shadow/Styles/${formatTokenName(key)}`;

      uploadShadowLayers(ctx, theme, baseName, shadow.parts, false);
      // Same convention as colors: dark values live in a separate set of variables
      uploadShadowLayers(ctx, theme, `${baseName}/Dark`, shadow.dark?.parts ?? shadow.parts, true);
    });
  });
};

const uploadViewportVariables = (ctx: Context, theme: G.Theme) => {
  Object.entries(theme.viewport ?? {}).forEach(([key, token]) => {
    if (!token?.minPx) return;

    safely(ctx, `viewport.${key}`, () => {
      setVariable(ctx, `Viewport/${key.toUpperCase()}`, "FLOAT", token.minPx!, { hidden: true });
    });
  });
};

const uploadFontFamilyVariables = (ctx: Context, theme: G.Theme, fontFamily: { body: string; title: string }) => {
  Object.keys(theme.fontFamily ?? {}).forEach((key) => {
    // The plugin only collects title/body families from the user.
    // Headline falls back to title, monospace/everything else falls back to body.
    const resolvedFamily = key === "title" || key === "headline" ? fontFamily.title : fontFamily.body;

    safely(ctx, `fontFamily.${key}`, () => {
      setVariable(ctx, `Font/Family/${formatTokenName(key)}`, "STRING", resolvedFamily, { hidden: true });
    });
  });
};

const uploadFontWeightVariables = (ctx: Context, theme: G.Theme) => {
  Object.keys(theme.fontWeight ?? {}).forEach((key) => {
    const formattedWeightName = formatTokenName(key);

    safely(ctx, `fontWeight.${key}`, () => {
      setVariable(ctx, `Font/Weight/${formattedWeightName}`, "STRING", formattedWeightName, { hidden: true });
    });
  });
};

const uploadFontVariables = (ctx: Context, theme: G.Theme) => {
  Object.entries(theme.font ?? {}).forEach(([key, token]) => {
    const baseName = `Font/Styles/${formatTokenName(key)}`;

    safely(ctx, `font.${key}`, () => {
      setVariable(ctx, `${baseName}/Size`, "FLOAT", assertNumber(token?.fontSize?.px, "fontSize.px"), {
        hidden: true,
      });
      setVariable(ctx, `${baseName}/Line height`, "FLOAT", assertNumber(token.lineHeight?.px, "lineHeight.px"));
      setVariable(ctx, `${baseName}/Letter spacing`, "FLOAT", token.letterSpacing?.px ?? 0, { hidden: true });

      // Resolve font weight
      const formattedWeightName = formatTokenName(token.fontWeightToken ?? "regular");
      const weightVariable = setVariable(ctx, `Font/Weight/${formattedWeightName}`, "STRING", formattedWeightName, {
        hidden: true,
      });
      setVariable(ctx, `${baseName}/Weight`, "STRING", figma.variables.createVariableAlias(weightVariable), {
        hidden: true,
      });

      // Resolve font family
      if (token.fontFamilyToken) {
        const familyVariable = ctx.variables.get(`Font/Family/${formatTokenName(token.fontFamilyToken)}`);

        if (!familyVariable) throw new Error(`unknown fontFamilyToken "${token.fontFamilyToken}"`);

        setVariable(ctx, `${baseName}/Family`, "STRING", figma.variables.createVariableAlias(familyVariable), {
          hidden: true,
        });
      }
    });
  });
};

const uploadColorVariables = (ctx: Context, theme: G.Theme) => {
  const groupNames = ["background", "foreground", "border", "onBackground"];
  const staticNames = ["black", "white", "brand"];

  Object.entries(theme.color ?? {}).forEach(([key, token]) => {
    // Generated tokens, not stored in Figma
    if (key.startsWith("rgb") || key.startsWith("onBrand")) return;

    const groupName = staticNames.includes(key) ? "static" : groupNames.find((name) => key.startsWith(name)) || "meta";
    const variableName = `${formatTokenName(groupName)}/${formatTokenName(key.replace(groupName, ""))}`;

    safely(ctx, `color.${key}`, () => {
      const light = hexToRgba(token?.hex);
      const dark = hexToRgba(token.hexDark || token.hex);

      setVariable(ctx, `Color/Light/${variableName}`, "COLOR", light, { hidden: true });
      setVariable(ctx, `Color/Dark/${variableName}`, "COLOR", dark, { hidden: true });
    });
  });
};

const getOrCreateMode = (collection: VariableCollection, themeName: string) => {
  const existingThemeMode = collection.modes.find((mode) => mode.name === themeName);
  if (existingThemeMode) return existingThemeMode.modeId;

  try {
    return collection.addMode(themeName);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    const hint = /limit/i.test(message)
      ? " Your Figma plan limits the number of modes per collection, remove an unused mode or upload into an existing one by using its name."
      : "";

    throw new Error(
      `Couldn't create the "${themeName}" mode in the "${THEME_COLLECTION_NAME}" collection: ${message}.${hint}`,
    );
  }
};

/**
 * Upload a Reshaped theme.json into the Theme variable collection.
 * Throws if the variable mode can't be created, individual token failures are returned as issues.
 */
export const uploadJsonTheme = async (
  theme: G.Theme,
  themeName: string,
  fontFamily: { body: string; title: string },
): Promise<{ issues: string[] }> => {
  if (!theme || typeof theme !== "object" || Array.isArray(theme)) {
    throw new Error("The selected file is not a valid Reshaped theme.json");
  }

  if (!theme.color && !theme.font && !theme.unit) {
    throw new Error(
      "The selected file doesn't contain any Reshaped tokens. Make sure you've selected a theme.json file",
    );
  }

  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  const collection =
    collections.find((c) => c.name === THEME_COLLECTION_NAME) ??
    figma.variables.createVariableCollection(THEME_COLLECTION_NAME);
  const localVariables = await figma.variables.getLocalVariablesAsync();
  const modeId = getOrCreateMode(collection, themeName);

  /**
   * Figma automatically adds a default mode for an empty collection
   * We can only clean it up once another mode was added
   */
  if (collection.modes.length > 1 && collection.modes[0].name === FIGMA_DEFAULT_MODE_NAME) {
    collection.removeMode(collection.modes[0].modeId);
  }

  const ctx: Context = {
    collection,
    modeId,
    // Only look up variables inside the theme collection, other collections can use the same names
    variables: new Map(localVariables.filter((v) => v.variableCollectionId === collection.id).map((v) => [v.name, v])),
    issues: [],
  };

  uploadColorVariables(ctx, theme);
  uploadRadiusVariables(ctx, theme);
  uploadUnitVariables(ctx, theme);
  uploadShadowVariables(ctx, theme);
  uploadFontFamilyVariables(ctx, theme, fontFamily);
  uploadFontWeightVariables(ctx, theme);
  uploadFontVariables(ctx, theme);
  uploadViewportVariables(ctx, theme);

  return { issues: ctx.issues };
};
