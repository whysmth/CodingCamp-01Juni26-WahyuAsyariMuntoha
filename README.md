# Focus — Your Daily Dashboard

A clean, minimal personal dashboard to stay focused and organised throughout the day.

## Features

- **Clock & Greeting** — Live clock with seconds, dynamic greeting based on time of day, and personalised name support
- **Focus Timer** — Pomodoro-style countdown with a progress ring, preset durations (5 / 15 / 25 min), and browser notifications on completion
- **To-Do List** — Add, edit, complete, and delete tasks; drag to reorder (insertion order)
- **Quick Links** — Bookmark frequently visited sites with favicons; drag to reorder; add or remove links at any time
- **Light / Dark Mode** — Toggle between themes; preference is saved across sessions

## Project Structure

```
├── index.html       # App markup and modals
├── css/
│   └── style.css    # Theming, layout, and component styles
└── js/
    └── app.js       # All app logic (clock, timer, to-dos, links, settings)
```

## Usage

Open `index.html` directly in a browser — no build step required.

All data (tasks, links, theme, name) is persisted in `localStorage`.
