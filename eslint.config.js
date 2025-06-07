import eslintPlugin from "@eslint/js";
import tseslint from "typescript-eslint";
import parser from "@typescript-eslint/parser";
import tslint from "@typescript-eslint/eslint-plugin";

export default [
  eslintPlugin.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      parser,
      parserOptions: {
        project: "./tsconfig.json",
      },
    },
    plugins: {
      tslint,
    },
    rules: {
      "tslint/no-floating-promises": "error",
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
];
