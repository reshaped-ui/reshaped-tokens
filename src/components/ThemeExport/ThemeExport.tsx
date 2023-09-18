import React from "react";
import { Button, useToast } from "reshaped";
import IconExport from "icons/Sync";
import type * as G from "types/global";

const ThemeExport = (props: { theme: G.Theme }) => {
	const { theme } = props;
	const toast = useToast();

	const handleClick = () => {
		console.log(theme);
		toast.show({ text: "Theme exported for reshaped.config.js" });
	};

	return <Button size="small" variant="ghost" icon={IconExport} onClick={handleClick} />;
};

export default ThemeExport;
