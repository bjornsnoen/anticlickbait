# Repository Guidelines

## Layout

- `src/background/index.ts` is the runtime hub: it handles extension messages, installs the context menu, and reveals the viewport when the action button is clicked.
- `src/content/index.tsx` injects the content UI into `vg.no`; the shared host permissions live in `src/constants.ts`.
- `src/options/` and `src/popup/` are separate React entrypoints; `pages/*.html` are their HTML shells.
- `scripts/icons.ts` is run from `pnpm prepare` and regenerates icon files from `src/assets/logo.png`.
- `dist/` is the build output and the packaged zip source.

## Commands

- `pnpm install` requires Node `>=14.18.0` and runs the icon generator via `prepare`.
- `pnpm dev` starts Vite for local UI work.
- `pnpm build` runs `tsc`, `vite build`, then packages `dist/` into `dist/anti-clickbait-*.zip`.
- `pnpm build:chrome` and `pnpm build:firefox` set `TARGET=chrome|firefox` for browser-specific builds.
- `pnpm build:firefox:sign` builds Firefox and signs it; `pnpm sign` needs `AMO_JWT_ISSUER` and `AMO_JWT_SECRET`.
- `pnpm package` zips the existing `dist/` output; `pnpm fmt` runs Prettier.

## Workflow Notes

- There is no test runner configured here.
- Manual smoke test: load the built extension, hover articles on `https://www.vg.no/`, and check the options/popup pages.
- If you add or remove supported sites, update `HostPermissions` in `src/constants.ts`; the Vite manifest uses that list to generate browser-specific permissions.
- `scripts/icons.ts` needs ImageMagick (`magick` or `convert`) available.
- CI publishes only when `package.json` version changes, so do not bump the version unless you mean to release.

## Style

- Prettier uses single quotes, no semicolons, 2-space indentation, and `printWidth: 100`.
- ESLint is configured, but there is no repo-local test/lint gate beyond running it manually when needed.
