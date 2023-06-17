import { sendPluginMessage } from "utilities/channel";
import * as T from "./figma.types";

export const notify = (payload: T.PluginActionNotify["payload"]) => {
	sendPluginMessage({
		type: T.PluginActionType.notify,
		payload,
	});
};
