# Studio Sites — studioinc

Booking websites for recording studios. One repo, three parts:

- `demo/` — Amplitude Studios, the generic Moovit-type booking demo. Placeholder rates (Studio A $95/hr, B $65/hr, Podcast Suite $55/hr; Mixing $350/song, Mastering $75/song, Mix+Master $399/song). Every real build reskins it with the client's real rates. Has a pinned "Need a site like this?" tab linking to the checkout.
- `checkout/` — Studio Sites, the payment site. Locked offer: Starter $2,499 / Pro $3,499 / Premium $3,999, 50% deposits ($1,249 / $1,749 / $1,999) via Jim links (popup, never iframe). Care $70 / $150 / $200/mo by package, first month free. Timelines from intake return: 7 / 14 / 30 days. Guarantee: "We fix it until you're happy — and you don't pay the final balance until you are."
- `automation/` — the sales kit: NEPQ closing script, guided demo walkthrough, and the 10 approved sample openers.

## Deploy (Cloudflare Pages)

Two Pages projects from this one repo, preset None, no build command:
- Demo project — output directory `demo/`
- Checkout project — output directory `checkout/`

## What is NOT in this repo — on purpose

- The prospect tracker (`STUDIO-TRACKER.csv`, 95 studios) and the nationwide prospect list stay local only. They contain prospect emails and phone numbers, so they never go into a public repo.
- The Univerxity named demo is a separate one-off prospect demo and is not in here.
- No keys, tokens, or passwords. The Jim payment links in `checkout/index.html` are the public amount-based payment links, same as the live Moovit Sites checkout.

## Workflow

NEPQ opener (email / IG / text) → reply handling → guided demo walkthrough (one message, one step, one question) → debrief → commitment → checkout link for the package they chose → build only on confirmed payment + intake. Follow-ups: day-3 bump, day-7 breakup, then stop.
