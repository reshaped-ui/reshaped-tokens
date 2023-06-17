import * as React from "react";
import { createRoot } from "react-dom/client";
import { Reshaped, useTheme } from "reshaped";
import { subscribeToCanvas, receiveCanvasMessage } from "utilities/channel";
import ThemesRoute from "routes/themes";
import EditRoute from "routes/edit";
import * as ThemeService from "services/theme";
import * as G from "types/global";
import "themes/figma/theme.css";

const App = () => {
	const { setColorMode } = useTheme();
	const [route, setRoute] = React.useState<"themes" | "edit">("themes");
	const [themes, setThemes] = React.useState<Record<string, G.Theme>>({});
	const [editTheme, setEditTheme] = React.useState<G.Theme | null>(null);

	const handleNavigateEdit = React.useCallback(() => {
		setRoute("edit");
	}, []);

	const handleThemeEditClick = (theme: G.Theme) => {
		setEditTheme(theme);
		setRoute("edit");
	};

	const handleNavigateBack = () => {
		setRoute("themes");
		setEditTheme(null);
	};

	const handleThemeSubmit = (data: Omit<G.Theme, "id">) => {
		let theme: G.Theme;

		if (editTheme) {
			theme = { id: editTheme.id, ...data };
			ThemeService.plugin.updateTheme(theme);
		} else {
			theme = ThemeService.plugin.createTheme(data);
		}

		setThemes((prev) => ({ ...prev, [theme.id]: theme }));
	};

	const handleThemeDelete = (id: string) => {
		setThemes((prev) => {
			const nextThemes = { ...prev };
			delete nextThemes[id];
			return nextThemes;
		});
		ThemeService.plugin.deleteTheme({ id });
	};

	React.useLayoutEffect(() => {
		if (document.documentElement.classList.contains("figma-dark")) {
			setColorMode("dark");
		}
	}, [setColorMode]);

	React.useEffect(() => {
		const subscription = subscribeToCanvas((msg) => {
			receiveCanvasMessage(msg, ThemeService.CanvasActionType.loadTheme, (payload) => {
				setThemes((prev) => ({ ...prev, [payload.id]: payload }));
			});
		});

		return () => {
			subscription.unsubscribe();
		};
	}, []);

	return (
		<>
			{route === "themes" && (
				<ThemesRoute
					themes={themes}
					onCreateClick={handleNavigateEdit}
					onThemeEditClick={handleThemeEditClick}
				/>
			)}
			{route === "edit" && (
				<EditRoute
					onNavigateBack={handleNavigateBack}
					onSubmit={handleThemeSubmit}
					onDelete={handleThemeDelete}
					theme={editTheme}
				/>
			)}
		</>
	);
};

const container = document.getElementById("root")!;
const root = createRoot(container);
root.render(
	<Reshaped theme="figma">
		<App />
	</Reshaped>
);
