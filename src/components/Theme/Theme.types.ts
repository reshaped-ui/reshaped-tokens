import * as G from "types/global";

export type Props = {
	data?: G.Theme;
	selected?: boolean;
	onClick?: (theme?: G.Theme) => void;
	onEditClick?: (theme: G.Theme) => void;
};
