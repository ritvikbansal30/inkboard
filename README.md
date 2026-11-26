# Inkboard

Your personal whiteboard and PDF annotator.

**Start it:** double-click `Start Inkboard.command`. It opens at http://127.0.0.1:8777 in your browser.
Tip: in Chrome, use ⋮ → Cast, save and share → *Install page as app* to get a dock icon.

Everything saves automatically in the browser on this Mac. Use Export → Backup to keep a copy.
Press `?` inside the app for all shortcuts.

## Sync with GitHub
Double-click `Publish to GitHub.command`. The first time, it signs you in to GitHub and creates a **private** repo called `inkboard`; after that it pushes your latest changes.
On another Mac: `gh repo clone inkboard`, then double-click `Start Inkboard.command`.
This syncs the **app**. Your notebooks live in the browser; use Export → Backup (.inkboard) to move them.

## Pen tablet lines up wrong?
Press **F** (focus mode) so the page fills the screen, and in the XP-Pen driver set Work Area to your built-in display only with **Proportional** on. Details: press **?** in the app.
