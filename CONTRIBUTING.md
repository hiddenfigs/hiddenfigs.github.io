# Contributing

## Adding or editing a scientist entry

There are two ways to propose a scientist entry:

1. **No GitHub account needed for setup, but you'll still need one to submit:**
   click "Add an entry" on the homepage, fill out the form, and follow the
   generated link — it pre-fills a new file on GitHub for you to commit,
   which opens a pull request.
2. **Web form (`/admin/`):** log in with GitHub and edit entries through a
   proper form. Saving opens a pull request automatically — you don't need
   push access to this repo.

Either way, every pull request that touches `content/scientist/` is checked
automatically by [.github/workflows/validate-content.yml](.github/workflows/validate-content.yml)
(see [scripts/validate-scientists.js](scripts/validate-scientists.js) for
what it checks) before a maintainer reviews it.

## One-time setup: connecting the `/admin/` CMS to GitHub

This site is static (deployed via GitHub Pages), so the `/admin/` editor
(Decap CMS) can't hold a GitHub OAuth client secret itself. Instead, an
existing Netlify site linked to this repo (see `.netlify/state.json`) is
used purely to broker the GitHub login — it doesn't need to build or host
anything. This only needs to be done once, by a maintainer with access to
both the `hiddenfigs` GitHub org and that Netlify site.

1. **Create a GitHub OAuth App:** GitHub → Settings → Developer settings →
   OAuth Apps → New OAuth App.
   - Homepage URL: `https://hiddenfigs.github.io`
   - Authorization callback URL: `https://api.netlify.com/auth/done`
   - Save, then generate a Client Secret. Keep the Client ID and Secret
     handy for the next step.

2. **Register that OAuth App with the Netlify site:** open the Netlify
   site linked to this repo → Site settings → Access control → OAuth →
   Install provider → GitHub → paste in the Client ID and Client Secret →
   Save.

3. **Point the CMS at that Netlify site:** find the site's default URL
   (Site settings → Domain management, looks like
   `https://<site-name>.netlify.app`) and set it as `base_url` in
   [static/admin/config.yml](static/admin/config.yml):

   ```yaml
   backend:
     name: github
     repo: hiddenfigs/hiddenfigs.github.io
     branch: main
     base_url: https://<site-name>.netlify.app
     auth_endpoint: auth
     open_authoring: true
   ```

4. **Verify:** visit `https://hiddenfigs.github.io/admin/`, click "Login
   with GitHub", authorize the app, and confirm you can open the Scientists
   collection, edit or add an entry, and that saving opens a pull request
   against this repo (`open_authoring: true` means the CMS forks the repo
   into your account and opens the PR from there — this works for any
   GitHub user, not just repo collaborators).

If step 4 fails with an auth error, double check the callback URL in step 1
is exactly `https://api.netlify.com/auth/done` and that the Client
ID/Secret in step 2 match the OAuth App from step 1.
