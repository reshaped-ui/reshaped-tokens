import * as G from "types/global";

export type Props = {
	mode: G.ColorMode;
	syncedFile?: G.ColorModeData["file"];
	onSync: (colorMode: G.ColorMode) => void;
	onClear: (colorMode: G.ColorMode) => void;
};
