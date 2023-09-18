import React from "react";
import { View, Button, Text, Actionable } from "reshaped";
import IconChevronLeft from "icons/ChevronLeft";
import * as T from "./Layout.types";
import s from "./Layout.module.css";

const Layout = (props: T.Props) => {
	const {
		title,
		tabs,
		onNavigateBack,
		onClick,
		children,
		action,
		secondaryActionSlot,
		titleActionSlot,
		centered,
	} = props;

	return (
		<View divided height="100%">
			{title && (
				<View padding={2} gap={1} direction="row" align="center">
					{onNavigateBack && (
						<Button variant="ghost" size="small" icon={IconChevronLeft} onClick={onNavigateBack} />
					)}
					<View.Item grow>
						<Text variant="body-3" weight="medium">
							{title}
						</Text>
					</View.Item>
					{titleActionSlot}
				</View>
			)}
			{!!tabs?.length && (
				<View padding={3} direction="row" gap={3}>
					{tabs.map((tab) => (
						<Text
							weight={tab.selected ? "bold" : "medium"}
							variant="body-3"
							color={tab.selected ? undefined : "neutral-faded"}
						>
							<Actionable onClick={tab.onClick}>{tab.text}</Actionable>
						</Text>
					))}
				</View>
			)}
			<View.Item grow className={s.content} attributes={{ onClick }}>
				<View
					padding={3}
					height={centered ? "100%" : undefined}
					align={centered ? "center" : undefined}
					justify={centered ? "center" : undefined}
				>
					{children}
				</View>
			</View.Item>
			{(action || secondaryActionSlot) && (
				<View paddingInline={3} paddingBlock={2} gap={2} direction="row" justify="end">
					{secondaryActionSlot && <View.Item grow>{secondaryActionSlot}</View.Item>}
					{action && (
						<Button color="primary" disabled={action.disabled} onClick={action.onClick}>
							{action.text}
						</Button>
					)}
				</View>
			)}
		</View>
	);
};

export default Layout;
