import js from "@eslint/js";
import globals from "globals";
import prettierConfig from "eslint-config-prettier";

export default [
  {
    ignores: [".prettierrc.json", ".prettierignore"],
  },
  js.configs.recommended,
  prettierConfig,
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.node,
      },
    },
    rules: {
      "no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", destructuredArrayIgnorePattern: "^_" },
      ],
      "no-undef": "error",
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "prefer-const": "error",
      "no-var": "error",
      "object-shorthand": ["error", "always"],
      eqeqeq: ["error", "always", { null: "ignore" }],
      curly: ["error", "all"],
      "no-shadow": "error",
      "no-use-before-define": ["error", { functions: false, classes: true, variables: true }],
      "no-return-await": "error",
      "consistent-return": "error",
      "import/no-duplicates": "off",
      camelcase: ["warn", { properties: "never", ignoreDestructuring: true }],
      "prefer-template": "warn",
      "no-path-concat": "error",
      "no-throw-literal": "error",
      "no-useless-constructor": "error",
      "require-await": "warn",
      "no-else-return": ["warn", { allowElseIf: false }],
    },
  },
];
