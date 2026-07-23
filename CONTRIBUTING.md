# Contributing

## Adding or editing a scientist entry

There are two ways to propose a scientist entry:

1. **Issue forms (recommended, no coding):** a bot turns a submitted form
   into a pull request from a branch in this repo — building the entry,
   validating it, and (if it doesn't validate) commenting on the issue so you
   can edit and have it retried automatically. You only need a GitHub account
   to open the issue; you grant no special permissions.
   - **Add** a new entry: click "Add an entry" on the homepage, or open a
     [new issue](https://github.com/hiddenfigs/hiddenfigs.github.io/issues/new?template=new-scientist.yml)
     from the "Add a scientist entry" template.
   - **Update** an existing entry: open the scientist's page (via "Update an
     entry" on the homepage → pick a scientist) and click **"Suggest an
     edit"**. That opens the "Update a scientist entry" form **prefilled with
     the entry's current data** so you edit rather than retype; the bot then
     updates that same entry file in the PR.

   (See the [Add](.github/ISSUE_TEMPLATE/new-scientist.yml) and
   [Update](.github/ISSUE_TEMPLATE/update-scientist.yml) forms,
   [scripts/issue-to-entry.js](scripts/issue-to-entry.js), and
   [.github/workflows/scientist-submission.yml](.github/workflows/scientist-submission.yml).)

2. **CMS at `/admin/` (for maintainers / power contributors):** log in with
   GitHub and edit entries through a full form with live image uploads.
   Saving opens a pull request automatically. This requests the `public_repo`
   OAuth scope (see below).

Pull requests that touch `content/scientist/` are checked against the schema
by [.github/workflows/validate-content.yml](.github/workflows/validate-content.yml)
(see [scripts/validate-scientists.js](scripts/validate-scientists.js) for what
it checks) before a maintainer reviews them.

### A note on validation for bot-created PRs

The `validate-content` check does **not** run automatically on PRs the
issue-form bot opens, and that's expected: GitHub deliberately doesn't let a
PR created with the built-in `GITHUB_TOKEN` trigger further workflows (an
anti-recursion safeguard). It's safe to merge these anyway — the bot runs the
**same** `validate-scientists.js` in its own workflow **before** it opens the
PR, and only opens one if the entry passes (otherwise it comments the errors
on the issue instead). So a bot PR existing already means the entry validated.
If you want the visible check on such a PR, you can run `validate-content`
manually from the Actions tab; on human-created PRs (the `/admin/` CMS or a
manual edit) it runs automatically as usual.

### Enabling the issue-form bot (one-time)

The workflow uses the repo's built-in `GITHUB_TOKEN` — no secret to
configure — but GitHub gates a token opening pull requests behind one
setting: **Settings → Actions → General → Workflow permissions →** check
**"Allow GitHub Actions to create and approve pull requests."** Without it,
the bot can push the branch but the `gh pr create` step fails.

The forms also apply labels (`new-scientist-submission` /
`update-scientist-submission`), but GitHub issue forms **silently drop labels
that don't exist yet** — so create them once:

```
gh label create new-scientist-submission --description "New scientist entry submitted via the issue form"
gh label create update-scientist-submission --description "Update to an existing scientist entry via the issue form"
```

The workflow also matches on the issue title prefix (`[New scientist]:` /
`[Update scientist]:`), so it still runs if a label is missing, but the labels
keep these submissions easy to find.

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
