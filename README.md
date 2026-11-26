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

## Drawboard-style tools
- **Pens bar** with real pen icons (switch to colour dots in any pen's settings → Pen bar).
- **Ruler (G) and protractor:** drag to move, drag the green knob to rotate (snaps to 0/45/90°, Shift = 15° steps). Start a stroke on the ruler's edge and it draws perfectly straight; start on the protractor's arc to draw arcs. The protractor shows θ live as you hover.
- **Radial menu (Q, or set a pen button to "Radial menu"):** pens, eraser, select and laser in a circle around your pen; centre = undo.
- **Laser** (click the laser tool again): Dot, Trail, Fading ink (write and it vanishes) or Spotlight, in 6 colours, with size and fade time.
- **Straight highlighter** option, **tick / cross / star stamps** (click to stamp, drag to size), **bookmarks (M)** with a Bookmarks filter in the sidebar, and a **highlights-only eraser**.

## Update
`git pull` in this folder, then reload Inkboard twice (the offline cache updates on the first load).

## Shapes & physics library (K)
Open with the atom button in the toolbar or press **K**. 125 vector shapes in 10 chapters: Shapes & Axes, Modern Physics, Ray Optics, Wave Optics, Electrostatics, Current Electricity, Magnetism & EMI, Semiconductors, Mechanics, and Heat, Waves & Gravitation.
Click a shape, then click the page to drop it (or drag to size it); keep clicking to place more. Select a placed shape to move, resize, rotate (15° steps), flip, recolour or delete it. "Natural colours" keeps protons red, electrons blue and so on; pick any colour to override.
Modern Physics includes ready-made derivation diagrams: Bohr atom, H-atom energy levels, Lyman/Balmer/Paschen series, photoelectric setup, Kmax–ν and I–V graphs, decay curve, BE/A curve, fission, fusion, β-decay, Rutherford scattering, matter wave, orbit standing wave and X-ray spectrum.

## Tables
Insert → Table… (or the Table button in the library). Type straight into cells; Tab moves to the next cell and adds a row at the end. Double-click a cell to edit it later. When a table is selected, its toolbar adds/removes rows and columns and toggles the header row.
