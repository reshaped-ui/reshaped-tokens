/**
 * Reverse utility for extracting Reshaped theme from Figma variables.
 * Reads variables from the Figma "Theme" collection and outputs a ThemeDefinition.
 */

const THEME_COLLECTION_NAME = "Theme";

// Cache for variable lookups
let variablesCache: Record<string, Variable> = {};

/**
 * Initialize variables cache for faster lookups
 */
function initCache(variables: Variable[]) {
  variablesCache = {};
  variables.forEach((v) => {
    variablesCache[v.name] = v;
  });
}

/**
 * Get a variable by exact name from cache
 */
function getVariable(name: string): Variable | undefined {
  return variablesCache[name];
}

/**
 * Get variable value for a mode, returns undefined if not found
 */
function getValue(variable: Variable | undefined, modeId: string): VariableValue | undefined {
  if (!variable) return undefined;
  return variable.valuesByMode[modeId];
}

/**
 * Converts RGBA to hex string
 */
function rgbaToHex(rgba: RGBA): string {
  const r = Math.round(rgba.r * 255)
    .toString(16)
    .padStart(2, "0");
  const g = Math.round(rgba.g * 255)
    .toString(16)
    .padStart(2, "0");
  const b = Math.round(rgba.b * 255)
    .toString(16)
    .padStart(2, "0");
  const a =
    rgba.a !== undefined && rgba.a < 1
      ? Math.round(rgba.a * 255)
          .toString(16)
          .padStart(2, "0")
      : "";
  return `#${r}${g}${b}${a}`;
}

/**
 * Converts "Title 1" -> "title1", "Background Primary" -> "backgroundPrimary"
 */
function toCamelCase(formatted: string): string {
  const words = formatted.split(" ");
  return words
    .map((word, i) => (i === 0 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()))
    .join("");
}

/**
 * Get the aliased variable's token name from an alias value
 * E.g., if Font/Styles/Title 1/Weight aliases to Font/Weight/Bold, returns "bold"
 */
function getAliasedTokenName(value: VariableValue, pattern: RegExp): string | undefined {
  if (typeof value === "object" && "type" in value && value.type === "VARIABLE_ALIAS") {
    const aliasedVar = figma.variables.getVariableById(value.id);
    if (aliasedVar) {
      const match = aliasedVar.name.match(pattern);
      if (match) return toCamelCase(match[1]);
    }
  }
  return undefined;
}

// =============================================================================
// Token Extractors
// =============================================================================

type ThemeOutput = {
  fontFamily: Record<string, { family: string }>;
  fontWeight: Record<string, { weight: number }>;
  font: Record<
    string,
    {
      fontSize: { px: number };
      lineHeight: { px: number };
      fontWeightToken?: string;
      fontFamilyToken?: string;
      letterSpacing?: { px: number };
    }
  >;
  unit: Record<string, { px: number }>;
  radius: Record<string, { px: number }>;
  color: Record<string, { hex: string; hexDark?: string }>;
  shadow: Record<
    string,
    Array<{
      offsetX: number;
      offsetY: number;
      blurRadius: number;
      spreadRadius: number;
      colorToken: string;
      opacity: number;
    }>
  >;
  viewport: Record<string, { minPx?: number; maxPx?: number }>;
  duration: Record<string, { ms: number }>;
  easing: Record<string, { x1: number; y1: number; x2: number; y2: number }>;
  zIndex: Record<string, { level: number }>;
};

function extractFontFamily(modeId: string): ThemeOutput["fontFamily"] {
  const result: ThemeOutput["fontFamily"] = {};
  const fallback = "BlinkMacSystemFont, -apple-system, Roboto, Helvetica, Arial, sans-serif";
  const monoFallback = "Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace";

  ["Title", "Body", "Monospace"].forEach((name) => {
    const variable = getVariable(`Font/Family/${name}`);
    const value = getValue(variable, modeId);
    if (typeof value === "string") {
      const tokenName = toCamelCase(name);
      const fb = tokenName === "monospace" ? monoFallback : fallback;
      result[tokenName] = { family: `${value}, ${fb}` };
    }
  });

  return result;
}

// Maps Figma font weight names to numeric CSS weight values
const FONT_WEIGHT_MAP: Record<string, number> = {
  thin: 100,
  extralight: 200,
  light: 300,
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
  black: 900,
};

