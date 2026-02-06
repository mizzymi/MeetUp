import { defineConfig } from "vite";

export default defineConfig({
    build: {
        outDir: ".vite/preload/preload",
        sourcemap: true,
        emptyOutDir: true,
    },
});