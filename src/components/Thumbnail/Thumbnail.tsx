import * as React from "react";
import { Icon } from "reshaped";
import IconColors from "icons/Colors";
import IconPlus from "icons/Plus";
import * as T from "./Thumbnail.types";
import s from "./Thumbnail.module.css";

const Thumbnail = (props: T.Props) => {
	const { color, large, className } = props;
	const rootClassNames =
		s.root +
		(large ? ` ${s["--large"]}` : "") +
		(color ? ` ${s["--colored"]}` : "") +
		(className ? ` ${className}` : "");

	return (
		<div className={rootClassNames} style={{ "--local-color": color } as React.CSSProperties}>
			<Icon svg={color ? IconColors : IconPlus} size={large && color ? 5 : 4} />
		</div>
	);
};

export default Thumbnail;
