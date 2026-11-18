// Asking the machine a terminal runs on which mentioned files are really there.
import { exec } from "herdr";

// The ones that exist, as absolute paths (relative ones are from the terminal's
// folder, ~ is home), in the same order, each once. Runs where the terminal is.
export async function existing(candidates, cwd, on) {
  if (!candidates.length) return [];
  const script = 'cd "$1" 2>/dev/null; shift; for p; do case $p in "~/"*) p="$HOME/${p#??}";; esac; ' +
    '[ -f "$p" ] && printf "%s/%s\\n" "$(cd "$(dirname "$p")" && pwd)" "$(basename "$p")"; done';
  const r = await exec("sh", ["-c", script, "sh", cwd || "/", ...candidates.slice(0, 80)], { on });
  return [...new Set(r.stdout.split("\n").filter(Boolean))];
}
