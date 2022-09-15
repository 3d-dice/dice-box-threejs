import { resolve } from "path"
import { defineConfig } from 'vite'
// vite.config.js

const root = resolve(__dirname, 'src')
const outDir = resolve(__dirname, 'dist')

export default defineConfig({
  root,
  build: {
    outDir,
    emptyOutDir: true,
  }
})