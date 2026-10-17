# Shared Chrome-style tabs for Karin Homepage and Karin Notepad

## Production

The original application Workers remain intact:

- `karin-homepage` -> `homepage.karin-lab.com`
- `karin-notepad` -> `notepad.karin-lab.com`

A **single presentation-only Worker** (`karin-chrome-tabs`) fronts both domains via two Cloudflare zone Workers Routes:

| Route | Service-binding origin |
| --- | --- |
| `homepage.karin-lab.com/*` | `HOMEPAGE` -> `karin-homepage` |
| `notepad.karin-lab.com/*` | `NOTEPAD` -> `karin-notepad` |

The proxy forwards all methods, API requests, WebSocket upgrade requests and non-HTML responses untouched. On successful HTML GET requests only, it appends an HTML `<style id="karin-chrome-tabs-v1">` element to the document's head.

**No D1/DO bindings or stored user data are modified.** The Access authentication on each domain is unchanged.

## Appearance

Chrome-inspired shared tab shape: 36px tall, 12px rounded top corners, clear selected tab integrated into the surface, understated dividers between inactive tabs, 25px circular close controls, 29px round add-tab control, abbreviated labels, keyboard focus outline and reduced motion support.

- Homepage: matches its existing navy dark layout, preserves fixed-first-column placement and desktop drag/reorder interactions.
- Notepad: matches the existing theme variables; its light and dark themes are supported and the mobile document selector remains unchanged.

No Google Chrome logo or copied proprietary UI assets are used.

## Verification

The two routes point to `karin-chrome-tabs`; the Worker source contains both service bindings and the style injection marker. End-user browser visual and behavioral acceptance testing is still advisable (including Notepad realtime sync and Homepage drag-reorder).

## Rollback

Delete the two Workers Routes (IDs recorded when deployed) without deleting either original application Worker. Their original Custom Domains continue pointing to the origin Workers, and the prior interface is restored without data migration. Do **not** delete or change the existing D1 databases or the Notepad Durable Object.

## Source

- [worker.js](./worker.js)