function extractFontWeight(): ThemeOutput["fontWeight"] {
  const result: ThemeOutput["fontWeight"] = {};

  // Look for all Font/Weight/* variables and map names to numeric weights
  Object.values(variablesCache).forEach((variable) => {
    const match = variable.name.match(/^Font\/Weight\/(.+)$/);
    if (!match) return;

    const tokenName = toCamelCase(match[1]);
    const weight = FONT_WEIGHT_MAP[tokenName];

    if (weight !== undefined) {
      result[tokenName] = { weight };
    }
  });

  return result;
}

function extractFont(modeId: string): ThemeOutput["font"] {
  const result: ThemeOutput["font"] = {};

  // Find all font styles by looking for Size variables
  Object.values(variablesCache).forEach((variable) => {
    const match = variable.name.match(/^Font\/Styles\/(.+?)\/Size$/);
    if (!match) return;

    const formattedName = match[1];
    const tokenName = toCamelCase(formattedName);

    const sizeValue = getValue(variable, modeId);
    const lineHeightValue = getValue(getVariable(`Font/Styles/${formattedName}/Line height`), modeId);

    if (typeof sizeValue !== "number" || typeof lineHeightValue !== "number") return;

    const fontToken: ThemeOutput["font"][string] = {
      fontSize: { px: sizeValue },
      lineHeight: { px: lineHeightValue },
    };

    const letterSpacingValue = getValue(getVariable(`Font/Styles/${formattedName}/Letter spacing`), modeId);
    if (typeof letterSpacingValue === "number") {
      fontToken.letterSpacing = { px: letterSpacingValue };
    }

    // Check if this font has a single weight token (Font/Styles/{name}/Weight)
    // vs multiple weight variants (Font/Styles/{name}/Regular/Weight, etc.)
    const singleWeightVariable = getVariable(`Font/Styles/${formattedName}/Weight`);
    const hasMultipleWeights = Object.keys(variablesCache).some((name) =>
      name.match(new RegExp(`^Font/Styles/${formattedName}/.+/Weight$`)),
    );

    // Only set fontWeightToken if there's a single weight alias (not multiple variants)
    if (singleWeightVariable && !hasMultipleWeights) {
      const weightValue = getValue(singleWeightVariable, modeId);
      if (weightValue) {
        const weightToken = getAliasedTokenName(weightValue, /^Font\/Weight\/(.+)$/);
        if (weightToken) fontToken.fontWeightToken = weightToken;
      }
    }

    // Get fontFamilyToken from Family alias
    const familyVariable = getVariable(`Font/Styles/${formattedName}/Family`);
    const familyValue = getValue(familyVariable, modeId);
    if (familyValue) {
      const familyToken = getAliasedTokenName(familyValue, /^Font\/Family\/(.+)$/);
      if (familyToken) fontToken.fontFamilyToken = familyToken;
    }

    result[tokenName] = fontToken;
  });

  return result;
}

function extractUnit(modeId: string): ThemeOutput["unit"] {
  const result: ThemeOutput["unit"] = {};

  // Get base unit from x1
  const x1Value = getValue(getVariable("Unit/x1"), modeId);
  if (typeof x1Value === "number") {
    result.base = { px: x1Value };
  }

  // Get all unit multipliers
  // [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].forEach((n) => {
  //   const value = getValue(getVariable(`Unit/x${n}`), modeId);
  //   if (typeof value === "number") {
  //     result[`x${n}`] = { px: value };
  //   }
  // });

  return result;
}

function extractRadius(modeId: string): ThemeOutput["radius"] {
  const result: ThemeOutput["radius"] = {};

  ["Small", "Medium", "Large"].forEach((name) => {
    const value = getValue(getVariable(`Radius/${name}`), modeId);
    if (typeof value === "number") {
      result[toCamelCase(name)] = { px: value };
    }
  });

  return result;
}

