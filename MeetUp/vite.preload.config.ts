import { defineConfig } from "vite";

export default defineConfig({
    build: {
        outDir: ".vite/build/preload",
        sourcemap: true,
        emptyOutDir: true,
    },
});