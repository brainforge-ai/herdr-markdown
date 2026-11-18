# Markdown Viewer for Herdr (Brainforge fork)

> A fork of [jgrecoarroyo/herdr-markdown](https://github.com/jgrecoarroyo/herdr-markdown), renamed `bf-markdown`. It opens clicked paths through Herdr's own terminal link handler, so it no longer installs a helper app or changes which app opens `.md` files. This README is being rewritten for the fork; `docs/manual-test.md` is the current check list.

When your coding agent mentions a Markdown file, click the path in the conversation and read it
rendered, right beside the conversation. No switching to another app or hunting for it in Finder.

![A conversation with a coding agent on the left, and the Markdown file it mentioned on the right, with an image and a highlighted code block](preview.png)

## What you get

- **Click a path:** cmd-click (ctrl-click on Windows and Linux) a `.md` path in the conversation to open it in a split on the right, or in the viewer already showing in that tab. Nothing outside Herdr changes.
- **Viewer:** rendered Markdown with images and highlighted code blocks with a copy button, reloading as the agent edits the file, with a Source/Preview switch. Links to other `.md` files open in place, with Back. Web links open in your browser.
- **Picker:** a key lists the `.md` paths on the focused terminal's screen, newest first. Enter opens a tab, cmd-Enter (ctrl-Enter on Linux) opens a split. Type to filter, or type a path.
- **Other machines:** the picker and viewer work with terminals on your other Herdr machines too.

## Install

**1. Copy the mod**

```sh
git clone https://github.com/jgrecoarroyo/herdr-markdown.git
cp -R herdr-markdown/mods/bf-markdown ~/.config/herdr-app/mods/
```

**2. Add a key for the picker**

In `~/.config/herdr-app/keys.json`, inside `"global"`. Use one of these, or any free key:

```json
"cmd-shift-o": "mod.open:bf-markdown"
```

```json
"ctrl-shift-m": "mod.open:bf-markdown"
```

## Good to know

- **Platforms:** tested on macOS. On Linux, clicking a path isn't supported yet, so use the picker; it should work but hasn't been tested. Windows isn't supported.
- **Images:** local images show by themselves, as PNG, JPEG, GIF, WebP or SVG up to 20 MB. Web images wait for a click, so opening a file never contacts a server it mentions. Images in files on other machines aren't shown.
- **Code highlighting:** JavaScript, Python, Java, C, C++, C#, Go, Rust, Ruby, PHP, Bash, SQL, YAML, JSON, HTML, CSS and Markdown. TypeScript uses JavaScript's colors. Other languages, such as Swift and TOML, show as plain text with their label.
- **Links:** a link to a non-Markdown file only shows it in its folder and never opens it, because it could point at something that runs.
- **Picker reach:** it reads what the terminal can show. Claude Code exposes only its visible screen, so older paths may not be listed.

## Known issues

- **Code blocks scroll past their last line.** Each block is a small editor, and Herdr has no setting to turn that off.
- **The label and copy button can cover a long line** until you scroll it sideways.
- **Code blocks inside lists keep Herdr's default look**, because drawing them separately would split the list.
- **Images inside a link don't follow it** when clicked, as with most README badges.
- **Reference-style images** (`![alt][ref]`) stay as text.
- **Text can't be selected across an image**, because the text on each side is drawn separately.

## License

[MIT](LICENSE)

Preview photo: NASA, [iss072e820937](https://images.nasa.gov/details/iss072e820937). NASA doesn't endorse this project.
