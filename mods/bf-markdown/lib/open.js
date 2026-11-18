// Opening a file in the viewer: the one place that decides between the viewer a tab already has, a
// new split, and a new tab. The link handler and the picker both go through it.
import { panes, run, setShared } from "herdr";
import { route } from "./route.js";

export const MOD = "bf-markdown";
// The shared value a showing viewer watches: { id, tab, file, on }. See route.js `takes`.
export const OPEN_KEY = "bf-markdown.open";

const base = (path) => path.slice(Math.max(path.lastIndexOf("/"), path.lastIndexOf("\\")) + 1);

/**
 * `file`: absolute path. `on`: the machine it is on, null for this computer.
 * `source`: the pane and tab it was asked for from ({ pane, tab }, either may be null).
 * A split is told its tab in its props: Herdr tells a mod pane nothing about where it sits.
 */
export function openFile(file, on, source) {
  const where = route(panes(), source, MOD);
  const props = { file, ...(on ? { on } : {}) };
  if (where.action === "reuse") {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setShared(OPEN_KEY, { id, tab: where.tab, file, on: on ?? null });
  } else if (where.action === "split") {
    run("pane.split", { direction: "right", pane: where.pane, mod: MOD, props: { ...props, tab: where.tab } });
  } else {
    run("tab.new", { mod: MOD, props, name: base(file) });
  }
  return where.action;
}
