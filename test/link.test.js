// The link handler, loaded for real with the stub standing in for the app.
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { state, calls, reset } from "herdr";
import { handleLink } from "../mods/bf-markdown/link.js";
import { OPEN_KEY } from "../mods/bf-markdown/lib/open.js";

const source = (over = {}) => ({ terminal: "t1", machine: null, cwd: "/home/me/repo", pane: "p1", tab: "tab1", space: "s1", ...over });
const click = (raw, over = {}) => ({ link: { kind: "file", raw, path: null }, source: source(over) });
const of = (fn) => calls.filter((c) => c.fn === fn);

beforeEach(() => reset({
  panes: [{ pane: "p1", tab: "tab1", terminal: "t1" }],
  files: { ":/home/me/repo/docs/plan.md": "# Plan", ":/home/me/repo/docs/next.md": "# Next" },
}));

test("no viewer in the tab: splits to the right of the clicked pane", async () => {
  assert.equal(await handleLink(click("docs/plan.md")), "handled");
  assert.deepEqual(of("run"), [{ fn: "run", name: "pane.split", args: {
    direction: "right", pane: "p1", mod: "bf-markdown", props: { file: "/home/me/repo/docs/plan.md", tab: "tab1" },
  } }]);
  assert.equal(of("setShared").length, 0);
  assert.equal(of("notify").length, 0);
});

test("a viewer in the tab: hands it the file and opens nothing", async () => {
  state.panes.push({ pane: "p2", tab: "tab1", terminal: null, mod: "bf-markdown" });
  assert.equal(await handleLink(click("docs/next.md:14")), "handled");
  assert.equal(of("run").length, 0);
  const [set] = of("setShared");
  assert.equal(set.key, OPEN_KEY);
  assert.deepEqual({ ...set.value, id: null }, { id: null, tab: "tab1", file: "/home/me/repo/docs/next.md", on: null });
  assert.ok(set.value.id);
});

test("two hand-offs get different ids, so the second is not taken for the first", async () => {
  state.panes.push({ pane: "p2", tab: "tab1", terminal: null, mod: "bf-markdown" });
  await handleLink(click("docs/plan.md"));
  await handleLink(click("docs/plan.md"));
  const [a, b] = of("setShared");
  assert.notEqual(a.value.id, b.value.id);
});

test("a viewer in another tab only: still a split in the clicked tab", async () => {
  state.panes.push({ pane: "p9", tab: "tab2", terminal: null, mod: "bf-markdown" });
  await handleLink(click("docs/plan.md"));
  assert.equal(of("run")[0].name, "pane.split");
  assert.equal(of("setShared").length, 0);
});

test("a file that isn't there: one notice, nothing opened, and the click stops here", async () => {
  assert.equal(await handleLink(click("docs/missing.md")), "handled");
  assert.equal(of("notify").length, 1);
  assert.match(of("notify")[0].body, /docs\/missing\.md/);
  assert.equal(of("run").length, 0);
  assert.equal(of("setShared").length, 0);
});

test("a relative path from a terminal with no known folder: a notice, not a guess", async () => {
  assert.equal(await handleLink(click("docs/plan.md", { cwd: null })), "handled");
  assert.equal(of("notify").length, 1);
  assert.equal(of("run").length, 0);
});

test("not a Markdown file, or not a file link: passed on", async () => {
  assert.equal(await handleLink(click("src/main.js")), "pass");
  assert.equal(await handleLink({ link: { kind: "url", raw: "https://example.com/a.md", url: "https://example.com/a.md" }, source: source() }), "pass");
  assert.equal(calls.length, 0);
});

test("Herdr's own resolved path is not needed, and not trusted over the terminal's folder", async () => {
  const c = click("docs/plan.md");
  c.link.path = "/somewhere/else/docs/plan.md";
  await handleLink(c);
  assert.equal(of("run")[0].args.props.file, "/home/me/repo/docs/plan.md");
});

test("a file link with an absolute path opens as written", async () => {
  state.files[":/srv/my docs/plan.md"] = "# Plan";
  await handleLink(click("file:///srv/my%20docs/plan.md"));
  assert.equal(of("run")[0].args.props.file, "/srv/my docs/plan.md");
});

test("a file too large or unreadable still opens, so the viewer can say why", async () => {
  state.files[":/home/me/repo/docs/plan.md"] = new Error("larger than 1 MiB");
  assert.equal(await handleLink(click("docs/plan.md")), "handled");
  assert.equal(of("run")[0].name, "pane.split");
  assert.equal(of("notify").length, 0);
});

test("a remote terminal: that machine expands the path, and the viewer reads from it", async () => {
  state.exec = (_command, args) => ({ code: 0, stdout: args.includes("~/notes/plan.md") ? "/home/remote/notes/plan.md\n" : "", stderr: "" });
  assert.equal(await handleLink(click("~/notes/plan.md:3", { machine: "vps", cwd: "/srv/app", pane: "vps/p1", tab: "vps/tab1" })), "handled");
  const [ran] = of("exec");
  assert.equal(ran.command, "sh");
  assert.equal(ran.on, "vps");
  assert.ok(ran.args.includes("/srv/app"));
  assert.ok(ran.args.includes("~/notes/plan.md"));
  assert.equal(of("readTextFile").length, 0);
  assert.deepEqual(of("run")[0].args, {
    direction: "right", pane: "vps/p1", mod: "bf-markdown", props: { file: "/home/remote/notes/plan.md", on: "vps", tab: "vps/tab1" },
  });
});

test("a remote file that isn't there: a notice naming the machine", async () => {
  assert.equal(await handleLink(click("docs/gone.md", { machine: "vps", cwd: "/srv/app" })), "handled");
  assert.match(of("notify")[0].body, /vps/);
  assert.equal(of("run").length, 0);
});

test("a click from a terminal that is in no pane opens a tab named after the file", async () => {
  await handleLink(click("docs/plan.md", { pane: null, tab: null }));
  assert.deepEqual(of("run"), [{ fn: "run", name: "tab.new", args: { mod: "bf-markdown", props: { file: "/home/me/repo/docs/plan.md" }, name: "plan.md" } }]);
});

test("on Windows, a local path resolves with Windows rules", async () => {
  reset({ platform: "windows", home: "C:\\Users\\me", panes: [{ pane: "p1", tab: "tab1", terminal: "t1" }],
    files: { ":C:\\Users\\me\\repo\\docs\\plan.md": "# Plan" } });
  await handleLink(click("docs/plan.md", { cwd: "C:\\Users\\me\\repo" }));
  assert.equal(of("run")[0].args.props.file, "C:\\Users\\me\\repo\\docs\\plan.md");
});
