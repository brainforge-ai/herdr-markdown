import { test } from "node:test";
import assert from "node:assert/strict";
import { route, takes } from "../mods/bf-markdown/lib/route.js";

const MOD = "bf-markdown";
const terminal = (pane, tab) => ({ pane, tab, terminal: `t${pane}` });
const viewer = (pane, tab, mod = MOD) => ({ pane, tab, terminal: null, mod });

test("a viewer in the same tab is reused", () => {
  const panes = [terminal("p1", "tab1"), viewer("p2", "tab1")];
  assert.deepEqual(route(panes, { pane: "p1", tab: "tab1" }, MOD), { action: "reuse", tab: "tab1" });
});

test("a viewer only in another tab does not count: split beside the source pane", () => {
  const panes = [terminal("p1", "tab1"), terminal("p3", "tab2"), viewer("p4", "tab2")];
  assert.deepEqual(route(panes, { pane: "p1", tab: "tab1" }, MOD), { action: "split", pane: "p1", tab: "tab1" });
});

test("no viewer anywhere: split", () => {
  assert.deepEqual(route([terminal("p1", "tab1")], { pane: "p1", tab: "tab1" }, MOD), { action: "split", pane: "p1", tab: "tab1" });
});

test("another mod's pane in the tab is not a viewer", () => {
  const panes = [terminal("p1", "tab1"), viewer("p2", "tab1", "files")];
  assert.equal(route(panes, { pane: "p1", tab: "tab1" }, MOD).action, "split");
});

test("a source with no pane or tab opens a new tab", () => {
  assert.deepEqual(route([viewer("p2", "tab1")], { pane: null, tab: null }, MOD), { action: "tab" });
  assert.deepEqual(route([], { pane: null, tab: "tab1" }, MOD), { action: "tab" });
});

test("a viewer takes a request only for its own tab, and only once", () => {
  const request = { id: "7", tab: "tab1", file: "/a.md", on: null };
  assert.equal(takes(request, { tab: "tab1", seen: null }), true);
  assert.equal(takes(request, { tab: "tab2", seen: null }), false);
  assert.equal(takes(request, { tab: "tab1", seen: "7" }), false);
  assert.equal(takes(request, { tab: null, seen: null }), false);
  assert.equal(takes(undefined, { tab: "tab1", seen: null }), false);
  assert.equal(takes({ id: "8", tab: "tab1" }, { tab: "tab1", seen: null }), false);
});
