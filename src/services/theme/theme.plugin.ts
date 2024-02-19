import { sendPluginMessage } from "utilities/channel";
import * as G from "types/global";
import * as T from "./theme.types";

export const createTheme = (payload: Omit<G.Theme, "id">) => {
	const ts = Date.now();
	const id = ts.toString();
	const theme = { ...payload, id };

	sendPluginMessage({
		type: T.PluginActionType.createTheme,
		payload: theme,
	});

	return theme;
};

export const updateTheme = (payload: G.Theme) => {
	sendPluginMessage({
		type: T.PluginActionType.createTheme,
		payload,
	});
};

export const deleteTheme = (payload: Pick<G.Theme, "id">) => {
	sendPluginMessage({
		type: T.PluginActionType.deleteTheme,
		payload,
	});
};

export const requestApplyTheme = (payload: T.PluginActionRequestApplyTheme["payload"]) => {
	sendPluginMessage({
		type: T.PluginActionType.requestApplyTheme,
		payload,
	});
};

export const requestStyles = () => {
	sendPluginMessage({
		type: T.PluginActionType.requestStyles,
		payload: {},
	});
};

export const requestUploadTheme = (payload: T.PluginActionRequestUploadTheme["payload"]) => {
	sendPluginMessage({
		type: T.PluginActionType.requestUploadTheme,
		payload,
	});
};
