# Contributing

## Adding or editing a scientist entry

There are two ways to propose a scientist entry:

1. **Issue form (recommended, no coding):** click "Add an entry" on the
   homepage — or open a [new issue](https://github.com/hiddenfigs/hiddenfigs.github.io/issues/new?template=new-scientist.yml)
   from the "Add a scientist entry" template — and fill it out. When you
   submit, a bot builds the entry, validates it, and opens a pull request
   from a branch in this repo. You only need a GitHub account to open the
   issue; you grant no special permissions. If the entry doesn't validate,
   the bot comments on your issue so you can edit and it retries
   automatically. (See
   [.github/ISSUE_TEMPLATE/new-scientist.yml](.github/ISSUE_TEMPLATE/new-scientist.yml),
   [scripts/issue-to-entry.js](scripts/issue-to-entry.js), and
   [.github/workflows/new-scientist-issue.yml](.github/workflows/new-scientist-issue.yml).)
2. **CMS at `/admin/` (for maintainers / power contributors):** log in with
   GitHub and edit entries through a full form with live image uploads.
   Saving opens a pull request automatically. This requests the `public_repo`
   OAuth scope (see below).

Either way, every pull request that touches `content/scientist/` is checked
automatically by [.github/workflows/validate-content.yml](.github/workflows/validate-content.yml)
(see [scripts/validate-scientists.js](scripts/validate-scientists.js) for
what it checks) before a maintainer reviews it.

### Enabling the issue-form bot (one-time)

The workflow uses the repo's built-in `GITHUB_TOKEN` — no secret to
configure — but GitHub gates a token opening pull requests behind one
setting: **Settings → Actions → General → Workflow permissions →** check
**"Allow GitHub Actions to create and approve pull requests."** Without it,
the bot can push the branch but the `gh pr create` step fails.

The issue form also applies a `new-scientist-submission` label, but GitHub
issue forms **silently drop labels that don't exist yet** — so create it
once with
`gh label create new-scientist-submission --description "Scientist entry submitted via the Add-an-entry issue form"`.
The workflow also matches on the issue title prefix, so it still runs if the
label is missing, but the label keeps these submissions easy to find.

### Why `/admin/` asks for `public_repo`

Classic GitHub OAuth scopes are account-wide by category, not per-repo, and
`public_repo` (public repos only, never private) is the narrowest scope that
still lets the CMS fork the repo and open a PR on the contributor's behalf.
It cannot be narrowed to a single repo without abandoning the browser-based
CMS. If that scope is a concern, prefer the issue-form path above, which
grants nothing.

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
