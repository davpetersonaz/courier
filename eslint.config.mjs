// eslint.config.mjs
import { FlatCompat } from "@eslint/eslintrc";
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
    baseDirectory: __dirname,
});

const eslintConfig = [
    ...compat.extends("next/core-web-vitals", "next/typescript"),
    {
        plugins: {
          'simple-import-sort': simpleImportSort,
        },
        rules: {
            'simple-import-sort/imports': [
                'error',     // auto-sort imports
                {
                    groups: [
                        ['^react', '^next'],  //react and nextJS first
                        ['^@?\\w'],  //third party packages
                        ['^@/'],  //internal aliases
                        ['^\\.\\.(?!/?$)', '^\\.\\./?$'], //parent imports
                        ['^\\./(?=.*/)(?!/?$)', '^\\.(?!/?$)', '^\\./?$'],  //sibling imports
                        ['^.+\\.s?css$']  //style imports last
                    ]
                }
            ],
            'simple-import-sort/exports': 'error'     // auto-sort exports
        },
    },
    {
        ignores: [
            "node_modules/**",
            ".next/**",
            "out/**",
            "build/**",
            "next-env.d.ts",
        ],
    },
];

export default eslintConfig;
