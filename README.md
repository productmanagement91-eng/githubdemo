# TaskFlow

A modern, responsive productivity dashboard built with plain HTML, CSS and JavaScript — no build step, no dependencies.

## Features

- **Dashboard layout**: sidebar navigation, welcome section with a time-of-day greeting and progress ring, task statistics, and a task list
- **Task management**: add tasks with a priority (Low / Medium / High), mark them completed, delete them
- **Filters**: All / Active / Completed (also reachable from the sidebar)
- **Live statistics**: total, completed, pending and completion percentage
- **Persistence**: tasks are saved in your browser's `localStorage`
- **Responsive**: desktop sidebar becomes a slide-in drawer on tablets and phones
- **Dark mode**: follows your system preference
- **Accessible**: keyboard-friendly, ARIA labels, respects reduced-motion

## Run it

Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
```

Then visit http://localhost:8000.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Page structure |
| `styles.css` | Design tokens, layout and responsive styles |
| `app.js` | Task state, rendering, and event handling |
