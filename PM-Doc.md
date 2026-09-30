# Momentum Clone – PM Doc (V1)

2026-09-30 · Carolin

## Overview

We are building a Chrome extension that replaces the New Tab page with a calm, personal dashboard, inspired by [Momentum](https://momentumdash.com). Every new tab shows a clock with a personal greeting, the user's own background image, their main focus for the day and a focus timer.

- **Product:** Chrome extension (Manifest V3) that overrides the New Tab page
- **Goal:** help the user stay focused and intentional every time they open a new tab
- **Target user:** students and knowledge workers who open many tabs a day and get distracted easily
- **Working name:** Momentum Clone (open question: final name)

## Scope and tech approach

V1 ships four features that work fully offline, with no accounts, servers or API keys.

| # | Feature | In V1 | Main skill it exercises |
| --- | --- | --- | --- |
| 1 | Clock + personalized greeting | Yes | Time logic, saving a name |
| 2 | Background image (drag & drop) | Yes | File handling, visuals |
| 3 | Daily focus | Yes | User input, storage, daily reset |
| 4 | Focus timer (Pomodoro) | Yes | Interactivity, timers |
| - | Weather, quotes, to-do list, search, white noise, sync | No | Later versions |

**Tech approach**

- `manifest.json` (Manifest V3) with `chrome_url_overrides.newtab` pointing to `newtab.html`
- Plain HTML, CSS and JavaScript, no frameworks or build step
- Data saved locally in the browser (`chrome.storage.local`, or `localStorage` as a fallback)
- Loaded in Chrome via chrome://extensions > Developer mode > Load unpacked

**Planned file structure**

```
momentum-clone/
  manifest.json
  newtab.html
  styles.css
  script.js
  images/default-bg.svg
  icons/icon16.png, icon48.png, icon128.png
```

## Feature 1: Clock + personalized greeting

A large clock sits in the centre of the page, with a greeting under it that changes with the time of day and uses the user's name.

**User story:** As a user, I want to see the time and a personal greeting so that each new tab feels welcoming.

**Acceptance criteria**

- [ ] The current time is shown large and centred in 24h format (HH:MM), e.g. 14:05
- [ ] The clock updates automatically every minute without reloading the page
- [ ] The greeting depends on the time: 05:00-11:59 "Good morning", 12:00-17:59 "Good afternoon", 18:00-21:59 "Good evening", 22:00-04:59 "Good night"
- [ ] On first use, the page asks "What's your name?" in an input field
- [ ] After entering a name and pressing Enter, the greeting reads e.g. "Good afternoon, Carolin."
- [ ] The name is saved and still shown after closing and reopening Chrome
- [ ] Clicking the name lets the user edit it

## Feature 2: Background image (drag & drop)

The page shows a full-screen background image, and the user can replace it by dragging their own photo onto the page.

**User story:** As a user, I want to use my own photo as the background so that the page feels personal.

**Acceptance criteria**

- [ ] On first use, a built-in default image fills the whole screen (no stretching, no white edges)
- [ ] When a user drags an image file over the page, a visible hint appears (e.g. "Drop your image here")
- [ ] Dropping a JPG, PNG or WEBP image sets it as the new background immediately
- [ ] Dropping a non-image file (e.g. a PDF) shows a short error message and keeps the current background
- [ ] The chosen image is saved and still shown after closing and reopening Chrome
- [ ] A "Reset background" button restores the default image
- [ ] Text on top (clock, greeting, focus) stays readable on light and dark photos (e.g. a subtle dark overlay or text shadow)

## Feature 3: Daily focus

Below the greeting, the page asks for the user's main focus for today and shows it all day on every new tab.

**User story:** As a user, I want to set one main focus per day so that I remember what matters every time I open a tab.

**Acceptance criteria**

- [ ] If no focus is set for today, the page shows "What is your main focus for today?" with an input field
- [ ] Typing a focus and pressing Enter replaces the input with the focus text under the label "TODAY"
- [ ] The focus is saved and shows on every new tab for the rest of the day
- [ ] A checkbox next to the focus marks it as done: the text gets a strike-through and a short message appears (e.g. "Nice work!")
- [ ] The user can edit or delete the focus (e.g. via a small x button)
- [ ] On the next calendar day, the old focus is cleared and the question appears again
- [ ] An empty input (only spaces) is not saved

## Feature 4: Focus timer (Pomodoro)

A small timer widget lets the user run a 25-minute focus session followed by a 5-minute break.

**User story:** As a user, I want a simple focus timer on my new tab so that I can work in focused blocks without a separate app.

**Acceptance criteria**

- [ ] A timer widget shows 25:00 in "Focus" mode by default
- [ ] A Start button starts the countdown, which updates every second (MM:SS)
- [ ] While running, the button changes to Pause; Pause stops the countdown and keeps the remaining time
- [ ] A Reset button sets the timer back to the start of the current mode
- [ ] When a focus session reaches 00:00, a sound or alert plays and the timer switches to "Break" mode at 05:00
- [ ] When the break reaches 00:00, a sound or alert plays and the timer switches back to "Focus" at 25:00
- [ ] The browser tab title shows the remaining time while the timer runs (e.g. "18:42 - Focus")

## General acceptance criteria and definition of done

V1 is done when every box in this doc is ticked in a real Chrome browser.

**General acceptance criteria**

- [ ] The extension loads via "Load unpacked" without errors on chrome://extensions
- [ ] Opening a new tab (Ctrl+T) opens the extension page instead of Chrome's default page
- [ ] The page loads in under 1 second and shows no errors in the browser console
- [ ] All saved data (name, background, focus) survives closing and reopening Chrome
- [ ] The layout works in a full-size window and a half-screen window

**Layout**

| Position | Element |
| --- | --- |
| Full screen | Background image |
| Centre | Clock, greeting below it, daily focus below that |
| Bottom right | Focus timer widget |
| Bottom left | Reset background button |

**Ideas for later versions (not V1)**

- White noise or soundscapes
- Quote of the day
- Mini to-do list
- Weather (needs an external API)
- Settings panel (12h/24h clock, custom timer lengths)
