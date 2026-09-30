# Momentum Clone (V1)

A Chrome new-tab extension with a clock and greeting, your own background image (drag & drop), a daily focus and a Pomodoro timer. The specs are in [../PM-Doc.md](../PM-Doc.md).

## Install in Chrome

1. Open `chrome://extensions`
2. Turn on **Developer mode** (top right)
3. Click **Load unpacked** and select this `momentum-clone` folder
4. Open a new tab (Ctrl+T). If Chrome asks whether to keep the changed new tab page, choose **Keep it**.

After changing the code, click the reload icon on the extension card in `chrome://extensions`, then open a new tab.

## Files

| File | What it does |
| --- | --- |
| `manifest.json` | Tells Chrome this extension replaces the New Tab page |
| `newtab.html` | Page structure |
| `styles.css` | Layout and look |
| `script.js` | All four features, one section each |
| `images/default-bg.svg` | Default background |
| `icons/` | Extension icons |

## Known limitations (V1)

- Each tab has its own timer. Closing the tab stops the timer.
- If the timer's tab stays in the background for a long time, Chrome may delay the end alert by up to about a minute.
