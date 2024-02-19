import * as G from "types/global";

function hexToRgb(hex: string) {
	return {
		r: parseInt(hex.slice(1, 3), 16) / 255,
		g: parseInt(hex.slice(3, 5), 16) / 255,
		b: parseInt(hex.slice(5, 7), 16) / 255,
	};
}

const formatFontName = (s: string) => {
	const name = s.replace(/([a-z][a-z])([A-Z]|[0-9])/g, "$1 $2").toLowerCase();
	return name.charAt(0).toUpperCase() + name.slice(1);
};

function formatColorName(name: string) {
	const chunks = name
		.replace(/([A-Z])/g, " $1")
		.trim()
		.split(" ");
	const isOnColor = name.startsWith("on");

	// Ignore on branc
	if (isOnColor && chunks.length === 2) {
		return;
	}

	if (chunks.length === 1) {
		chunks.unshift("static");
	}

	return chunks
		.map((word, index) => {
			const slashIndex = isOnColor ? 1 : 0;
			const formattedWord =
				index === 0 || index === slashIndex + 1
					? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
					: word.toLowerCase();

			return formattedWord + (slashIndex === index ? " /" : "");
		})
		.join(" ")
		.replace(" / ", "/");
}

/**
 * Import local style tokens from Figma
 */
const styleCache: Record<string, Promise<BaseStyle> | BaseStyle> = {};
const importStyleByKey = async (key: string) => {
	// Already being loaded, get style from the same promise instead of creating a new one
	if (styleCache[key] && "then" in styleCache[key]) {
		const style = await styleCache[key];
		return style;
	}

	// Already exists in cache
	if (styleCache[key]) {
		return styleCache[key];
	}

	styleCache[key] = figma.importStyleByKeyAsync(key);
	const style = await styleCache[key];
	styleCache[key] = style;

	return style;
};

const variablesCache: Record<string, Promise<Variable> | Variable> = {};
const importVariableByKey = async (key: string) => {
	// Already being loaded, get style from the same promise instead of creating a new one
	if (variablesCache[key] && "then" in variablesCache[key]) {
		const variable = await variablesCache[key];
		return variable;
	}

	// Already exists in cache
	if (variablesCache[key]) {
		return variablesCache[key];
	}

	variablesCache[key] = figma.variables.importVariableByKeyAsync(key);
	const variable = await variablesCache[key];
	variablesCache[key] = variable;

	return variable;
};

const getTokens = async <Type extends "color" | "shadow" | "font">(
	type: Type,
	styles: BaseStyle[]
) => {
	const result: Record<string, G.BaseToken<Type>> = {};
	let hasUnpublished = false;

	const asyncQueue = styles.map(async (style) => {
		const status = await style.getPublishStatusAsync();

		if (status === "UNPUBLISHED") {
			hasUnpublished = true;
			return;
		}

		result[style.name] = { styleName: style.name, type, styleKey: style.key, id: style.id };
	});

	await Promise.all(asyncQueue);

	if (hasUnpublished)
		figma.notify("Some of the styles are unpublished and they were not synced", { error: true });
	return result;
};

const getVariables = async <Type extends "color" | "number">(type: Type, variables: Variable[]) => {
	const result: Record<string, G.BaseVariable<Type>> = {};

	const asyncQueue = variables.map(async (variable) => {
		// const status = await variable.getPublishStatusAsync();

		// if (status === "UNPUBLISHED") return;
		result[variable.name] = {
			variableName: variable.name,
			type,
			variableKey: variable.key,
			id: variable.id,
		};
	});

	await Promise.all(asyncQueue);
	return result;
};

export const getColorTokens = async () => {
	const styles = figma.getLocalPaintStyles().filter((style) => style.paints.length === 1);
	const tokens = await getTokens("color", styles);

	return tokens;
};

export const getShadowTokens = async () => {
	const styles = figma.getLocalEffectStyles();
	const tokens = await getTokens("shadow", styles);
	return tokens;
};

export const getFontTokens = async () => {
	const styles = figma.getLocalTextStyles();
	const tokens = await getTokens("font", styles);
	return tokens;
};

export const getNumberVariables = async () => {
	const localVariables = figma.variables.getLocalVariables("FLOAT");
	const variables = await getVariables("number", localVariables);

	return variables;
};

export const applyStylesToNode = async (
	node: any,
	styles: G.ThemeStyles["color"] | G.ThemeStyles["shadow"] | G.ThemeStyles["font"],
	properties: Array<"fillStyleId" | "strokeStyleId" | "effectStyleId" | "textStyleId">
) => {
	properties.forEach(async (styleProperty) => {
		// Converting the type because other options are more verbose
		const styleId = node[styleProperty] as string;
		if (!styleId) return;

		const style = figma.getStyleById(styleId);
		if (!style?.name) return;

		const token = styles[style.name];
		if (!token || token.styleName !== style.name) return;

		const targetStyle = await importStyleByKey(token.styleKey);

		// eslint-disable-next-line no-param-reassign
		node[styleProperty] = targetStyle.id;
	});
};

