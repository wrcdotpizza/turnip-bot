module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    parserOptions: {
        tsconfigRootDir: __dirname,
        project: ['./tsconfig.json']
    },
    plugins: [
        '@typescript-eslint',
    ],
    extends: [
        'plugin:@typescript-eslint/recommended',
        'plugin:@typescript-eslint/recommended-requiring-type-checking',
        "prettier/@typescript-eslint",
        "plugin:prettier/recommended"
    ],
    rules: {
        "@typescript-eslint/no-non-null-assertion": 0,
        "@typescript-eslint/no-unused-vars": ["error", { "vars": "all", "args": "after-used", "ignoreRestSiblings": false, "argsIgnorePattern": "^_" }],
        "@typescript-eslint/unbound-method": 0
    }
};