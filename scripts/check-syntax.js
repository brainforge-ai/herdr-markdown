// Parses every .js file under mods/ without running it: `node --check` per file.
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const files = readdirSync("mods", { recursive: true, withFileTypes: true })
  .filter((e) => e.isFile() && e.name.endsWith(".js"))
  .map((e) => join(e.parentPath, e.name));
let failed = 0;
for (const file of files) {
  const r = spawnSync(process.execPath, ["--check", file], { stdio: "inherit" });
  if (r.status !== 0) failed++;
}
console.log(`${files.length - failed}/${files.length} files parse`);
process.exit(failed ? 1 : 0);