export const applyVariablesToNode = async (
	node: any,
	variables: G.ThemeVariables["number"],
	properties: Array<VariableBindableNodeField>
) => {
	properties.forEach(async (variableProperty) => {
		const variableId = node.boundVariables[variableProperty]?.id;
		const variable = figma.variables.getVariableById(variableId);

		if (!variable) return;

		for (let key of Object.keys(variables)) {
			const formattedVariable = variable && variable.name.split("/").pop()?.trim();
			const formattedKey = key.split("/").pop()?.trim();
			const isMatch = formattedKey === formattedVariable;
			console.log({ formattedKey, formattedVariable });

			if (!isMatch) {
				continue;
			}
			const nextKey = variables[key]?.variableKey;
			console.log({ variable, key });

			if (nextKey) {
				const nextVariable = await importVariableByKey(nextKey);

				if (!nextVariable) return;
				const nextId = nextVariable.id;
				node.setBoundVariable(variableProperty, nextId);
				console.log("APPAL");
			}
		}
	});
};

/**
 * Recursively apply tokens to all nodes within root
 */
export const applyTokens = (
	root: SceneNode,
	styles: G.ThemeStyles,
	variables: G.ThemeVariables
) => {
	applyStylesToNode(root, styles.color, ["fillStyleId", "strokeStyleId"]);
	applyStylesToNode(root, styles.shadow, ["effectStyleId"]);
	applyStylesToNode(root, styles.font, ["textStyleId"]);
	applyVariablesToNode(root, variables.number, [
		"bottomRightRadius",
		"bottomLeftRadius",
		"topLeftRadius",
		"topRightRadius",
		"paddingBottom",
		"paddingTop",
		"paddingLeft",
		"paddingRight",
		"height",
		"width",
		"maxHeight",
		"maxWidth",
		"itemSpacing",
		"counterAxisSpacing",
	]);

	if ("children" in root && root.children) {
		root.children.forEach(async (child) => {
			applyTokens(child, styles, variables);
		});
	}
};

/**
 * Convert reshaped config to figma styles / variables
 */

const localStyles: Record<string, any> = {};
const localCollections: Record<string, any> = {};
const localVariables: Record<string, any> = {};

const getOrCreateCollection = (name: string) => {
	return localCollections[name] || figma.variables.createVariableCollection(name);
};

const getOrCreateVariable = (name: string, collection: any, type: string) => {
	console.log({ name });
	// @ts-ignore
	return localVariables[name] || figma.variables.createVariable(name, collection, type);
};

const getOrCreatePaintStyle = (name: string) => {
	const localStyle = localStyles[name];
	console.log({ localStyle, name, localStyles });

	if (localStyle) return localStyle;

	const style = figma.createPaintStyle();
	style.name = name;
};

const getOrCreateEffectStyle = (name: string) => {
	const localStyle = localStyles[name];

	if (localStyle) return localStyle;

	const style = figma.createEffectStyle();
	style.name = name;
};

const getOrCreateTextStyle = (name: string) => {
	const localStyle = localStyles[name];

	if (localStyle) return localStyle;

	const style = figma.createTextStyle();
	style.name = name;
};

const uploadJsonUnitCollection = (theme: any) => {
	const collection = getOrCreateCollection("Unit");
	const modeId = collection.modes[0].modeId;
	let baseUnit: number = 0;
	collection.renameMode(modeId, "Value");

	Object.keys(theme.unit).forEach((key) => {
		const value = theme.unit[key];
		let name = "";

		if (key === "base") {
			baseUnit = value.px;
			return;
		}

		if (key.startsWith("radius")) {
			name = `Radius/${key.replace("radius", "")}`;
		} else {
			name = `Layout/${key}`;
		}

		const variable = getOrCreateVariable(name, collection, "FLOAT");
		variable.setValueForMode(modeId, value.px);
	});

	const fullRadiusVariable = getOrCreateVariable("Radius/Circular", collection, "FLOAT");
	fullRadiusVariable.setValueForMode(modeId, 999);

	const noneRadiusVariable = getOrCreateVariable("Radius/None", collection, "FLOAT");
	noneRadiusVariable.setValueForMode(modeId, 0);

	if (baseUnit) {
		[12, 14, 16, 18, 20].forEach((x) => {
			const noneRadiusVariable = getOrCreateVariable(`Layout/x${x}`, collection, "FLOAT");
			noneRadiusVariable.setValueForMode(modeId, x * baseUnit);
		});
	}

	return { collection, modeId };
};

