import * as ThemeService from "services/theme/index.js";
import * as FigmaService from "services/figma/index.js";

export type CanvasAction = ThemeService.CanvasAction;
export type PluginAction = ThemeService.PluginAction | FigmaService.PluginAction;
