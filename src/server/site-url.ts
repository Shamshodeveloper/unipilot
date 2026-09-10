import "server-only";

import { z } from "zod";

export function getSiteUrl() {
  const site = z.url().parse(process.env.SITE_URL);
  const url = new URL(site);
  const local = ["localhost", "127.0.0.1"].includes(url.hostname);
  if (url.username || url.password || (url.protocol !== "https:" && !(local && url.protocol === "http:"))) {
    throw new Error("SITE_URL must be an HTTPS origin or a local HTTP origin.");
  }
  return url.origin;
}
