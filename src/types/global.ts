export type Message<Type, Payload> = Payload extends void
	? {
			type: Type;
	  }
	: {
			type: Type;
			payload: Payload;
	  };

export type Viewport = "s" | "m" | "l" | "xl";

export type BaseVariable<T extends string> = {
	variableName: string;
	variableKey: string;
	type: T;
	id: string;
};
export type VariableNumber = BaseVariable<"number">;

export type BaseToken<T extends string> = {
	styleName: string;
	styleKey: string;
	type: T;
	id: string;
};
export type TokenColor = BaseToken<"color">;
export type TokenFont = BaseToken<"font">;
export type TokenShadow = BaseToken<"shadow">;

export type ThemeStyles = {
	color: Record<string, TokenColor>;
	font: Record<string, TokenFont>;
	shadow: Record<string, TokenShadow>;
};

export type ThemeVariables = {
	number: Record<string, VariableNumber>;
};

export type ThemeData = {
	file: { name: string; key?: string };
	styles: ThemeStyles;
	variables: ThemeVariables;
};

export type Theme = {
	id: string;
	name: string;
	thumbnailColor: string;
	data: ThemeData | null;
};
