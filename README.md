# VictoryX APK Builder

A first-version GitHub-ready Android project builder: browser → Node/Express → GitHub Actions → Gradle APK artifact.

## Important architecture note

GitHub Actions runners cannot automatically see files stored on a separate Node.js host. The included workflow therefore demonstrates the build contract but requires a private, authenticated transfer mechanism between the backend and runner (for example, object storage or a short-lived upload endpoint). Do not put user ZIPs into Git history.

For a production implementation, make the backend upload the build input to private object storage and have the workflow download it using a short-lived signed URL passed securely as an Actions secret/input. Never expose the GitHub token to the browser.

## Setup

1. Create a GitHub repository and copy this project into it.
2. Enable GitHub Actions.
3. Create a GitHub fine-grained token with only the repository Actions/workflow permissions required to dispatch the workflow (and repository contents access if your chosen transfer design needs it).
4. Copy `backend/.env.example` to `.env`.
5. Set `GITHUB_TOKEN`, `GITHUB_OWNER`, `GITHUB_REPO`, `GITHUB_BRANCH`, and `PORT`.
6. In `backend/`, run `npm install` then `npm start`.
7. Serve `website/` from a static host, or open `index.html` during local testing. Set `VICTORYX_API_BASE` if the backend is not on localhost.

## How it works

The browser sends a ZIP plus JSON configuration to Express. Express validates the basic fields, creates a random build ID, stores the input outside the public website, and dispatches `build-apk.yml`. The workflow customises a detected app module, finds the Gradle wrapper, builds an APK, and uploads the APK as an Actions artifact.

## Supported customisation

Common Groovy `app/build.gradle` projects are the safest target. The modifier deliberately avoids global replacement. Kotlin DSL projects are detected but their Gradle version fields are not automatically rewritten by this first version.

App name is changed through an existing `app_name` resource. Package/version changes target known Groovy Android properties. Permissions, splash styling, colours, and launcher icon generation require project-specific Android resource integration; do not assume every project exposes these in the same way.

## Security

- ZIP path traversal is checked.
- Upload size is limited to 100 MB.
- Only ZIP and common image extensions are accepted.
- Package names and version codes are validated.
- User content must never be treated as workflow code.
- Never expose `GITHUB_TOKEN` to client-side JavaScript.
- Run untrusted Android projects only in isolated CI infrastructure and review Gradle/plugin behaviour before offering a public service.

## Troubleshooting

### Gradle wrapper not found
The uploaded project should include `gradlew`, `gradlew.bat`, `gradle/wrapper/`, or otherwise provide a build strategy. This builder intentionally does not invent a Gradle wrapper.

### Release build fails
Many release projects require signing credentials. This builder does not fabricate signing keys. Configure a secure CI signing setup if a signed release APK is required.

### Package change fails
Some projects use product flavours, multiple modules, manifest placeholders, or Kotlin DSL. Inspect the build log and apply a project-specific modifier rather than performing global text replacement.

### GitHub workflow cannot find the ZIP
This is expected unless the backend-to-runner transfer step is configured. Use private object storage plus short-lived authenticated access, or another secure transfer design.

## Deployment

The backend can run on a Node.js hosting provider. Store GitHub credentials only in the provider's secret/environment-variable manager. Deploy `website/` separately as static assets, and configure CORS/API base URL appropriately.

## Scope

Android itself restricts certain features. This project only automates modifications that can be safely detected; it should fail clearly rather than corrupt an arbitrary Android project.