function extractColor(lightModeId: string, darkModeId: string): ThemeOutput["color"] {
  const result: ThemeOutput["color"] = {};

  Object.values(variablesCache).forEach((variable) => {
    const match = variable.name.match(/^Color\/Light\/(.+?)\/(.+)$/);
    if (!match || variable.resolvedType !== "COLOR") return;

    const groupFormatted = match[1];
    const tokenFormatted = match[2];

    // Build the camelCase token name
    const groupCamel = toCamelCase(groupFormatted);
    const tokenCamel = toCamelCase(tokenFormatted);
    const tokenCapitalized = tokenCamel.charAt(0).toUpperCase() + tokenCamel.slice(1);
    const fullTokenName = groupCamel === "static" ? tokenCamel : `${groupCamel}${tokenCapitalized}`;

    // Skip generated tokens
    if (fullTokenName.startsWith("rgb") || fullTokenName === "onBrand") return;

    const lightValue = getValue(variable, lightModeId);
    if (typeof lightValue !== "object" || !("r" in lightValue)) return;

    const hex = rgbaToHex(lightValue as RGBA);
    const colorToken: ThemeOutput["color"][string] = { hex };

    // Get dark mode value
    const darkVariable = getVariable(`Color/Dark/${groupFormatted}/${tokenFormatted}`);
    const darkValue = getValue(darkVariable, darkModeId);
    if (typeof darkValue === "object" && "r" in darkValue) {
      colorToken.hexDark = rgbaToHex(darkValue as RGBA);
    }

    result[fullTokenName] = colorToken;
  });

  return result;
}

function extractShadow(modeId: string): ThemeOutput["shadow"] {
  const result: ThemeOutput["shadow"] = {};

  // Find all shadow styles
  const shadowStyles = new Set<string>();
  Object.values(variablesCache).forEach((variable) => {
    const match = variable.name.match(/^Shadow\/Styles\/(.+?)\/Layer \d+/);
    if (match) shadowStyles.add(match[1]);
  });

  shadowStyles.forEach((styleName) => {
    const layers: ThemeOutput["shadow"][string] = [];
    let layerIndex = 1;

    while (true) {
      const prefix = `Shadow/Styles/${styleName}/Layer ${layerIndex}`;
      const x = getValue(getVariable(`${prefix}/X`), modeId);
      const y = getValue(getVariable(`${prefix}/Y`), modeId);
      const blur = getValue(getVariable(`${prefix}/Blur`), modeId);
      const spread = getValue(getVariable(`${prefix}/Spread`), modeId);
      const color = getValue(getVariable(`${prefix}/Color`), modeId);

      if (typeof x !== "number" || typeof y !== "number") break;

      layers.push({
        offsetX: x,
        offsetY: y,
        blurRadius: typeof blur === "number" ? blur : 0,
        spreadRadius: typeof spread === "number" ? spread : 0,
        colorToken: "black", // Default, could be improved
        opacity: typeof color === "object" && "a" in color ? (color as RGBA).a ?? 1 : 1,
      });

      layerIndex++;
    }

    if (layers.length > 0) {
      result[toCamelCase(styleName)] = layers;
    }
  });

  return result;
}

// =============================================================================
// Main Export
// =============================================================================

export function extractThemeFromFigma(modeName: string): Partial<ThemeOutput> {
  const collection = figma.variables.getLocalVariableCollections().find((c) => c.name === THEME_COLLECTION_NAME);
  if (!collection) throw new Error(`Collection "${THEME_COLLECTION_NAME}" not found`);

  const mode = collection.modes.find((m) => m.name === modeName);
  if (!mode) throw new Error(`Mode "${modeName}" not found`);

  // Get all variables in this collection
  const allVariables = figma.variables.getLocalVariables().filter((v) => {
    const varCollection = v.variableCollectionId
      ? figma.variables.getVariableCollectionById(v.variableCollectionId)
      : null;
    return varCollection?.id === collection.id;
  });

  initCache(allVariables);

  // Find light/dark modes for colors
  const lightMode = collection.modes.find((m) => m.name.toLowerCase().includes("light")) || mode;
  const darkMode = collection.modes.find((m) => m.name.toLowerCase().includes("dark")) || mode;

  return {
    fontFamily: extractFontFamily(mode.modeId),
    fontWeight: extractFontWeight(),
    font: extractFont(mode.modeId),
    unit: extractUnit(mode.modeId),
    radius: extractRadius(mode.modeId),
    color: extractColor(lightMode.modeId, darkMode.modeId),
    shadow: extractShadow(mode.modeId),
  };
}
