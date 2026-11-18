// Where a file opens, decided from what is on screen. One viewer per tab: a second file goes to the
// viewer that tab already has. Nothing here talks to Herdr, so it runs the same in the app and in tests.

/**
 * `panes`: Herdr's panes(). `source`: the pane and tab the file was asked for from. `mod`: this mod.
 * - { action: "reuse", tab }        a viewer is showing in that tab: hand it the file
 * - { action: "split", pane, tab }  none is: split one to the right of the pane
 * - { action: "tab" }               the source is in no pane or tab: a tab of its own
 */
export function route(panes, source, mod) {
  const tab = source?.tab ?? null, pane = source?.pane ?? null;
  if (!tab) return { action: "tab" };
  if (panes.some((p) => p.mod === mod && p.tab === tab)) return { action: "reuse", tab };
  return pane ? { action: "split", pane, tab } : { action: "tab" };
}

/**
 * Whether a viewer takes a hand-off request: it names a file for the viewer's own tab, and isn't the
 * one the viewer saw last (taken already, or stored before the viewer started).
 */
export function takes(request, { tab, seen }) {
  return Boolean(request?.id && request.file && tab && request.tab === tab && request.id !== seen);
}
