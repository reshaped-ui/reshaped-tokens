import React from "react";
import { Actionable, View, Text, Icon } from "reshaped";
import Thumbnail from "components/Thumbnail";
import IconReshaped from "icons/Reshaped";
import * as T from "./EmptyState.types";
import s from "./EmptyState.module.css";

const EmptyState = (props: T.Props) => {
	const { onCreateClick } = props;

	return (
		<>
			<Actionable onClick={onCreateClick}>
				<View align="center">
					<div className={s.thumbnails}>
						<Thumbnail large color="#346DFF" className={s.fan} />
						<Thumbnail large color="#F24E1E" className={s.fan} />
						<Thumbnail large color="#5A58F2" className={s.fan} />
						<Thumbnail large color="#EFA006" className={s.fan} />
						<Thumbnail large />
					</div>
					<View.Item gapBefore={3}>
						<Text variant="body-3" weight="medium">
							New theme
						</Text>
					</View.Item>
					<Text variant="body-3">Reshape your product</Text>
				</View>
			</Actionable>

			<Actionable className={s.logo} href="https://reshaped.so" attributes={{ target: "_blank" }}>
				<View align="center">
					<Icon svg={IconReshaped} size={6} />
					<div className={s.name}>
						<Text color="neutral-faded">Reshaped Design System</Text>
					</div>
				</View>
			</Actionable>
		</>
	);
};

export default EmptyState;
