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

const getTokens = async <Type extends "color" | "shadow" | "font">(
	type: Type,
	styles: BaseStyle[]
) => {
	const result: Record<string, G.BaseToken<Type>> = {};

	const asyncQueue = styles.map(async (style) => {
		const status = await style.getPublishStatusAsync();

		if (status === "UNPUBLISHED") return;
		result[style.name] = { styleName: style.name, type, styleKey: style.key };
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

/**
 * Recursively apply tokens to all nodes within root
 */
export const applyTokens = (root: SceneNode, styles: G.ThemeStyles) => {
	applyStylesToNode(root, styles.color, ["fillStyleId", "strokeStyleId"]);
	applyStylesToNode(root, styles.shadow, ["effectStyleId"]);
	applyStylesToNode(root, styles.font, ["textStyleId"]);

	if ("children" in root && root.children) {
		root.children.forEach(async (child) => {
			applyTokens(child, styles);
		});
	}
};

// const tokens: Record<string, TokenFont> = {};
// styles.forEach((style) => {
// 	const { name } = style;
// 	const nameChunks = name.split("/").map((chunk) => chunk.trim());
// 	// Parse S: <660px syntax to extract the viewport name later
// 	const isResponsive = nameChunks[0].match(/^(S|M|L|XL):.*px$/);
// 	let tokenViewport;

// 	if (isResponsive) {
// 		const responsiveChunks = nameChunks[0].split(":");
// 		tokenViewport = responsiveChunks[0].trim().toLowerCase() as Viewport;
// 	}

// 	const tokenNameChunks = isResponsive ? nameChunks.slice(1) : nameChunks;
// 	const tokenName = tokenNameChunks.join("/");

// 	const formattedName = formatTokenName(tokenName);
// 	const tokenData = { id: style.id, key: style.key, type: "font" } as const;
// 	let currentToken = tokens[formattedName] || {};

// 	if (!currentToken.name) currentToken.name = formattedName;

// 	if (tokenViewport) {
// 		if (!currentToken.responsive) currentToken.responsive = {};
// 		currentToken.responsive[tokenViewport] = tokenData;
// 	} else {
// 		currentToken = { ...currentToken, ...tokenData };
// 	}

// 	tokens[formattedName] = currentToken;
// });

// return tokens;
