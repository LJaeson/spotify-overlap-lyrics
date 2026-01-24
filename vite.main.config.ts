import { defineConfig } from 'vite';

// https://vitejs.dev/config
export default defineConfig({
  build: {
    rollupOptions: {
      // This tells Vite: "Don't touch better-sqlite3, leave it as a require()"
      external: ['better-sqlite3'],
    },
  },
});