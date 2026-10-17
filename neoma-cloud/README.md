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


## ChatGPT / ちゃっぴぃ individual note access (2026-10-17)

All **browser vault** Markdown notes are indexed in D1 table `neoma_note_index` by `(vault_name, path)` with the full body, SHA-256 content hash and modification time. This is derived data; immutable gzip JSON snapshots in R2 remain canonical, with `neoma_cloud_state` and `neoma_cloud_versions` tracking revisions.

ChatGPT with the connected Cloudflare app needs **no website OTP or extra service token**: account-authorized D1 APIs can read rows and enqueue create/update operations. The browser and third-party callers of `/__cloud/notes` (list/search) and `/__cloud/note` (GET/POST) still require a **verified Cloudflare Access JWT**. Never expose these endpoints publicly.

### Read/search

Query `SELECT vault_name,path,content,content_hash,modified_at FROM neoma_note_index WHERE vault_name='Karin-Lab' AND path=?` (bind the path). To search, use `WHERE vault_name=? AND (path LIKE ? OR content LIKE ?)` with bound parameters.

### Create or update

**Do not directly UPDATE `neoma_note_index`**, because it is a derived read index. Instead INSERT a row into `neoma_note_jobs` using bound parameters: `(vault_name,path,action,content,expected_hash,created_at)`.

- `action='create'`: set `expected_hash='__absent__'`. Fails safely if the path already exists.
- `action='update'`: set `expected_hash` to the existing `neoma_note_index.content_hash` read immediately before the edit. Conflicting changes are refused.
- Allowed paths are relative `*.md` paths without hidden, empty, `.`, `..` or backslash segments.
- Max 200,000 JS string code units per note (subject also to the original 30 MiB whole-vault snapshot cap).

Use `SELECT id,status,detail,applied_revision FROM neoma_note_jobs WHERE id=?` to check the result. Status is `pending`, `applied`, `conflict`, or `rejected`. Do not report a write as successful until `applied` is confirmed.

The Worker reconciles jobs in order via `reconcileNotes`. It first compares the expected hash against the latest index, then creates an immutable new gzip snapshot in R2 and advances D1 state with a compare-and-swap on the whole-vault revision; finally it rebuilds the note index. The original snapshot is retained. A cron trigger runs every minute; authenticated reads of `/__cloud/meta` also reconcile, so an open browser usually sees changes sooner. A different device's edit cannot be silently overwritten: a stale operation becomes `conflict`, and browser pollers detect updated snapshot revisions and offer to reload.

### Browser API

- `GET /__cloud/notes?vault=Karin-Lab&q=term`: matching note titles and hashes.
- `GET /__cloud/note?vault=Karin-Lab&path=<URI-encoded-path>`: full Markdown and hash.
- `POST /__cloud/note` with JSON `{"vault":"Karin-Lab","path":"Note.md","action":"create","content":"# Note","expected_hash":"__absent__"}`; for update supply `action:"update"` and the previously read `content_hash`.

These routes are behind Cloudflare Access, and direct ChatGPT operations should use the connected Cloudflare D1 interface rather than attempting to bypass the JWT.

### Operational note

The index is refreshed by the scheduled worker and the website meta endpoint. A new D1 job may remain `pending` until reconciliation runs. If the owner is editing the same page concurrently, do not retry a `conflict` blindly; re-read the current note and reconcile the intended edit.

## Limitations

- Live browser login/functionality and PWA behavior require an authenticated browser smoke test after deployment. Merely confirming the Cloudflare API configuration does not prove them.
- Snapshot storage remains whole-vault and per-account; the D1 per-note index enables selective read/edit operations without changing the on-disk snapshot format.
- Offline edits and simultaneous edits are **not** automatically merged. If synchronization fails, export a local safety copy before reloading.
- Browser-specific File System Access handles are not portable and deliberately excluded. This solution targets Neoma *browser vaults*.
- The 30 MiB snapshot limit means very large attachments are out of scope. Consider per-file R2 objects for larger vaults.
- Browser site data must not be cleared until at least one cloud snapshot is confirmed.

## Rollback

Remove only the route `neoma.karin-lab.com/*` from the zone's Workers Routes. This immediately sends traffic back to the unchanged original Worker via the existing Custom Domain. Do not delete the R2 bucket or D1 tables.

## Source

Upstream Neoma: https://github.com/infinitumio/neoma (AGPL-3.0-or-later). Follow upstream license obligations for derivative redistributions.
