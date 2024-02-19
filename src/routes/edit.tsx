import React, { ChangeEvent } from "react";
import { TextField, View, Text, Button, Divider, Badge, Link, useToggle, Modal } from "reshaped";
import type { TextFieldProps } from "reshaped";
import { subscribeToCanvas, receiveCanvasMessage } from "utilities/channel";
import ColorPicker, { ColorPickerProps } from "components/ColorPicker";
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
	const [themeJson, setThemeJson] = React.useState("");
	const [themeName, setThemeName] = React.useState(theme?.name || "");
	const [themeData, setThemeData] = React.useState<G.Theme["data"] | null>(theme?.data || null);
	const nameFieldRef = React.useRef<HTMLInputElement | null>(null);
	const resolvedThemeName = themeName || themeData?.file.name;
	const confirmToggle = useToggle();

	const handleColorChange: ColorPickerProps["onChange"] = ({ value }) => {
		setThumbnailColor(value);
	};

	const handleNameChange: TextFieldProps["onChange"] = ({ value }) => {
		setThemeName(value);
	};

	const handleThemeSync = () => {
		ThemeService.plugin.requestStyles();
	};

	const handleSubmit = () => {
		onSubmit({
			name: themeName,
			thumbnailColor,
			data: themeData,
		});
		onNavigateBack();
	};

	const handleDelete = () => {
		if (!theme) return;

		onDelete(theme.id);
		onNavigateBack();
	};

	const handleUploadConfirm = () => {
		if (!themeJson) return;
		ThemeService.plugin.requestUploadTheme({ theme: JSON.parse(themeJson) });
		confirmToggle.deactivate();
		setThemeJson("");
	};

	const handleJsonUpload = (e: ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files;
		if (!files || files.length <= 0) return;

		const file = files[0];
		const reader = new FileReader();

		reader.onload = (e) => {
			try {
				const res = e.target?.result;

				if (!(typeof res === "string")) return;

				setThemeJson(res);
				confirmToggle.activate();
			} catch (error) {
				console.error("Error reading or parsing JSON file", error);
			}
		};

		reader.readAsText(file);
	};

	React.useEffect(() => {
		nameFieldRef.current?.focus();
	}, []);

	React.useEffect(() => {
		const subscription = subscribeToCanvas((msg) => {
			receiveCanvasMessage(
				msg,
				ThemeService.CanvasActionType.importStyles,
				({ styles, variables, fileName, fileKey }) => {
					setThemeData({ file: { name: fileName, key: fileKey }, styles, variables });
					FigmaService.plugin.notify({ message: "✨ Theme is synced" });
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
				disabled: !resolvedThemeName || !thumbnailColor,
			}}
			secondaryActionSlot={
				!!theme && (
					<View align="end">
						<Button color="critical" variant="outline" onClick={handleDelete}>
							Delete
						</Button>
					</View>
				)
			}
		>
			<View gap={2}>
				<View
					borderColor="neutral-faded"
					backgroundColor="neutral-faded"
					padding={2}
					borderRadius="medium"
				>
					Make sure you have a style library opened and all your styles and variables are published
					before syncing the theme 👀
				</View>
				<ColorPicker value={thumbnailColor} onChange={handleColorChange} />
				<View.Item gapBefore={4}>
					<TextField
						placeholder="Theme name"
						name="name"
						value={resolvedThemeName}
						onChange={handleNameChange}
						inputAttributes={{ ref: nameFieldRef }}
						endSlot={
							<Button size="small" onClick={handleThemeSync}>
								{themeData ? "Re-sync" : "Sync"}
							</Button>
						}
					/>
				</View.Item>
				{!themeData && (
					<Text color="neutral-faded" variant="body-3">
						Want to sync a Reshaped theme from the code?
						<label>
							<Link variant="plain">Upload the theme.json</Link>
							<input type="file" accept=".json" onChange={handleJsonUpload} hidden />
						</label>
					</Text>
				)}
				{themeData && (
					<>
						<Divider />
						<div>Source file: {themeData.file.name}</div>
						{(["styles", "variables"] as const).map((type) => {
							const tokens = themeData[type];

							return Object.entries(tokens).map(([tokenType, tokenGroup]) => {
								const title = `${tokenType} ${type}`;

								return (
									<>
										<Text variant="body-3" color="neutral-faded">
											{title.charAt(0).toUpperCase()}
											{title.slice(1)}
										</Text>
										<View direction="row" gap={1}>
											{Object.keys(tokenGroup).map((tokenName) => (
												<Badge variant="faded">{tokenName}</Badge>
											))}
										</View>
									</>
								);
							});
						})}
					</>
				)}
			</View>
			<Modal active={confirmToggle.active} onClose={confirmToggle.deactivate}>
				<View gap={3}>
					<Text>
						Syncing the theme from the code will create new or override existing styles and
						variables in this file.
					</Text>
					<View gap={2} direction="row">
						<Button color="primary" onClick={handleUploadConfirm}>
							Continue
						</Button>
						<Button onClick={confirmToggle.deactivate}>Cancel</Button>
					</View>
				</View>
			</Modal>
		</Layout>
	);
};

export default EditRoute;
