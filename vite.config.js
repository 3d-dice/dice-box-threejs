import { resolve } from "path"
import { defineConfig } from 'vite'
// vite.config.js

const root = resolve(__dirname, 'src')
const outDir = resolve(__dirname, 'dist')

export default defineConfig({
  root,
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.js'),
      name: 'dice-box-threejs',
      fileName: (format) => `dice-box-threejs.${format}.js`
    },
    outDir,
    emptyOutDir: true,
  }
})