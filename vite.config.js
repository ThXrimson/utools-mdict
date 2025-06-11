import { defineConfig } from 'vite';
import { resolve } from 'path';
import vue from '@vitejs/plugin-vue';

const root = process.cwd();
const pathResolve = (path) => resolve(root, path);

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: [
      /** 设置 `@` 指向 `src` 目录 */
      { find: '@', replacement: pathResolve('src') },
    ],
  },
  plugins: [vue()],
  base: './',
});
