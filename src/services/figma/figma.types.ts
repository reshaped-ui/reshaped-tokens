import * as G from "types/global.js";

export enum PluginActionType {
  notify = "notify",
}

export type PluginActionNotify = G.Message<PluginActionType.notify, { message: string }>;
export type PluginAction = PluginActionNotify;
