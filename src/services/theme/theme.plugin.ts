import { sendPluginMessage } from "utilities/channel.js";
import * as T from "./theme.types.js";

export const requestUploadTheme = (payload: T.PluginActionRequestUploadTheme["payload"]) => {
  sendPluginMessage({
    type: T.PluginActionType.requestUploadTheme,
    payload,
  });
};

export const requestExtractTheme = (payload: T.PluginActionRequestExtractTheme["payload"]) => {
  sendPluginMessage({
    type: T.PluginActionType.requestExtractTheme,
    payload,
  });
};
