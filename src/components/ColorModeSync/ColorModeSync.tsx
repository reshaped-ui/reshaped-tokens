import React from "react";
import { Card, View, Icon, Text, Button, Link } from "reshaped";
import IconSun from "icons/Sun";
import IconMoon from "icons/Moon";
import IconTrash from "icons/Trash";
import * as T from "./ColorModeSync.types";

const ColorModeSync = (props: T.Props) => {
	const { mode, onSync, onClear, syncedFile } = props;
	const fileName = syncedFile?.name || "Not synced yet";

	const handleSync = () => {
		onSync(mode);
	};

	const handleClear = () => {
		onClear(mode);
	};

	return (
		<Card padding={3}>
			<View direction="row" align="center" gap={3}>
				<Icon svg={mode === "light" ? IconSun : IconMoon} size={4} />
				<View.Item grow>
					<Text variant="body-2" weight="medium">
						{mode === "light" ? "Light mode" : "Dark mode"}
					</Text>
					<Text variant="body-3" maxLines={2}>
						{syncedFile?.key ? (
							<Link href={`https://www.figma.com/file/${syncedFile?.key}`}>{fileName}</Link>
						) : (
							fileName
						)}
					</Text>
				</View.Item>
				<View direction="row" align="center" gap={2}>
					{syncedFile && (
						<Button
							color="critical"
							variant="ghost"
							onClick={handleClear}
							icon={IconTrash}
							attributes={{ "aria-label": "Remove" }}
						/>
					)}
					<Button.Aligner position="end">
						<Button color="primary" variant="ghost" size="small" onClick={handleSync}>
							{syncedFile ? "Re-sync" : "Sync"}
						</Button>
					</Button.Aligner>
				</View>
			</View>
		</Card>
	);
};

export default ColorModeSync;
