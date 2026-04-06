import path from "node:path";

export function getStorageDir() {
  if (process.env.VERCEL) {
    return path.join("/tmp", "home-pro-leads");
  }

  return path.join(process.cwd(), "data");
}
