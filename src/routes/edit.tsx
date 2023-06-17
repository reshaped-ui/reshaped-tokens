import React from "react";
import { TextField, View, Text, Button } from "reshaped";
import type { TextFieldProps } from "reshaped";
import { subscribeToCanvas, receiveCanvasMessage } from "utilities/channel";
import ColorPicker, { ColorPickerProps } from "components/ColorPicker";
import ColorModeSync, { ColorModeSyncProps } from "components/ColorModeSync";
import Layout from "components/Layout";
import * as ThemeService from "services/theme";
import * as FigmaService from "services/figma";
import * as G from "types/global";

export type Props = {
	onNavigateBack: () => void;
	onSubmit: (theme: Omit<G.Theme, "id">) => void;
	onDelete: (themeId: G.Theme["id"]) => void;
	theme?: G.Theme | null;
};

const EditRoute = (props: Props) => {
	const { onNavigateBack, onSubmit, onDelete, theme } = props;
	const [thumbnailColor, setThumbnailColor] = React.useState(
		theme?.thumbnailColor || ColorPicker.colors[0]
	);
	const [themeName, setThemeName] = React.useState(theme?.name || "");
	const [lightMode, setLightMode] = React.useState<G.ColorModeData | null>(
		theme?.lightMode || null
	);
	const [darkMode, setDarkMode] = React.useState<G.ColorModeData | null>(theme?.darkMode || null);
	const nameFieldRef = React.useRef<HTMLInputElement | null>(null);

	const handleColorChange: ColorPickerProps["onChange"] = ({ value }) => {
		setThumbnailColor(value);
	};

	const handleNameChange: TextFieldProps["onChange"] = ({ value }) => {
		setThemeName(value);
	};

	const handleColorModeSync: ColorModeSyncProps["onSync"] = (colorMode) => {
		ThemeService.plugin.requestStyles({ colorMode });
	};

	const handleColorModeClear: ColorModeSyncProps["onClear"] = (colorMode) => {
		if (colorMode === "dark") {
			setDarkMode(null);
			FigmaService.plugin.notify({ message: "🗑️ Dark mode is removed" });
		}

		if (colorMode === "light") {
			setLightMode(null);
			FigmaService.plugin.notify({ message: "🗑️ Light mode is removed" });
		}
	};

	const handleSubmit = () => {
		onSubmit({
			name: themeName,
			thumbnailColor,
			lightMode,
			darkMode,
		});
		onNavigateBack();
	};

	const handleDelete = () => {
		if (!theme) return;

		onDelete(theme.id);
		onNavigateBack();
	};

	React.useEffect(() => {
		nameFieldRef.current?.focus();
	}, []);

	React.useEffect(() => {
		const subscription = subscribeToCanvas((msg) => {
			receiveCanvasMessage(
				msg,
				ThemeService.CanvasActionType.importStyles,
				({ colorMode, styles, fileName, fileKey }) => {
					if (colorMode === "dark") {
						setDarkMode({ file: { name: fileName, key: fileKey }, styles });
						FigmaService.plugin.notify({ message: "🌙 Dark mode is synced" });
					}

					if (colorMode === "light") {
						setLightMode({ file: { name: fileName, key: fileKey }, styles });
						FigmaService.plugin.notify({ message: "🔆 Light mode is synced" });
					}
				}
			);
		});

		return () => {
			subscription.unsubscribe();
		};
	}, []);

	return (
		<Layout
			onNavigateBack={onNavigateBack}
			title={theme ? "Edit theme" : "New theme"}
			action={{
				text: "Save",
				onClick: handleSubmit,
				disabled: !themeName || !thumbnailColor,
			}}
			secondaryActionSlot={
				!!theme && (
					<View align="end">
						<Button size="small" color="critical" variant="outline" onClick={handleDelete}>
							Delete
						</Button>
					</View>
				)
			}
		>
			<View gap={2}>
				<ColorPicker value={thumbnailColor} onChange={handleColorChange} />
				<View.Item gapBefore={4}>
					<TextField
						placeholder="Theme name"
						name="name"
						value={themeName}
						onChange={handleNameChange}
						inputAttributes={{ ref: nameFieldRef }}
					/>
				</View.Item>
				<ColorModeSync
					mode="light"
					onSync={handleColorModeSync}
					onClear={handleColorModeClear}
					syncedFile={lightMode?.file}
				/>
				<ColorModeSync
					mode="dark"
					onSync={handleColorModeSync}
					onClear={handleColorModeClear}
					syncedFile={darkMode?.file}
				/>
				<Text color="neutral-faded" variant="body-2">
					<span role="img" aria-label="Notice">
						☝
					</span>{" "}
					Open a published Figma library with a theme and mode you want to sync
				</Text>
			</View>
		</Layout>
	);
};

export default EditRoute;
