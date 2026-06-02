// Custom SSR server entry.
// Referenced by vite.config.ts (tanstackStart.server.entry = "server") and built
// by @cloudflare/vite-plugin into the Cloudflare Worker. Re-exports TanStack
// Start's default streaming SSR handler.
export { default } from "@tanstack/react-start/server-entry";
