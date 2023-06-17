export type Message<Type, Payload> = Payload extends void
	? {
			type: Type;
	  }
	: {
			type: Type;
			payload: Payload;
	  };

export type ColorMode = "light" | "dark";
export type Viewport = "s" | "m" | "l" | "xl";

export type BaseToken<T extends string> = { styleName: string; styleKey: string; type: T };
export type TokenColor = BaseToken<"color">;
export type TokenFont = BaseToken<"font">;
export type TokenShadow = BaseToken<"shadow">;

export type ThemeStyles = {
	color: Record<string, TokenColor>;
	font: Record<string, TokenFont>;
	shadow: Record<string, TokenShadow>;
};

export type ColorModeData = { file: { name: string; key?: string }; styles: ThemeStyles };

export type Theme = {
	id: string;
	name: string;
	thumbnailColor: string;
	lightMode?: ColorModeData | null;
	darkMode?: ColorModeData | null;
};
