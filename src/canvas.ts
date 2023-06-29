import * as ThemeService from "services/theme";
import * as FigmaService from "services/figma";
import { subscribeToPlugin, receivePluginMessage } from "utilities/channel";
import { applyTokens } from "utilities/tokens";

figma.showUI(__html__, { height: 420, themeColors: true });

(async () => {
	const themeIds = await ThemeService.canvas.getThemeIds();

	themeIds.forEach(async (themeId) => {
		ThemeService.canvas.loadThemeFromStorage(themeId);
	});

	subscribeToPlugin((msg) => {
		receivePluginMessage(msg, ThemeService.PluginActionType.createTheme, (payload) => {
			ThemeService.canvas.saveThemeToStorage(payload);
		});

		receivePluginMessage(msg, ThemeService.PluginActionType.updateTheme, (payload) => {
			ThemeService.canvas.saveThemeToStorage(payload);
		});

		receivePluginMessage(msg, ThemeService.PluginActionType.deleteTheme, (payload) => {
			ThemeService.canvas.deleteThemeFromStorage(payload);
		});

		receivePluginMessage(msg, ThemeService.PluginActionType.requestStyles, () => {
			ThemeService.canvas.importStyles({
				fileName: figma.root.name,
				fileKey: figma.fileKey,
			});
		});

		receivePluginMessage(
			msg,
			ThemeService.PluginActionType.requestApplyTheme,
			({ styles, variables }) => {
				const selection = figma.currentPage.selection;

				if (!selection.length) {
					figma.notify("Select a layer to apply a theme");
					return;
				}

				selection.forEach(async (selectionNode) => {
					applyTokens(selectionNode, styles, variables);
				});

				figma.notify("🎨 Theme applied");
			}
		);

		receivePluginMessage(msg, FigmaService.PluginActionType.notify, ({ message }) => {
			figma.notify(message);
		});
	});
})();
