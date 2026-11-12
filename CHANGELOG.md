# Changelog

All notable changes to TurboImage are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/).

## [1.1.0] - 2026-11-12

### Changed
- **Redesigned UI** on the design system shared by every tool in the suite (see [DESIGN.md](./DESIGN.md)). The look moves from dark glassmorphism to a clean product UI: neutral surfaces, a teal accent, subtle borders and shadows. There is no blur, glow or gradient background any more.
- **Theme switch:** a System / Light / Dark control in the header replaces the floating sun/moon button. System is the default; it follows the OS setting and updates live when the setting changes. On phones the switch is a single button that cycles through the three modes.
- **Theme storage:** the choice is stored under `theme-preference` and shared with the other tools on the same origin. The old `theme` key is removed on load, so everyone starts on System once.
- **Mobile-first layout:**
  - The upload zone comes first on phones; settings follow below.
  - From 1024px the settings move into a sticky 320px sidebar.
  - The queue no longer scrolls inside its own box.
  - Queue rows reflow onto two lines on narrow screens, without absolutely positioned controls.
- **Compare dialog:** now a native `<dialog>`, which gives a focus trap, Esc to close and an inert background. It is centred on desktop, a full-screen sheet on phones, and its height uses `dvh`.
- The dropzone has a real **Choose images** button for keyboard and screen-reader users.
- Status pills, savings badges, progress bar and alerts use the shared badge, alert and progress components.
- The web app manifest uses the new background and theme colours, and the service worker cache was bumped to `v3`.

### Fixed
- The OS theme was saved as if it were a user choice on first load, so the app stopped following later OS changes.
- The quality slider had no visible keyboard focus.
- Native form controls and scrollbars ignored the theme (`color-scheme` is now set).
- Several text and badge colours failed WCAG AA contrast in light mode, e.g. the "Processing" status. All token pairs are now checked.
- `<main>` wrapped the header and footer, and heading levels skipped from h1 to h3. Landmarks and headings are now correct, and a skip link was added.
- Decorative footer icons are now hidden from screen readers.

### Removed
- The Outfit font dependency. Inter Variable is now the only font.
- The unused `--primary-hover` and `--primary-glow` tokens, with the rest of the old `App.scss`.

## [1.0.0]

- Initial release: local JPEG, PNG, WebP and AVIF compression and conversion with WASM codecs, a worker pool, SVG support, batch ZIP download, before/after compare and offline support.
