import { CanvasAction, PluginAction } from "services/index.js";

/**
 * Send message from canvas to plugin
 */
export const sendCanvasMessage = (action: CanvasAction) => {
  const message = JSON.stringify(action);
  figma.ui.postMessage(message);
};

/**
 * Send message from plugin to canvas
 */
export const sendPluginMessage = (action: PluginAction) => {
  window.parent.postMessage({ pluginMessage: action }, "*");
};

/**
 * Receive and handle message from canvas in plugin
 */
export const receiveCanvasMessage = <
  Type extends CanvasAction["type"],
  Action extends CanvasAction = Extract<CanvasAction, { type: Type }>,
>(
  msg: CanvasAction,
  type: Type,
  callback: (payload: Action["payload"]) => void,
) => {
  if (msg.type === type) callback(msg.payload);
};

/**
 * Receive and handle message from plugin in canvas
 */
export const receivePluginMessage = <
  Type extends PluginAction["type"],
  Action extends PluginAction = Extract<PluginAction, { type: Type }>,
>(
  msg: PluginAction,
  type: Type,
  callback: (payload: Action["payload"]) => void,
) => {
  if (msg.type === type) callback(msg.payload);
};

/**
 * Subscribe to all messages sent from plugin
 */
export const subscribeToPlugin = (callback: (message: PluginAction) => void) => {
  figma.ui.onmessage = (message) => callback(message);
};

/**
 * Subscribe to all messages sent from canvas
 */
export const subscribeToCanvas = (callback: (message: CanvasAction) => void) => {
  const handleMessage = (event: MessageEvent) => {
    const message = JSON.parse(event.data.pluginMessage);
    callback(message);
  };

  window.addEventListener("message", handleMessage);

  const unsubscribe = () => {
    window.removeEventListener("message", handleMessage);
  };

  return { unsubscribe };
};
