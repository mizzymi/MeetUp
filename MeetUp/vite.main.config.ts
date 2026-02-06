import { defineConfig } from "vite";

export default defineConfig({
    build: {
        outDir: ".vite/build/main",
        sourcemap: true,
        emptyOutDir: true,
    },
});