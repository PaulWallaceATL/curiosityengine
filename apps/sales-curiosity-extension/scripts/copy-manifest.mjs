import { readFile, writeFile, mkdir, copyFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

async function main() {
  const src = resolve("src/manifest.json");
  const dest = resolve("dist/manifest.json");
  await mkdir(dirname(dest), { recursive: true });
  const raw = await readFile(src, "utf8");
  await writeFile(dest, raw);
  // Copy popup.html alongside bundled popup.js
  await copyFile(resolve("src/popup.html"), resolve("dist/popup.html")).catch(() => {});
}

main();


