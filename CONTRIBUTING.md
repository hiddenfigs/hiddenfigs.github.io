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

3. **Tell the CMS which Netlify site to use:** the OAuth handshake is
   brokered by Netlify's API at `https://api.netlify.com` (that's the
   `base_url`), which looks up the provider by the Netlify site's domain.
   Find that site's default URL (Site settings → Domain management, looks
   like `https://<site-name>.netlify.app`) and set it as `site_domain` in
   [static/admin/config.yml](static/admin/config.yml):

   ```yaml
   backend:
     name: github
     repo: hiddenfigs/hiddenfigs.github.io
     branch: main
     base_url: https://api.netlify.com
     auth_endpoint: auth
     site_domain: <site-name>.netlify.app
     open_authoring: true
   ```

   Note: `base_url` is Netlify's OAuth API, **not** your own
   `*.netlify.app` subdomain — pointing it at the subdomain makes the
   login pop-up 404 at `/auth`.

4. **Verify:** visit `https://hiddenfigs.github.io/admin/`, click "Login
   with GitHub", authorize the app, and confirm you can open the Scientists
   collection, edit or add an entry, and that saving opens a pull request
   against this repo (`open_authoring: true` means the CMS forks the repo
   into your account and opens the PR from there — this works for any
   GitHub user, not just repo collaborators).

You do **not** need to deploy the actual website to Netlify — GitHub Pages
hosts the site. The Netlify site only has to exist as the OAuth broker.

If step 4 fails: a 404 on the `/auth` pop-up means `base_url` isn't
`https://api.netlify.com`; an auth/`site_id` error means `site_domain`
doesn't match the Netlify site where the provider is installed (step 2),
or the callback URL in step 1 isn't exactly `https://api.netlify.com/auth/done`.
