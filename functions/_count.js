// Counts update checks without identifying anyone: one Analytics Engine data point per
// request with the feed, the app name and its version from the User-Agent. No IP, no ID.
// Counting never blocks or breaks the response: the static file is served either way.

// "Portent/0.2.1 Sparkle/2.7.1" (appcast) or "Portent/42 CFNetwork/1568 Darwin/25.5.0"
// (models.json, URLSession sends the build number).
export function client(userAgent) {
  const m = /^([A-Za-z][\w .-]{0,40})\/([\w.-]{1,20})/.exec(userAgent || "");
  if (!m || m[1].toLowerCase() !== "portent") return { app: "other", version: "" };
  return { app: "portent", version: m[2] };
}

export function counted(feed) {
  return async ({ request, env }) => {
    const response = await env.ASSETS.fetch(request);
    try {
      const { app, version } = client(request.headers.get("User-Agent"));
      env.CHECKS?.writeDataPoint({ indexes: [feed], blobs: [feed, app, version], doubles: [1] });
    } catch (_) {}
    return response;
  };
}
