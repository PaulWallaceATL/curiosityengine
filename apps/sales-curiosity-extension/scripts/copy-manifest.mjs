import { readFile, writeFile, mkdir, copyFile, cp } from "node:fs/promises";
import { dirname, resolve } from "node:path";

async function main() {
  const src = resolve("src/manifest.json");
  const dest = resolve("dist/manifest.json");
  await mkdir(dirname(dest), { recursive: true });
  const raw = await readFile(src, "utf8");
  await writeFile(dest, raw);
  // Copy popup.html alongside bundled popup.js
  await copyFile(resolve("src/popup.html"), resolve("dist/popup.html")).catch(() => {});
  // Copy icons folder if it exists
  await cp(resolve("src/icons"), resolve("dist/icons"), { recursive: true }).catch(() => {
    console.log("⚠️  Warning: No icons folder found. Create src/icons/ with icon16.png, icon48.png, and icon128.png");
  });
}

main();


