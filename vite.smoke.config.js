import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// Shared build settings for smoke-test CJS bundles
const shared = {
  plugins: [react()],
  resolve: { extensions: ['.js', '.jsx', '.ts', '.tsx'] },
  build: {
    minify: false,
    sourcemap: false
  }
}

export default defineConfig(({ mode }) => {
  if (mode === 'store') {
    return {
      ...shared,
      build: {
        ...shared.build,
        lib: {
          entry: resolve(__dirname, '.smoke/store-entry.js'),
          formats: ['cjs'],
          fileName: () => 'store.cjs'
        },
        outDir: resolve(__dirname, '.smoke/dist'),
        emptyOutDir: true
      }
    }
  }

  // mode === 'app'
  return {
    ...shared,
    build: {
      ...shared.build,
      lib: {
        entry: resolve(__dirname, '.smoke/entry.jsx'),
        formats: ['cjs'],
        fileName: () => 'app.cjs'
      },
      outDir: resolve(__dirname, '.smoke/dist'),
      emptyOutDir: false, // don't wipe store.cjs
      rollupOptions: {
        external: ['react', 'react-dom', 'react-dom/client', 'react-router-dom']
      }
    }
  }
})
