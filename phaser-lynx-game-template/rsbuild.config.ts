import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [pluginReact()],
  server: {
    port: 1337,
    publicDir: [
      {
        name: path.join(
          __dirname,
          '../',
          // Please replace this with your actual Lynx project name
          'phaser-lynx-game-template',
          'dist',
        ),
      },
    ],
  },
});
