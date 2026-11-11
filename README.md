# AgriCompanion feature page: design prototype

A working, responsive HTML/CSS/JS prototype for design review. It isn't the production site; copy and some content are placeholders.

| Page | Contents |
|---|---|
| `index.html` | Hero, tabbed use cases, trust & security |
| `webinar.html` | Use cases section for the webinar page (stacked layout) |

Static files only, with no build step or dependencies. Fonts and icons are bundled in `vendor/`.

## View it

- **GitHub Pages:** Settings → Pages → *Deploy from a branch* → `main` / `(root)`.
- **Locally:** open `index.html`, or run `python3 -m http.server` here and visit `http://localhost:8000`.

## Preview sizes

The glass widget at the bottom-left switches between **Mobile (390 × 844)**, **Tablet (768 × 1024)** and **Desktop (1440 × 900)**. Mobile and tablet render the page inside a device-sized frame, so the real responsive layout and animations run. The choice is kept in the URL (`?view=mobile`, `?view=tablet`), and **Esc** returns to the full page.

## Motion

- Entrance and scroll-reveal animations, a sliding tab indicator, and panel transitions.
- A subtle idle loop: floating cards and phones, a slow photo drift, and a twinkling badge icon.
- Mouse tilt and scroll parallax on the hero phones.
- All motion is off for visitors with *Reduce motion* enabled.

## Notes

- Pages are marked `noindex` so search engines skip the prototype.
- The "draft copy" label and the free icon stand-in for `sparkles` are prototype-only.
