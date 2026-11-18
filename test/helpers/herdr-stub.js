// A stand-in for the "herdr" module the app gives a mod. Tests set what the app would answer in
// `state` and read back what the mod asked the app to do from `calls`.
export const state = {};
export const calls = [];

export function reset(next = {}) {
  calls.length = 0;
  for (const key of Object.keys(state)) delete state[key];
  Object.assign(state, {
    panes: [], files: {}, shared: {}, home: "/home/me", platform: "macos", exec: null, focused: null, props: null,
  }, next);
}
reset();

export const panes = () => state.panes;
export const focused = () => state.focused;
export const props = () => state.props;
export const home = () => state.home;
export const window = () => ({ platform: state.platform });
export const shared = (key) => state.shared[key];
export function setShared(key, value) { state.shared[key] = value; calls.push({ fn: "setShared", key, value }); return null; }
export function run(name, args) { calls.push({ fn: "run", name, args }); return null; }
export function notify(n) { calls.push({ fn: "notify", ...n }); return "n1"; }

// `files` maps "<machine or empty>:<path>" to the file's text.
export async function readTextFile(path, options = {}) {
  calls.push({ fn: "readTextFile", path, on: options.on ?? null });
  const text = state.files[`${options.on ?? ""}:${path}`];
  if (text instanceof Error) throw text;
  return text ?? null;
}

export async function exec(command, args = [], options = {}) {
  calls.push({ fn: "exec", command, args, on: options.on ?? null });
  return state.exec ? state.exec(command, args, options) : { code: 0, stdout: "", stderr: "" };
}
