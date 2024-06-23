import { baseThemeDefinition } from "reshaped/themes";

export type Message<Type, Payload> = Payload extends void
  ? {
      type: Type;
    }
  : {
      type: Type;
      payload: Payload;
    };

export type Theme = typeof baseThemeDefinition;
