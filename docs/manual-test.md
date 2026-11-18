# Manual test (macOS)

The unit tests cover path resolution, routing and the link handler against a stand-in for Herdr.
They cannot click anything. This script covers what only the running app can show.
It takes about ten minutes. Write down the result of every step, including the two checks at the top.

You need: Herdr App, a coding agent or a plain shell in a Herdr terminal, and a git repo with a few `.md` files.

Record first: the Herdr App and herdr-core versions shown in Settings → Updates.

## Setup

```sh
git clone <this repo> ~/src/herdr-markdown
cd ~/src/herdr-markdown && git checkout feat/native-link-handler
cp -R mods/bf-markdown ~/.config/herdr-app/mods/
herdr-app check ~/.config/herdr-app/mods/bf-markdown
```

Expected: `herdr-app check` exits 0. Paste any output it prints.

Do not clone a layout yet. Check A needs the layout Herdr shipped with.

## Check A: does the handler fire on a shipped layout?

1. Stay on the default layout (`main`), untouched.
2. In a Herdr terminal, inside the repo, run `echo docs/manual-test.md` (any `.md` path that exists, relative to the folder you are in).
3. Cmd-click the printed path.

Record which of these happened:

- **A1.** A pane opened on the right showing the file rendered. The handler works without a personal layout.
- **A2.** Another app opened the file (Xcode, TextEdit, an editor), or nothing happened. The handler did not fire.

If A2: make a personal layout, switch to it, and repeat step 3.

```sh
herdr-app do layout.clone '{"name":"main","as":"bf-main"}'
herdr-app do layout.switch '{"name":"bf-main"}'
grep -n link_handlers ~/.config/herdr-app/layouts/bf-main.json
```

Record whether `link_handlers` in that file lists `bf-markdown`, and whether the click now opens the pane.
If the click still does nothing on a personal layout that lists the mod, stop here and report: the rest depends on it.

## Check B: what does a split viewer know about itself?

1. With a viewer pane open from Check A, run:

```sh
herdr-app status
```

2. Find the viewer pane in the output and copy the whole entry for it, including any `props`.

Record: does the entry show `tab`, and does it show a `pane` id inside the props? If `status` shows no props, say so.

If `status` shows no props at all, do this instead: add the line below as the first line of `init` in `~/.config/herdr-app/mods/bf-markdown/main.js`, save, click a path to open a new viewer, and copy the text of the toast that appears. Remove the line afterwards.

```js
notify({ title: "bf-markdown props", body: JSON.stringify(props()), timeout: 60000 });
```

`notify` also needs adding to the `import { ... } from "herdr"` line at the top of that file.

## Steps

Each step lists what you should see. Mark it pass or fail, and for a fail say what happened instead.

1. **Click opens beside the chat.** Have the agent print a relative `.md` path, or `echo` one. Cmd-click it.
   Expected: a pane on the right shows the file rendered. No other app opens.
2. **Outside the home folder.** Repeat step 1 in a repo under `/tmp` or `/Volumes` (`git clone` any repo there).
   Expected: same as step 1.
3. **Reading the file.** In the viewer: switch to Source and back to Preview; copy a code block with its copy button and paste it somewhere; open a file that embeds a local image.
   Expected: both views show; the pasted text matches the block; the image shows.
4. **Second file reuses the pane.** Cmd-click a different `.md` path in the same terminal.
   Expected: the same pane now shows the second file, within about half a second. No second split. Back returns to the first file.
5. **Only this tab's viewer changes.** Open a second tab, click a path there so it gets its own viewer, then go back to the first tab and click a third path.
   Expected: the first tab's viewer changes. The second tab's viewer still shows its own file.
6. **No stale file.** Close the viewer pane. Cmd-click a path you have not opened yet.
   Expected: a new pane opens showing that file, not the one from step 4.
7. **Missing file.** Run `echo docs/does-not-exist.md` and Cmd-click it.
   Expected: a notice saying the file isn't there. No new pane. No other app opens.
8. **Line number.** Run `echo docs/manual-test.md:12` and Cmd-click it.
   Expected: the file opens. If the click does nothing or opens another app, record that.
9. **Absolute and home paths.** Cmd-click an absolute path (`echo "$PWD/README.md"`) and a `~/...` path.
   Expected: both open.
10. **Not Markdown.** Cmd-click a path to a `.js` or `.txt` file.
    Expected: whatever happened before the mod was installed. The viewer does not open.
11. **Follows the file.** With a file open in the viewer, append a line from the terminal: `echo "added" >> <that file>`.
    Expected: the line appears in the viewer without a click.
12. **Restart.** Quit Herdr with a viewer open and start it again.
    Expected: the viewer comes back showing the file it had, not a different one.
13. **Picker still works.** Press the picker key (add `"cmd-shift-o": "mod.open:bf-markdown"` to `"global"` in `~/.config/herdr-app/keys.json` if it isn't bound). Choose a file with cmd-Enter.
    Expected: the picker lists the `.md` paths on the terminal's screen; the file opens in a split.

14. **Viewer opened as a tab.** Press the picker key and choose a file with plain Enter, so the viewer opens as its own tab. In that tab, split a terminal beside it (`herdr-app do pane.split:right` or the split key), print a different `.md` path there and Cmd-click it.
    Expected: the viewer in that tab changes to the clicked file. If nothing happens, record that: it means a viewer opened as a tab does not know which tab it is in.

## Only if you have a remote Herdr machine

15. In a terminal on the remote machine, print a `.md` path that exists there and Cmd-click it.
    Expected: the viewer opens it, and its header shows the machine's name before the folder.
16. Click a `~/...` path on the remote machine.
    Expected: it opens the file from the remote home folder, not this computer's.

## Report back

- Herdr App and herdr-core versions.
- Check A: A1 or A2, and what the personal layout did.
- Check B: the pasted entry.
- Pass or fail for steps 1 to 14 (and 15 to 16 if run), with what happened for each fail.
- Anything in `herdr-app status` under errors after the run.

## Clean up

```sh
rm -rf ~/.config/herdr-app/mods/bf-markdown ~/.config/herdr-app/data/bf-markdown
```

If you made the `bf-main` layout only for this test, switch back to `main` in Settings and delete `~/.config/herdr-app/layouts/bf-main.json`.
