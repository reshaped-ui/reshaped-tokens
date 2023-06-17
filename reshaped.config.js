// @ts-check
/** @type {import('reshaped').ReshapedConfig} */
const config = {
	themeOptions: {
		generateOnColorsFor: ["backgroundUpgrade"],
	},
	themes: {
		figma: {
			color: {
				backgroundPrimary: { hex: "#3F8AE1" },
				backgroundPrimaryFaded: { hex: "#A4D8FC" },
				backgroundPrimaryHighlighted: { hex: "#4f94e3" },
				borderPrimary: { hex: "#18A0FB" },
				borderPrimaryFaded: { hex: "#A4D8FC" },
				foregroundPrimary: { hex: "#008DEB" },
				backgroundUpgrade: { hex: "#3F8AE1" },
			},
			font: {
				body2: {
					fontSize: { px: 12 },
					lineHeight: { px: 16 },
				},
				body3: {
					fontSize: { px: 11 },
					lineHeight: { px: 16 },
				},
			},
		},
	},
};

module.exports = config;
