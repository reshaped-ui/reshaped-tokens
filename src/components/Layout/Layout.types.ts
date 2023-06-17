import React from "react";
import { ButtonProps } from "reshaped";

export type Props = {
	title?: string;
	onNavigateBack?: () => void;
	onClick?: () => void;
	tabs?: Array<{ text: string; onClick: () => void; selected?: boolean }>;
	children: React.ReactNode;
	centered?: boolean;
	action?: Pick<ButtonProps, "disabled" | "onClick"> & {
		text: string;
	};
	secondaryActionSlot?: React.ReactNode;
};
