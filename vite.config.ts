import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { nodePolyfills } from "vite-plugin-node-polyfills";

export default defineConfig(({ command }) => ({
  plugins: [
    tailwindcss(),
    reactRouter(),
    tsconfigPaths(),
    nodePolyfills({
      include: ["buffer"],
      globals: {
        Buffer: true,
      },
    }),
  ],
  ssr: {
    noExternal: command === "build" ? true : (["monaco-editor"] as const),
  },
  server: {
    headers: {
      "Cross-Origin-Embedder-Policy": "require-corp",
      "Cross-Origin-Opener-Policy": "same-origin",
    },
    // proxy: {},
    // https: {
    // openssl req -newkey rsa:2048 -nodes -keyout localhost-key.pem -x509 -days 365 -out localhost-cert.pem
    //     key: fs.readFileSync(path.resolve(__dirname, "localhost-key.pem")),
    //     cert: fs.readFileSync(path.resolve(__dirname, "localhost-cert.pem"))
    // },
  },
}));
