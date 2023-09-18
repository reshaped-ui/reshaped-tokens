import React from "react";
import { Text, View, Actionable } from "reshaped";
import * as T from "./ColorPicker.types";
import s from "./ColorPicker.module.css";

const colors = [
	"#5a58f2",
	"#00adf8",
	"#00d060",
	// "#f7de00",
	"#ff7a00",
	"#ff3d00",
	"#b3b3b3",
	"#232323",
];

const Color = (props: T.ColorProps) => {
	const { color, active, onClick } = props;

	const handleClick = () => {
		onClick(color);
	};

	return (
		<Actionable
			className={[s.color, active && s["--color-active"]]}
			onClick={handleClick}
			attributes={{ style: { "--local-color": color } }}
		/>
	);
};

const ColorPicker = (props: T.Props) => {
	const { onChange, value } = props;

	const handleColorClick = (color: string) => {
		onChange({ value: color });
	};

	return (
		<View gap={2}>
			<Text color="neutral-faded" variant="body-3">
				Thumbnail color
			</Text>
			<View direction="row" gap={2}>
				{colors.map((color) => (
					<View.Item key={color}>
						<Color color={color} active={value === color} onClick={handleColorClick} />
					</View.Item>
				))}
			</View>
		</View>
	);
};

ColorPicker.colors = colors;
export default ColorPicker;
