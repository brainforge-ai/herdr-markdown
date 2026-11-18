import { test } from "node:test";
import assert from "node:assert/strict";
import { resolve, clean, isMarkdown, styleFor } from "../mods/bf-markdown/lib/resolve.js";

const posix = { cwd: "/home/me/repo", home: "/home/me", style: "posix" };
const win = { cwd: "C:\\Users\\me\\repo", home: "C:\\Users\\me", style: "windows" };

test("posix: relative, ./, ../, ~/ and absolute paths", () => {
  assert.equal(resolve("docs/plan.md", posix), "/home/me/repo/docs/plan.md");
  assert.equal(resolve("./plan.md", posix), "/home/me/repo/plan.md");
  assert.equal(resolve("../other/plan.md", posix), "/home/me/other/plan.md");
  assert.equal(resolve("~/notes/plan.md", posix), "/home/me/notes/plan.md");
  assert.equal(resolve("/srv/app/plan.md", posix), "/srv/app/plan.md");
  assert.equal(resolve("a//b/./c.markdown", posix), "/home/me/repo/a/b/c.markdown");
});

test("file links, percent-encoding, line suffixes and anchors are stripped", () => {
  assert.equal(resolve("file:///srv/my%20docs/plan.md", posix), "/srv/my docs/plan.md");
  assert.equal(resolve("file://localhost/srv/plan.md", posix), "/srv/plan.md");
  assert.equal(resolve("docs/plan.md:12", posix), "/home/me/repo/docs/plan.md");
  assert.equal(resolve("docs/plan.md:12:3", posix), "/home/me/repo/docs/plan.md");
  assert.equal(resolve("docs/plan.md#install", posix), "/home/me/repo/docs/plan.md");
  assert.equal(resolve("@docs/plan.mdx", posix), "/home/me/repo/docs/plan.mdx");
});

test("windows: drive paths with either separator, relative paths and ~", () => {
  assert.equal(resolve("C:/a/b.md", win), "C:\\a\\b.md");
  assert.equal(resolve("C:\\a\\b.md", win), "C:\\a\\b.md");
  assert.equal(resolve("docs/plan.md", win), "C:\\Users\\me\\repo\\docs\\plan.md");
  assert.equal(resolve("..\\other/plan.md", win), "C:\\Users\\me\\other\\plan.md");
  assert.equal(resolve("~/notes/plan.md", win), "C:\\Users\\me\\notes\\plan.md");
  assert.equal(resolve("file:///C:/my%20docs/plan.md", win), "C:\\my docs\\plan.md");
  assert.equal(resolve("d:\\x\\plan.md:7", win), "D:\\x\\plan.md");
  assert.equal(resolve("/x/plan.md", win), "C:\\x\\plan.md");
});

test("anything that is not a Markdown file gives null", () => {
  assert.equal(resolve("https://example.com/readme.md", posix), null);
  assert.equal(resolve("src/main.js", posix), null);
  assert.equal(resolve("", posix), null);
  assert.equal(resolve("   ", posix), null);
  assert.equal(resolve("mailto:me@example.com", posix), null);
});

test("climbing above the root stays at the root", () => {
  assert.equal(resolve("../../../../../plan.md", posix), "/plan.md");
  assert.equal(resolve("..\\..\\..\\..\\..\\plan.md", win), "C:\\plan.md");
});

test("a relative path with no folder to resolve it from gives null", () => {
  assert.equal(resolve("docs/plan.md", { ...posix, cwd: null }), null);
  assert.equal(resolve("docs/plan.md", { ...win, cwd: null }), null);
  assert.equal(resolve("/srv/plan.md", { ...posix, cwd: null }), "/srv/plan.md");
  assert.equal(resolve("~/plan.md", { ...posix, cwd: null, home: null }), null);
});

test("clean strips the wrapping and leaves ~ and relative text for the other machine", () => {
  assert.equal(clean("file:///srv/my%20docs/plan.md"), "/srv/my docs/plan.md");
  assert.equal(clean("docs/plan.md:12"), "docs/plan.md");
  assert.equal(clean("~/notes/plan.md#top"), "~/notes/plan.md");
  assert.equal(clean("../plan.md"), "../plan.md");
  assert.equal(clean("https://example.com/plan.md"), null);
  assert.equal(clean(""), null);
});

test("isMarkdown looks at the cleaned path's extension", () => {
  assert.equal(isMarkdown("a/README.MD"), true);
  assert.equal(isMarkdown("a/plan.md:12"), true);
  assert.equal(isMarkdown("a/plan.mdx#x"), true);
  assert.equal(isMarkdown("a/plan.md.bak"), false);
  assert.equal(isMarkdown("https://example.com/plan.md"), false);
});

test("path style: posix for any other machine, else this computer's", () => {
  assert.equal(styleFor("vps", "windows"), "posix");
  assert.equal(styleFor(null, "windows"), "windows");
  assert.equal(styleFor(null, "macos"), "posix");
  assert.equal(styleFor(null, "linux"), "posix");
});
