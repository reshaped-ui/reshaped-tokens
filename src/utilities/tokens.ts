import * as G from "types/global";

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

	const asyncQueue = styles.map(async (style) => {
		const status = await style.getPublishStatusAsync();

		if (status === "UNPUBLISHED") return;
		result[style.name] = { styleName: style.name, type, styleKey: style.key, id: style.id };
	});

	await Promise.all(asyncQueue);
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
		const variableId = node.boundVariables[variableProperty].id;
		const variable = figma.variables.getVariableById(variableId);
		const nextKey = variable && variables[variable.name]?.variableKey;

		if (nextKey) {
			const nextVariable = await importVariableByKey(nextKey);
			const nextId = nextVariable.id;
			node.setBoundVariable(variableProperty, nextId);
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
