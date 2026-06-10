# Deploying thecosilab.org

The site is plain static files, so hosting is free and quick. Two routes below.
Route A (Netlify) is the easiest and needs no Git. Route B (GitHub Pages) is
better if you want version control and student pull requests.

The folder is already deploy-ready: `index.html` is at the top level, and the
`CNAME` and `.nojekyll` files are set for the custom domain.

---

## Route A — Netlify drop (easiest, ~5 minutes)

1. Go to https://app.netlify.com/drop
2. Sign in (free) with email or your GitHub account.
3. Drag the entire `cosi-site` folder onto the page. It uploads and goes live
   instantly at a temporary address like `random-name-123.netlify.app`.
4. Open the site to confirm it looks right.

### Point the domain at it
5. In Netlify: Site configuration → Domain management → Add a domain →
   type `thecosilab.org` → Verify → Add.
6. Netlify shows you exactly which DNS records to create. The simplest option is
   "Use Netlify DNS" (it walks you through changing the nameservers at the
   registrar where you bought the domain). Otherwise it gives you an A record
   and a CNAME to paste into your registrar's DNS settings.
7. Wait for DNS (minutes to a few hours). Netlify issues HTTPS automatically.

To update the site later: drag the folder onto the same site's "Deploys" tab.

---

## Route B — GitHub Pages (best for team edits)

### Create the repo
1. Make a free account at https://github.com if needed.
2. Click + (top right) → New repository. Name it `cosi-site`. Set Public.
   Do NOT add a README. Click Create.
3. On the empty repo page, click "uploading an existing file."
4. Drag in the CONTENTS of the `cosi-site` folder (the individual files:
   `index.html`, the other `.html` files, `styles.css`, `figures.js`,
   `site.js`, `CNAME`, `.nojekyll`). Put the files at the repo root, not the
   folder itself. Commit.

### Turn on Pages
5. Repo → Settings → Pages.
6. Under "Build and deployment": Source = "Deploy from a branch",
   Branch = `main`, Folder = `/ (root)`. Save.
7. After a minute the site is live at `https://<your-username>.github.io/cosi-site/`.

### Connect thecosilab.org
8. Settings → Pages → Custom domain → enter `thecosilab.org` → Save.
   (The included `CNAME` file already sets this, so it may be filled in.)
9. At your domain registrar's DNS settings, add:

   Apex domain (thecosilab.org) — four A records:
   - `185.199.108.153`
   - `185.199.109.153`
   - `185.199.110.153`
   - `185.199.111.153`

   www subdomain — one CNAME record:
   - host `www` → value `<your-username>.github.io`

10. Back in Settings → Pages, wait for the domain check to pass, then tick
    "Enforce HTTPS".

To update later: edit a file in GitHub (pencil icon) or re-upload. The live
site refreshes within a minute. For student contributions, add them as
collaborators or have them open pull requests you approve.

---

## Notes
- Fonts (EB Garamond) load from Google Fonts over the internet; nothing to host.
- Before public launch, swap the placeholder content flagged on the site
  (contact email, any remaining roles), and replace the temporary EB Garamond
  with the licensed Granjon if desired.
- DNS changes can take up to 24 hours to fully propagate; an hour is typical.
