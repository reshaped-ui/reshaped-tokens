import * as ThemeService from "services/theme";
import * as FigmaService from "services/figma";

export type CanvasAction = ThemeService.CanvasAction;
export type PluginAction = ThemeService.PluginAction | FigmaService.PluginAction;
