const { late } = require("zod/v3");

module.exports = {
    root: true,
    env: {
        browser: true,
        es2023: true,
        node: true
    },
    parser: "@typescript-eslint/parser",
    parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module"
    },
    plugins: [
        "@typescript-eslint",
        "react-hooks",
        "react"
    ],
    extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:react-hooks/recommended",
        "plugin:react/recommended",
        "prettier",
    ],
    settings: {
        react: {
            version: "detect"
        }
    },
    rules: {
        "react/react-in-jsx-scope": "off",
        "typescript-eslint/no-explicit-any": "off"
    }
};