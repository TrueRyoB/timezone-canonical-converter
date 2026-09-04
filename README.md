# Canonical Timezone Converter

An MVP Greasy Fork userscript for timestamps written as `YYYY-MM-DD HH:mm JST` (or with `/` separators), or as Japanese canonical `YYYY年MM月DD日 HH:mm`. Seconds are optional. It replaces visible page text with the equivalent local time in `America/Chicago`, using `CDT` or `CST` correctly for the date.

Examples:

- `2026-09-04 18:30 JST` → `2026-09-04 04:30 CDT`
- `2026-01-04 18:30:15 JST` → `2026-01-04 03:30:15 CST`
- `2026年09月04日 20:23` → `2026年09月04日 06:23 CDT`

## Install

1. Install a userscript manager such as Tampermonkey or Violentmonkey in Chrome.
2. Create a new script and paste in `canonical-timezone-converter.user.js`, or upload that file to Greasy Fork.
3. Before publishing, replace the `@namespace` placeholder and review the broad `@match *://*/*` rule. Narrow it to the site(s) where those timestamps occur when possible.

The script ignores text fields, editors, code blocks, scripts, and styles. It also watches dynamically added page content.

## Important MVP boundary

Numeric source dates must literally be tagged `JST`; bare numeric dates are intentionally untouched. The Japanese canonical form is assumed to be JST. Japan has no DST. The target IANA zone (`America/Chicago`) is used instead of treating `CDT` as a fixed offset, so daylight saving time is handled safely.

To use another destination, change `TARGET_ZONE` in the script to an IANA zone such as `Europe/London` or `America/Los_Angeles`. This first version intentionally keeps `JST` as its one supported source format.
