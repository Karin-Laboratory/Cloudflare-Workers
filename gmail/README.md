# Gmail Mirror

Cloudflare Worker `karin-gmail-mirror` running at gmail.karin-lab.com. Source in `main/gmail` and build watches `gmail/**`.

**Security:** Never commit personal email or Google OAuth secrets. `OWNER_EMAIL` is a Worker runtime secret; `TOKEN_KEY` is also secret. `ACCESS_AUD` and `ACCESS_TEAM` are maintained only in Cloudflare runtime configuration, as are Google OAuth credentials. Deploy with `--keep-vars`. OAuth state is in the existing KV `AUTH` and must not be replaced.

The original source's embedded email address was moved into the `OWNER_EMAIL` secret, and the static page label was anonymized; other application logic remains from the deployed code.

Cloudflare Workers Builds: connected to `Cloudflare-Workers/main`, production root `/gmail`, watch `gmail/**`. Deployment changes in this directory only. Migration validation: 2026-10-11.
