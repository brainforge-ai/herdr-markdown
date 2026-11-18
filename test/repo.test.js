// The fork's own shape: its name, its licence notices, and nothing left of the macOS router.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const MOD = "mods/bf-markdown";
const sources = () => readdirSync(MOD, { recursive: true, withFileTypes: true })
  .filter((e) => e.isFile() && /\.(js|json|sh|ps1)$/.test(e.name))
  .map((e) => join(e.parentPath, e.name));

test("the stub stands in for the herdr module", async () => {
  const herdr = await import("herdr");
  assert.equal(typeof herdr.run, "function");
});

test("no file still uses the upstream mod's name or its router", () => {
  for (const file of [...sources(), "keys.json"]) {
    const text = readFileSync(file, "utf8");
    assert.doesNotMatch(text, /markdown-viewer|Markdown Router/, file);
  }
  assert.equal(existsSync(join(MOD, "router")), false);
  assert.equal(existsSync(join(MOD, "open.sh")), false);
});

test("the licence keeps both original notices under Brainforge's", () => {
  const text = readFileSync("LICENSE", "utf8");
  for (const owner of ["Brainforge", "Juan Greco", "Jankees van Woezik"]) assert.match(text, new RegExp(`Copyright \\(c\\) 2026 ${owner}`));
});

test("mod.json and keys.json parse, and the picker key opens this mod", () => {
  JSON.parse(readFileSync(join(MOD, "mod.json"), "utf8"));
  const keys = JSON.parse(readFileSync("keys.json", "utf8"));
  assert.ok(Object.values(keys.global).every((command) => command === "mod.open:bf-markdown"));
});

test("the link rule covers Markdown paths, with or without a line number, and nothing else", () => {
  const { link_handlers: rules } = JSON.parse(readFileSync(join(MOD, "mod.json"), "utf8"));
  assert.equal(rules.length, 1);
  assert.equal(rules[0].kind, "file");
  // Herdr reads the pattern as a Rust regex; "(?i)" there is JavaScript's "i" flag.
  assert.ok(rules[0].pattern.startsWith("(?i)"));
  const rule = new RegExp(rules[0].pattern.slice(4), "i");
  for (const path of ["/a/plan.md", "/a/README.MD", "/a/x.markdown", "/a/x.mdx", "/a/plan.md:12", "/a/plan.md:12:3", "C:/a/plan.md"]) assert.match(path, rule);
  for (const path of ["/a/main.js", "/a/plan.md.bak", "/a/plan.mdown", "/a/md"]) assert.doesNotMatch(path, rule);
});
