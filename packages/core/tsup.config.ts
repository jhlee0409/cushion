import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/core.ts', 'src/absorb.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  minify: true,
  treeshake: true,
  splitting: false,
  sourcemap: true,
  target: 'es2022',
  external: [],
  banner: {
    js: '// Cushion 🛏️ - Absorb the chaos, keep the peace',
  },
});
