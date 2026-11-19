// Vice City Cover Studio — entry program for the gta6-cover-art-01 bounty.
// Copies app/ and screenshots/ from this repository into the output directory
// and writes /output/dossier.json with buildDossier from vendor/makefun-app.ts.
// Node 22, standard library only. Deterministic: two runs write identical bytes.

import { buildDossier } from "./vendor/makefun-app.ts";
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR || "/output";
const REPO_DIR = process.cwd();

function isDotName(name: string): boolean {
  return name.startsWith(".");
}

function copyTreeSkippingDotfiles(fromDir: string, toDir: string): void {
  const entries = readdirSync(fromDir, { withFileTypes: true }).sort((a, b) =>
    a.name < b.name ? -1 : a.name > b.name ? 1 : 0,
  );
  for (const entry of entries) {
    if (isDotName(entry.name)) continue;
    const from = join(fromDir, entry.name);
    const to = join(toDir, entry.name);
    if (entry.isDirectory()) {
      mkdirSync(to, { recursive: true });
      copyTreeSkippingDotfiles(from, to);
    } else if (entry.isFile()) {
      cpSync(from, to);
    }
  }
}

function copyDirIfPresent(name: string): boolean {
  const from = join(REPO_DIR, name);
  if (!existsSync(from) || !statSync(from).isDirectory()) return false;
  const to = join(OUTPUT_DIR, name);
  mkdirSync(to, { recursive: true });
  copyTreeSkippingDotfiles(from, to);
  return true;
}

function main(): void {
  mkdirSync(OUTPUT_DIR, { recursive: true });
  copyDirIfPresent("app");
  const hasScreenshots = copyDirIfPresent("screenshots");
  const shotDir = join(OUTPUT_DIR, "screenshots");
  const shotCount = hasScreenshots
    ? readdirSync(shotDir).filter((name) => !isDotName(name)).length
    : 0;
  if (shotCount === 0) {
    if (existsSync(shotDir)) rmSync(shotDir, { recursive: true, force: true });
    console.log("No screenshots yet: copied app/ only. Add screenshots/ (3 or 4 PNG or JPEG renders) and run again to write dossier.json.");
    return;
  }
  const dossier = buildDossier(OUTPUT_DIR, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
  });
  writeFileSync(join(OUTPUT_DIR, "dossier.json"), dossier);
  console.log(`Wrote ${join(OUTPUT_DIR, "dossier.json")} (${dossier.length} bytes) with ${shotCount} screenshot(s).`);
}

main();