const uploadJsonColorCollection = (theme: any) => {
	const collection = getOrCreateCollection("Color");
	const lightModeId = collection.modes[0].modeId;
	collection.renameMode(lightModeId, "Light mode");
	const darkModeId = collection.modes[1]?.modeId || collection.addMode("Dark mode");

	Object.keys(theme.color).forEach((key) => {
		const value = theme.color[key];

		if (key.startsWith("rgb")) return;

		const name = formatColorName(key);

		if (!name) return;

		const variable = getOrCreateVariable(name, collection, "COLOR");
		variable.setValueForMode(lightModeId, hexToRgb(value.hex));
		variable.setValueForMode(darkModeId, hexToRgb(value.hexDark || value.hex));
		const style = getOrCreatePaintStyle(name);
		const paint: SolidPaint = {
			type: "SOLID",
			color: { r: 0, b: 0, g: 0 },
		};
		style.paints = [paint];

		const solidPaint = style.paints[0] as SolidPaint;
		const newPaint = figma.variables.setBoundVariableForPaint(solidPaint, "color", variable);

		style.paints = [newPaint];
	});
};

const uploadJsonEffects = (theme: any) => {
	Object.keys(theme.shadow).forEach((key) => {
		const value = theme.shadow[key];

		const style = getOrCreateEffectStyle(key.charAt(0).toUpperCase() + key.slice(1));

		style.effects = value.map((value: any) => ({
			type: "DROP_SHADOW",
			offset: { x: value.offsetX, y: value.offsetY },
			spread: value.spreadRadius,
			radius: value.blurRadius,
			color: { ...hexToRgb(theme.color[value.colorToken].hex), a: value.opacity || 1 },
			visible: true,
			blendMode: "NORMAL",
		}));

		const styleReverse = getOrCreateEffectStyle(
			key.charAt(0).toUpperCase() + key.slice(1) + " reverse"
		);
		styleReverse.effects = value.map((value: any) => ({
			type: "DROP_SHADOW",
			offset: { x: value.offsetX, y: -value.offsetY },
			spread: value.spreadRadius,
			radius: value.blurRadius,
			color: { ...hexToRgb(theme.color[value.colorToken].hex), a: value.opacity || 1 },
			visible: true,
			blendMode: "NORMAL",
		}));
	});
};

export const uploadJsonTypography = (
	theme: any,
	collection: VariableCollection,
	modeId: string
) => {
	Object.keys(theme.font).forEach(async (key) => {
		const value = theme.font[key];
		const name = formatFontName(key);

		const lineHeightVariable = getOrCreateVariable(`Line height/${name}`, collection, "FLOAT");
		lineHeightVariable.setValueForMode(modeId, value.lineHeight.px);

		const family = theme.fontFamily[value.fontFamilyToken].family.split(",")[0];

		if (name.startsWith("Title")) {
			const weight = value.fontWeightToken.charAt(0).toUpperCase() + value.fontWeightToken.slice(1);
			const weightStyle = weight === "Heavy" ? "Black" : weight;

			await figma.loadFontAsync({ family, style: weightStyle });

			const style = getOrCreateTextStyle(name);
			style.fontName = { family, style: weightStyle };
			style.fontSize = value.fontSize.px;
			style.lineHeight = { value: value.lineHeight.px, unit: "PIXELS" };
		} else {
			["Regular", "Medium", "Bold"].forEach(async (weightName) => {
				await figma.loadFontAsync({ family, style: weightName });
				const style = getOrCreateTextStyle(`${name}/${weightName}`);
				style.fontName = { family, style: weightName };
				style.fontSize = value.fontSize.px;
				style.lineHeight = { value: value.lineHeight.px, unit: "PIXELS" };
			});
		}
	});
};

export const uploadJsonTheme = (theme: any) => {
	figma.variables.getLocalVariableCollections().forEach((collection) => {
		localCollections[collection.name] = collection;
		// collection.remove();
	});

	figma.variables.getLocalVariables().forEach((variable) => {
		localVariables[variable.name] = variable;
	});

	figma.getLocalPaintStyles().forEach((style) => {
		localStyles[style.name] = style;
		// style.remove();
	});

	figma.getLocalEffectStyles().forEach((style) => {
		localStyles[style.name] = style;
		// style.remove();
	});

	figma.getLocalTextStyles().forEach((style) => {
		localStyles[style.name] = style;
		// style.remove();
	});

	const { collection, modeId } = uploadJsonUnitCollection(theme);
	uploadJsonColorCollection(theme);
	uploadJsonEffects(theme);
	uploadJsonTypography(theme, collection, modeId);
};
