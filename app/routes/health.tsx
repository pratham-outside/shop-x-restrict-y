import type { LoaderFunction } from "react-router";

// Unauthenticated endpoint for Render's health check / uptime monitoring.
export const loader: LoaderFunction = async () => {
  return new Response("ok", {
    status: 200,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "text/plain",
    },
  });
};
