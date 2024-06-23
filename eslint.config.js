// @ts-check

import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
// import reactHooksPlugin from "eslint-plugin-react-hooks";
import prettierPlugin from "eslint-plugin-prettier/recommended";

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  // {
  //   plugins: {
  //     "react-hooks": reactHooksPlugin,
  //   },
  //   rules: reactHooksPlugin.configs.recommended.rules,
  // },
  prettierPlugin,
  {
    ignores: ["postcss.config.cjs", "dist"],
  },
);
