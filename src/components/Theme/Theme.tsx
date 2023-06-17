import React from "react";
import { Card, View, Text, Button, Tooltip } from "reshaped";
import type { ButtonProps, CardProps } from "reshaped";
import Thumbnail from "components/Thumbnail";
import IconEdit from "icons/Edit";
import * as T from "./Theme.types";

const Theme = (props: T.Props) => {
	const { onClick, onEditClick, data, selected } = props;
	const hasTheme = data?.id;

	const renderSubtitle = () => {
		if (!data) return "Light and Dark mode";
		if (data.lightMode && data.darkMode) return "Light and Dark mode";
		if (data.lightMode) return "Light mode only";
		if (data.darkMode) return "Dark mode only";
		return "No modes synced";
	};

	const handleClick: CardProps["onClick"] = (event) => {
		event.stopPropagation();
		onClick?.(data);
	};

	const handleEditClick: ButtonProps["onClick"] = (event) => {
		if (!data) return;
		event.stopPropagation();
		onEditClick?.(data);
	};

	return (
		<Card onClick={handleClick} selected={selected} padding={3}>
			<View direction="row" align="center" gap={2}>
				<Thumbnail color={data?.thumbnailColor} />
				<View.Item grow>
					<Text variant="body-2" weight="medium">
						{hasTheme ? data?.name : "New theme"}
					</Text>
					<Text variant="body-3" color="neutral-faded">
						{renderSubtitle()}
					</Text>
				</View.Item>
				<View direction="row">
					{data && (
						<Tooltip text="Edit theme" position="bottom-end">
							{(attributes) => (
								<Button.Aligner position="end">
									<Button
										attributes={attributes}
										variant="ghost"
										icon={IconEdit}
										onClick={handleEditClick}
									/>
								</Button.Aligner>
							)}
						</Tooltip>
					)}
				</View>
			</View>
		</Card>
	);
};

export default Theme;
