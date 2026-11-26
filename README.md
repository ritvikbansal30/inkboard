# Inkboard

Your personal whiteboard and PDF annotator, tuned for the XP-Pen Deco Mini 7.

## Start it
Double-click `Start Inkboard.command`. It opens at http://127.0.0.1:8777 in Chrome.

**Make it a real app (once):** on the dashboard, click **Install as app** (or Chrome menu → Cast, save and share → Install page as app).
Inkboard then gets its own Dock icon and window, and works offline even when the start script isn't running.

## Your notes
- **Dashboard** (opens at launch, or Cmd+O): every notebook as a card, with search, filters and sorting.
- **Autosave** keeps everything in the browser as you write.
- **Save changes** (top-right button, or Cmd+S) also writes real files into your **notes folder**.
  Choose the folder once from the dashboard. Put it in iCloud Drive to sync between Macs.
  Each notebook is a `Name.inkboard` folder containing `notebook.json`, `meta.json` and `files/` (your PDFs and images).
- **Import notes…** opens any `.inkboard` folder. Notebooks in the notes folder that this browser hasn't seen show up as **In folder**.
- Badges: **Unsaved** = changes not yet written to the folder; **Newer in folder** = the folder copy is newer (opening it loads that copy).

## Pen tablet (XP-Pen Deco Mini 7)
Open **Tablet** in the top bar: test pad, pressure curve, thinnest line, pen-button actions, snap-to-shape and the size ring.
Driver: Work Area → built-in display + Proportional; lower pen button = Right click, upper = Middle click.
Press **F** for focus mode; with a 16:10 page the tablet surface maps one-to-one onto the page.

## Update
`git pull` in this folder, then reload Inkboard twice (the offline cache updates on the first load).
