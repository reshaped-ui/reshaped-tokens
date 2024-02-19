const InlineChunkHtmlPlugin = require("react-dev-utils/InlineChunkHtmlPlugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");

const path = require("path");
const webpack = require("webpack");

module.exports = (env, argv) => ({
	mode: argv.mode === "production" ? "production" : "development",
	// This is necessary because Figma's 'eval' works differently than normal eval
	devtool: argv.mode === "production" ? false : "inline-source-map",

	entry: {
		ui: "./src/plugin.tsx",
		canvas: "./src/canvas.ts",
	},

	module: {
		rules: [
			{ test: /\.tsx?$/, use: "ts-loader" },
			{
				test: /\.css$/,
				use: ["style-loader", { loader: "css-loader" }, { loader: "postcss-loader" }],
			},
		],
	},

	resolve: { extensions: [".tsx", ".ts", ".jsx", ".js"], modules: ["node_modules", "src"] },

	output: {
		filename: "[name].js",
		path: path.resolve(__dirname, "dist"),
	},

	plugins: [
		new webpack.DefinePlugin({
			global: {}, // Fix missing symbol error when running in developer VM
		}),
		new HtmlWebpackPlugin({
			inject: "body",
			template: "./src/plugin.html",
			filename: "ui.html",
			chunks: ["ui"],
		}),
		new InlineChunkHtmlPlugin(HtmlWebpackPlugin, [/ui/]),
	],

	devServer: {
		devMiddleware: {
			writeToDisk: true,
		},
	},
});
