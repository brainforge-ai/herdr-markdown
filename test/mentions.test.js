import { test } from "node:test";
import assert from "node:assert/strict";
import { mentions } from "../mods/bf-markdown/lib/mentions.js";

test("paths are listed newest (lowest on screen) first, each once", () => {
  const text = ["wrote docs/a.md", "see ~/notes/b.markdown and docs/a.md", "done: /srv/c.mdx"].join("\n");
  assert.deepEqual(mentions(text), ["/srv/c.mdx", "docs/a.md", "~/notes/b.markdown"]);
});

test("a path cut in two by a wrapped line is also tried joined", () => {
  const text = "Plan is at knowledge/plans/2026-11-18-\n  viewer-plan.md now";
  assert.ok(mentions(text).includes("knowledge/plans/2026-11-18-viewer-plan.md"));
});

test("web links are ignored, file links and @ are unwrapped", () => {
  const text = "https://example.com/readme.md file:///srv/my%20docs/x.md @docs/y.md";
  assert.deepEqual(mentions(text).sort(), ["/srv/my docs/x.md", "docs/y.md"]);
});

test("marks an agent puts around a path are not part of it", () => {
  assert.deepEqual(mentions("● Update(`docs/a.md`) │ (docs/b.md), \"docs/c.md\""), ["docs/c.md", "docs/b.md", "docs/a.md"]);
});

test("text with no Markdown path gives nothing", () => {
  assert.deepEqual(mentions("npm test\nok 12 tests"), []);
});
