# Art preference: 1024-image R2 implementation (2026-11-07)

## Truthful status and scope

The v0.4 public preview still contains 32 ORIGINAL TEST SVGs until the integration readiness gate has passed.
The new code is on \`feature/art-1024-r2-20261107\`, not \`main\`. The R2 data ingestion is ACTIVE.
Do not label the new catalog as “world popularity top 1024”: it is currently a transparent deterministic sample of public-domain paintings from the Cleveland Museum of Art, using fixed accession-page permutation to broaden coverage. World popularity scoring, multi-museum coverage and independent recommendation accuracy are NOT established.

## Components

- R2 bucket: \`karin-art-images\` (pre-existing, dedicated collection prefix).
- Cloudflare Queue: \`karin-art-acquire-v1\`. Consumer: Worker \`karin-art-acquirer\`.
- Live site Worker: \`karin-art-preference\`; custom domain \`art.karin-lab.com\`.
- Progress: \`GET https://art.karin-lab.com/api/status\`.
- Ingested images: \`art-preference/cma-v1/images/cma-<id>.jpg\`.
- State: \`art-preference/cma-v1/build-state.json\`.
- Frozen catalog (only once 1024 verified JPEGs): \`art-preference/cma-v1/catalog.json\`.
- Frozen features: \`art-preference/cma-v1/features.json\`.
- Integration marker (created only after matching IDs/image SHA): \`art-preference/cma-v1/ready.json\`.
- Public access: \`GET /img/cma-<id>.jpg\`, \`GET /api/catalog\`, \`GET /api/features\`.
- Passive feedback: \`POST /api/events\`, stored as immutable-ish event objects at \`art-preference/feedback/YYYY-MM-DD/<UUID>.json\`.
- Code: \`index-v1.html\`, \`app-v1.js\`, \`recommender-v1.mjs\`, \`site-worker-r2.mjs\`.

## Completion gate

1. R2 state has 1024 valid CC0 painting images and zero unresolved integrity mismatches.
2. Catalog has 1024 unique museum artwork IDs, source URLs and SHA256 of actual stored bytes.
3. GitHub Actions \`art-1024-features.yml\` uses OpenCLIP+PCA to generate fixed 1024 features and records the source image hashes, publishing \`data/features-v1.json\` on the feature branch.
4. Queue \`sync-features\` independently checks every feature's painting ID and SHA against R2 catalog, copies features to R2 and writes ready marker.
5. Site automatically switches from safe frozen v0.4 preview to pinned tested v1 UI only after the ready marker exists. No live external museum calls on site page loads.
6. Unit CI \`art-1024-unit.yml\` must PASS, and separately confirm live URL in real browser for 8 clicks plus 3 recommendations. Unit CI is not proof of real-browser operation.

## UX specification

Eight selections, *only two paintings* shown at a time, names hidden. Foreground elapsed time measured after both image assets decode. Algorithm deterministic. No user data train model for other people. Every completion returns 3 not-previously-displayed works.

The results show 5 ratings per work, directly clickable without any submit button; rating changes, first judgement latency and number of changes are logged. No answer is a legitimate recorded state, not missing data to impute. A pagehide event means only that the browser emitted pagehide; it does not prove explicit tab closure. Browser sending is best-effort, with queued local retries where possible.

## Statistical caveats

Eight clicks cannot independently establish each visitor's left/right effect; initial correction is NONE and positions are deterministically counterbalanced. Two-level log decision-time weighting is experimental, not validated as preference strength. OpenCLIP image features and 6 interpretable measurements do NOT imply verified predictive accuracy. Comparison to no-time model, no-position model, and random recommendations must precede a validated diagnosis claim.

## Recovery

If image import stops, inspect \`/api/status\` and R2 build-state, identify source failures rather than blindly replaying. The queue consumer and R2 paths are application-scoped. Source code for the importer is \`scripts/ingest-cma-r2-worker.mjs\`. The importer stores each image hash and per-batch resume state.
GitHub branch and worker versions must be kept pinned. Do not modify unrelated Cloudflare Workers, existing cron triggers, or other R2 buckets.

## Additional work to satisfy original full scientific spec

- Replace provisional CMA accession-sample corpus with a defensible popularity-ranked 1024, ideally drawing from multiple museums, and document how global popularity was measured.
- Independently evaluate held-out likeability for unseen paintings and the accuracy of post-result ratings.
- Confirm license conditions for every displayed file and fully test in a real browser.
- Do not promote the status to scientifically validated until evidence exists.
