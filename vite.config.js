import { defineConfig } from 'vite'
import { crx } from '@crxjs/vite-plugin'
import vue from '@vitejs/plugin-vue'
import zipPack from 'vite-plugin-zip-pack';
import manifest from './src/manifest.js'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import {ElementPlusResolver} from 'unplugin-vue-components/resolvers'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const production = mode === 'production'

  return {
    build: {
      emptyOutDir: true,
      outDir: 'build',
      rollupOptions: {
        output: {
          chunkFileNames: 'assets/chunk-[hash].js',
        },
      },
    },
    plugins: [crx({ manifest }), vue(),zipPack({
        outDir: `package`,
        inDir: 'build',
        // @ts-ignore
        outFileName: `${manifest.short_name ?? manifest.name.replaceAll(" ", "-")}-extension-v${manifest.version}.zip`,
      }),
      AutoImport({
        resolvers: [ElementPlusResolver()],
    }), Components({
        resolvers: [ElementPlusResolver()],
    }),],
  }
})
