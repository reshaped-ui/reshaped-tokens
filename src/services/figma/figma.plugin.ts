import { sendPluginMessage } from "utilities/channel.js";
import * as T from "./figma.types.js";

export const notify = (payload: T.PluginActionNotify["payload"]) => {
  sendPluginMessage({
    type: T.PluginActionType.notify,
    payload,
  });
};
