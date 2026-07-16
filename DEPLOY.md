# Deploying cosilab.ucsf.edu

## Current live setup

The site is already live at https://cosilab.ucsf.edu. It is served by GitHub Pages from the main branch of the repository and uses the custom domain configured in the CNAME file and GitHub Pages settings.

Because cosilab.ucsf.edu is a UCSF subdomain, its DNS is managed by UCSF. The current setup uses a CNAME that points cosilab to midnightmd2.github.io.

### How updates work

To update the site, edit files and push to main (or merge a pull request into main). GitHub Pages rebuilds the site within about a minute. Non-developers can also update page text and upload member photos through the Pages CMS at https://app.pagescms.org.

This site is a plain static site, so deployment is simple and low-cost. The repository is already deploy-ready: index.html is at the root, and the CNAME file is set for the custom domain.

---

## Recommended approach

For day-to-day editing, GitHub Pages is the best option. It supports version control, pull requests, and collaborative updates.

For quick testing or temporary previews, Netlify is the fastest option.

---

## Route A — Netlify drop (fastest, about 5 minutes)

1. Go to https://app.netlify.com/drop.
2. Sign in with email or GitHub.
3. Drag the entire site folder into the page.
4. Confirm the preview looks correct.

### Point the domain at it
5. In Netlify, open Site configuration → Domain management → Add a domain.
6. Enter cosilab.ucsf.edu and follow the verification steps.
7. Use the DNS records Netlify provides, or choose Netlify DNS if you want the simplest setup.
8. Wait for DNS propagation, then verify HTTPS is enabled.

To update later, upload the folder again from the Deploys tab.

---

## Route B — GitHub Pages (recommended for team edits)

### Create the repository
1. Create a free GitHub account if needed.
2. Create a new repository named cosi-site and make it public.
3. Do not add a README.
4. Upload the contents of the site folder to the repository root, not inside a subfolder.
5. Commit the changes.

### Enable GitHub Pages
6. Open the repository settings and go to Pages.
7. Set Source to Deploy from a branch, choose main, and use / (root) as the folder.
8. Save the changes.
9. After a minute, the site should be available at https://<your-username>.github.io/cosi-site/.

### Connect the custom domain
10. In Pages settings, enter cosilab.ucsf.edu as the custom domain and save.
11. Add the required DNS records at the domain registrar.
12. Wait for the domain check to pass and enable HTTPS.

To update later, edit files in GitHub or open a pull request into main. The site refreshes automatically within a minute.

---

## Troubleshooting

- If the custom domain does not verify, double-check the CNAME and DNS records.
- If the site does not update after a push, wait a minute and confirm the repository branch is main.
- If HTTPS is not enabled, complete the domain verification step in GitHub Pages.
- If DNS changes seem slow, allow up to 24 hours for full propagation.

---

## Maintenance checklist

- Review page content before major announcements or launches.
- Replace placeholder text such as contact details or role names.
- Confirm that all images and links load correctly.
- Check that the site still renders well on mobile screens.
- Keep the CMS content and repository content aligned.

---

## Rollback plan

If a deployment causes problems, revert the last change in GitHub or restore the previous version of the affected files and push again. Because the site is static, rollback is usually quick and low-risk.

---

## Notes

- The site uses EB Garamond from Google Fonts, so no separate font hosting is required.
- Before public launch, replace any remaining placeholder content and consider switching from EB Garamond to the licensed Granjon if desired.
- DNS changes are often visible within an hour, but full propagation can take up to 24 hours.
