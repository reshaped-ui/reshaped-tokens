import React from "react";
import { Card, View, Text, Button } from "reshaped";
import type { ButtonProps, CardProps } from "reshaped";
import Thumbnail from "components/Thumbnail";
import IconEdit from "icons/Edit";
import * as T from "./Theme.types";

const Theme = (props: T.Props) => {
	const { onClick, onEditClick, data, selected } = props;

	const renderSubtitle = () => {
		if (data?.data) return "Light and dark mode";
		return "Not synced yet";
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
					<Text variant="body-3" weight="medium">
						{data?.name || data?.data?.file.name || "New theme"}
					</Text>
					<Text variant="body-3" color="neutral-faded">
						{renderSubtitle()}
					</Text>
				</View.Item>
				<View.Item>
					{data && (
						<Button.Aligner position="end">
							<Button
								variant="ghost"
								icon={IconEdit}
								onClick={handleEditClick}
								attributes={{ "aria-label": "Edit theme" }}
							/>
						</Button.Aligner>
					)}
				</View.Item>
			</View>
		</Card>
	);
};

export default Theme;
