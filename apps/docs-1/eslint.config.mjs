import baseConfig from '@prepaid-gas/eslint-config'

export default [
  ...baseConfig,
  {
    files: ['**/*.{ts,tsx,js,jsx,mdx}'],
    rules: {
      // Allow console.log in documentation examples
      'no-console': 'off',
      // Allow unused variables in code examples
      '@typescript-eslint/no-unused-vars': 'off',
      // Allow any type in examples for clarity
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    files: ['**/*.mdx'],
    rules: {
      // Disable all rules for MDX content blocks
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
    },
  },
  {
    ignores: ['dist/', 'node_modules/', '.next/'],
  },
]