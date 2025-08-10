import { defineConfig } from 'rollup';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  input: 'src/index.ts',
  output: {
    file: 'rollup-dist/bundle.js',
    format: 'esm',
    sourcemap: true,
  },
  external: (id) => {
    // Mark peer dependencies as external
    if (id === 'viem' || id.startsWith('viem/')) {
      return true;
    }
    // Don't externalize anything else
    return false;
  },
  plugins: [
    nodeResolve({
      preferBuiltins: false,
    }),
    typescript({
      tsconfig: './tsconfig.json',
      declaration: false,
      declarationMap: false,
      outDir: undefined,
    }),
    visualizer({
      filename: 'rollup-dist/bundle-analysis.html',
      template: 'treemap',
      title: '@prepaid-gas/constants Bundle Analysis',
      sourcemap: true,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
});
