import { CanvasAction, PluginAction } from "services";

export const sendCanvasMessage = (action: CanvasAction) => {
	const message = JSON.stringify(action);
	figma.ui.postMessage(message);
};

export const sendPluginMessage = (action: PluginAction) => {
	window.parent.postMessage({ pluginMessage: action }, "*");
};

export const receiveCanvasMessage = <
	Type extends CanvasAction["type"],
	Action extends CanvasAction = Extract<CanvasAction, { type: Type }>
>(
	msg: CanvasAction,
	type: Type,
	callback: (payload: Action["payload"]) => void
) => {
	if (msg.type === type) callback(msg.payload);
};

export const receivePluginMessage = <
	Type extends PluginAction["type"],
	Action extends PluginAction = Extract<PluginAction, { type: Type }>
>(
	msg: PluginAction,
	type: Type,
	callback: (payload: Action["payload"]) => void
) => {
	if (msg.type === type) callback(msg.payload);
};

export const subscribeToPlugin = (callback: (message: PluginAction) => void) => {
	figma.ui.onmessage = (message) => callback(message);
};

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
