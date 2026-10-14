import { readFileSync, writeFileSync } from "node:fs";
import { globSync } from "node:fs";

const files = globSync(".open-next/server-functions/default/handler.mjs");

if (files.length === 0) {
  console.error("No handler.mjs found");
  process.exit(1);
}

const file = files[0];
let content = readFileSync(file, "utf-8");

const oldPattern =
  'p.endsWith("prefetch-hints"))return{}}throw new Error(`Unexpected loadManifest(${path2}) call!`)';
const newPattern =
  'p.endsWith("prefetch-hints")||p.endsWith("preview-props"))return{}}throw new Error(`Unexpected loadManifest(${path2}) call!`)';

if (!content.includes(oldPattern)) {
  console.error("Pattern not found in handler.mjs - already patched or different format");
  process.exit(1);
}

content = content.replace(oldPattern, newPattern);
writeFileSync(file, content);
console.log("Patched loadManifest to handle preview-props.json");
