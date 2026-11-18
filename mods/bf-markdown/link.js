// Herdr calls this for a ctrl-click (cmd-click on macOS) on a Markdown path in a terminal: the file
// opens rendered beside that terminal, or in the viewer its tab already shows.
//
// The path is worked out here from the clicked text and the terminal's folder and machine. Herdr's
// own `link.path` is null for a terminal on another machine and for a path it couldn't place, which
// are cases this has to cover.
import { home, notify, readTextFile, window } from "herdr";
import { clean, isMarkdown, resolve, styleFor } from "./lib/resolve.js";
import { openFile } from "./lib/open.js";
import { existing } from "./paths.js";

const missing = (what, machine) => {
  notify({ title: "Markdown file not found", body: machine ? `${what} isn't there on ${machine}.` : `${what} isn't there.`, level: "warning" });
  return "handled";
};

// On this computer: resolved here, then read to see that it's there (null means it isn't).
async function local(raw, cwd) {
  const file = resolve(raw, { cwd, home: home(), style: styleFor(null, window()?.platform) });
  if (!file) return null;
  // A file that can't be read as text (too large, not UTF-8) is still there: the viewer says why.
  const text = await readTextFile(file).catch(() => "");
  return text === null ? null : file;
}

// On another machine: only that machine knows its home folder, so its shell expands the path.
async function remote(raw, cwd, machine) {
  const path = clean(raw);
  const absolute = path.startsWith("/") || path.startsWith("~");
  if (!absolute && !cwd) return null;
  const [file] = await existing([path], cwd, machine);
  return file ?? null;
}

export async function handleLink({ link, source }) {
  if (link?.kind !== "file" || !isMarkdown(link.raw)) return "pass";
  const machine = source?.machine ?? null, cwd = source?.cwd ?? null;
  const file = machine ? await remote(link.raw, cwd, machine) : await local(link.raw, cwd);
  // Handled either way: passing a missing file on would only open another app on nothing.
  if (!file) return missing(clean(link.raw), machine);
  openFile(file, machine, { pane: source?.pane ?? null, tab: source?.tab ?? null });
  return "handled";
}
