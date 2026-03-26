import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["ldhn-logo-192.png"],
      workbox: {
        navigateFallbackDenylist: [/^\/~oauth/],
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
      },
      manifest: {
        name: "LDHN - Ligue de Dek Hockey Newport",
        short_name: "LDHN Arena",
        description: "Écran aréna de la Ligue de Dek Hockey Newport",
        theme_color: "#0a0c14",
        background_color: "#0a0c14",
        display: "fullscreen",
        orientation: "landscape",
        start_url: "/arena",
        icons: [
          {
            src: "/ldhn-logo-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/ldhn-logo-192.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
  },
}));
