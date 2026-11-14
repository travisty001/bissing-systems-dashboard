# Bissing House — public systems status

This repository hosts the **read-only, sanitized** Bissing House / AirBandB systems dashboard on GitHub Pages.

The full checker, keys, private events, device URLs, router details, and live control endpoints **are not hosted here**. They remain on Omarchy, in the private LAN checker at `/home/trav/Projects/bissing-systems-checker`.

The public `status.json` contains only pass/fail/unknown values for six general checks and five checks per guest room, plus measurement/publication timestamps. It contains no IP addresses, MAC addresses, private tokens, admin access links, filenames, or detailed local event logs.

**Freshness:** Omarchy publishes at a 10-minute interval using a user-level systemd timer; the public page labels a snapshot stale after 30 minutes without a successful publication. A displayed green state is never a real-time guarantee.

**Important:** GitHub Pages is public. Anyone with this site address can see the sanitized health states. Never add private checker files or credentials to this repository.

## Publishing

Source is `main`, served from `/(root)`. Publishing runs from the Omarchy local sync job; no inbound router port forwarding is needed.

The local publisher consists of:
- `~/.local/share/bissing-dashboard-sync/export-status.mjs` (strict allowlist; local API only)
- `~/.local/share/bissing-dashboard-sync/sync.sh` (Git push)
- `~/.config/systemd/user/bissing-dashboard-publish.service` and `.timer`

View timer with `systemctl --user status bissing-dashboard-publish.timer`.
Manually publish with `systemctl --user start bissing-dashboard-publish.service`.
Review logs with `journalctl --user -u bissing-dashboard-publish.service -n 50`.

The local checker is not changed or exposed to the internet by this site.
