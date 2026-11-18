// From the text of a clicked or typed path to a Markdown file's absolute path. Nothing here talks to
// Herdr or the disk, so it runs the same in the app and in tests.

const MARKDOWN = /\.(?:md|markdown|mdx)$/i;
// Up to the Markdown extension; what an agent or a link puts after it (":12", ":12:3", "#heading") goes.
const MARKDOWN_PATH = /^(.*?\.(?:md|markdown|mdx))(?:[:#].*)?$/i;

/**
 * The path inside the text, without what wraps it: a `file://` link (decoded), a leading `@`, a line
 * number or an anchor. `~` and relative paths stay as written. Null for a web link or nothing at all.
 */
export function clean(raw) {
  let text = String(raw ?? "").trim().replace(/^@/, "");
  if (!text) return null;
  if (/^file:\/\//i.test(text)) {
    text = text.replace(/^file:\/\/(localhost(?=\/))?/i, "");
    try { text = decodeURIComponent(text); } catch {}
  } else if (/^[a-z][\w+.-]*:\/\//i.test(text) || /^(mailto|data):/i.test(text)) {
    return null;
  }
  const markdown = MARKDOWN_PATH.exec(text);
  if (markdown) return markdown[1];
  return text.replace(/#.*$/, "").replace(/(:\d+){1,2}$/, "") || null;
}

export const isMarkdown = (raw) => MARKDOWN.test(clean(raw) ?? "");

/** How paths are written where the file is: any other Herdr machine is taken to be Unix. */
export const styleFor = (machine, platform) => (!machine && platform === "windows" ? "windows" : "posix");

const fold = (parts) => parts.reduce((acc, part) => part === ".." ? acc.slice(0, -1) : part === "." || part === "" ? acc : [...acc, part], []);

function posix(path, cwd, home) {
  if (path === "~" || path.startsWith("~/")) { if (!home) return null; path = home + path.slice(1); }
  else if (!path.startsWith("/")) { if (!cwd) return null; path = `${cwd}/${path}`; }
  return "/" + fold(path.split("/")).join("/");
}

// A drive ("C:") or a network share ("\\server\share") at the start of a Windows path.
const WINDOWS_ROOT = /^(?:[a-z]:|\\\\[^\\]+\\[^\\]+)/i;

function windows(path, cwd, home) {
  const back = (p) => p.replace(/\//g, "\\");
  path = back(path).replace(/^\\(?=[a-z]:)/i, ""); // "/C:/x", as a file link writes it
  if (path === "~" || path.startsWith("~\\")) { if (!home) return null; path = back(home) + path.slice(1); }
  else if (!WINDOWS_ROOT.test(path)) {
    if (!cwd) return null;
    const folder = back(cwd);
    // "\x": from the root of the folder's drive. Anything else: from the folder.
    path = path.startsWith("\\") ? (WINDOWS_ROOT.exec(folder)?.[0] ?? "") + path : `${folder}\\${path}`;
  }
  const root = WINDOWS_ROOT.exec(path)?.[0];
  if (!root) return null;
  const rest = fold(path.slice(root.length).split("\\")).join("\\");
  return `${/^[a-z]:$/i.test(root) ? root.toUpperCase() : root}\\${rest}`;
}

/**
 * The absolute path of a file on this computer, whatever its kind, or null when the text isn't a
 * path or is relative with nothing to resolve it from.
 * `cwd`: the folder the text was printed in. `home`: the user's. `style`: "posix" or "windows".
 */
export function resolvePath(raw, { cwd = null, home = null, style = "posix" } = {}) {
  const path = clean(raw);
  if (!path) return null;
  return style === "windows" ? windows(path, cwd, home) : posix(path, cwd, home);
}

/** As resolvePath, for Markdown files only: anything else gives null. */
export const resolve = (raw, where) => (isMarkdown(raw) ? resolvePath(raw, where) : null);
