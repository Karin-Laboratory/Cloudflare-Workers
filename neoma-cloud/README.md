# Karin Neoma Cloud Sync

Cloudflare Worker proxy that places Neoma's existing web UI in front of cloud-backed browser-vault state. The original Worker `karin-neoma` and its existing `/api/vaults` legacy snapshot API are preserved.

## Deployment

- Worker: `karin-neoma-cloud`
- Route: `neoma.karin-lab.com/*`
- Origin Custom Domain: `neoma.karin-lab.com` -> `karin-neoma`
- Bindings: `UPSTREAM` (service -> karin-neoma), `DB` (D1 karin-neoma), `BUCKET` (R2 karin-neoma)
- Cloudflare Access: `Karin Neoma Private`, owner-only email OTP.
- Public `workers.dev` hostname for proxy is **disabled**.

## Storage and authentication

All browser-vault records in the IndexedDB `neoma` stores `vaults`, `files`, `folders`, `trash` and same-origin localStorage preferences are snapshotted to R2. D1 `neoma_cloud_state` stores the current object key, revision, digest and timestamp. D1 `neoma_cloud_versions` provides the revision history. Browser IndexedDB remains a *local cache/editing adapter*, not the only durable copy.

The client script runs before Neoma's main module, restores R2 data before UI startup and watches IndexedDB write transactions/localStorage changes. All writes compare the D1 revision (optimistic concurrency control). Concurrent remote edits trigger a conflict notice rather than silently overwriting. Snapshot contents are gzip-compressed in R2; the payload size cap is 30 MiB *before compression*.

Cloud endpoints `/__cloud/meta`, `/__cloud/state` (GET/PUT), and `/__cloud/client.js` validate the signed Cloudflare Access JWT and audience on every call; the website's Access OTP gate remains unchanged.

## First-use check

1. Force reload the Neoma tab (Ctrl+Shift+R) to bypass the previous PWA service worker. The boot code unregisters that old worker.
2. View or import the `Karin-Lab` ZIP. If the existing browser vault is already present, the first boot may upload it automatically. **Check the note list before reimporting to avoid duplicates.**
3. Verify D1: `SELECT revision, size, updated_at FROM neoma_cloud_state WHERE owner = 'karin-lab';`
4. Confirm R2 objects under `cloud/state/` and repeat from a second browser profile/device. Changes should appear after choosing to reload.

## Limitations

- Live browser login/functionality and PWA behavior require an authenticated browser smoke test after deployment. Merely confirming the Cloudflare API configuration does not prove them.
- The remote snapshot is per-account, not per-note. It stores all browser vaults belonging to this single-owner hostname.
- Offline edits and simultaneous edits are **not** automatically merged. If synchronization fails, export a local safety copy before reloading.
- Browser-specific File System Access handles are not portable and deliberately excluded. This solution targets Neoma *browser vaults*.
- The 30 MiB snapshot limit means very large attachments are out of scope. Consider per-file R2 objects for larger vaults.
- Browser site data must not be cleared until at least one cloud snapshot is confirmed.

## Rollback

Remove only the route `neoma.karin-lab.com/*` from the zone's Workers Routes. This immediately sends traffic back to the unchanged original Worker via the existing Custom Domain. Do not delete the R2 bucket or D1 tables.

## Source

Upstream Neoma: https://github.com/infinitumio/neoma (AGPL-3.0-or-later). Follow upstream license obligations for derivative redistributions.
