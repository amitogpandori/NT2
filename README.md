# AppLab Desktop

Windows desktop workspace for importing ZIP web projects, inspecting them, building them, and testing them locally inside Chromium before deployment.

## Modes
- **Netlify Local** — launches the official Netlify Dev runtime through npx.
- **Build & Preview** — installs dependencies, runs the project's build script, then serves detected static output.
- **Static Preview** — directly serves ZIPs containing an index.html.

## Safety
Only run ZIPs you trust. Build scripts and local Netlify functions execute project code on your computer. External cloud services remain external.

## Build
Run `npm install`, `npm test`, then `npm run dist:win -- --publish never`. GitHub Actions also produces a Windows installer artifact.
