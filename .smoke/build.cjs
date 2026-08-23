#!/usr/bin/env node
/**
 * Build .smoke/dist/store.cjs and .smoke/dist/app.cjs
 * Usage: node .smoke/build.cjs
 */
const { execSync } = require('child_process')
const { mkdirSync } = require('fs')
const { resolve } = require('path')

const root = resolve(__dirname, '..')
mkdirSync(resolve(__dirname, 'dist'), { recursive: true })

console.log('Building store.cjs …')
execSync('npx vite build --config vite.smoke.config.js --mode store', {
  cwd: root,
  stdio: 'inherit'
})

console.log('Building app.cjs …')
execSync('npx vite build --config vite.smoke.config.js --mode app', {
  cwd: root,
  stdio: 'inherit'
})

console.log('Smoke bundles ready in .smoke/dist/')
