# Focusly — design direction

Direction for UI work in this project. antislop filters slop; this file supplies the
direction it filters toward. If antislop flags something here, it names the rule and asks,
it does not overrule.

## What the product is

A phone-shaped web app that turns focus time into duck companions. Someone starts a
timer, the app bank screens (simulated) into a pocket of minutes, and progress shows up as
ducks: eggs, levels, energy, a battle, a trophy road. Same engine and roster as the iOS
prototype at github.com/thedarklarper/Focusly.

## The feeling to hit

Warm, paper-and-gouache, slightly toy-like. A pond-side notebook, not a productivity
dashboard. It should read as a small crafted game with a utility inside it, never as a
SaaS panel with cartoon stickers applied. Soft edges, flat fills, no glass, no neon, no
gradient mesh. Nothing glossy or metallic.

## Tokens (already in `src/app/globals.css` and `C` in `src/components/ui.tsx`)

- Navy `#16253D` — all text, and the darkest surface. Never replace with near-black.
- Cream `#FFF9EF` — page background.
- Marigold `#F8C84A` — primary action, the one loud color. One per screen.
- Pond green `#62B58A` — progress, growth, meters.
- Skyblue `#9ED9F4` — secondary surfaces and inactive/secondary actions.
- Coral `#F2815A` — warnings, streaks at risk, battle danger. Not decoration.
- Lilac `#9B8AFB` — rare or special ducks, trophies.
- Hairline `#E8E0D2` — borders and dividers. Muted `#718096` — eyebrows, captions.

New colors need a job. Do not add a color to give a card personality.

## Type

Geist Sans everywhere, from `next/font/google`. Headlines are black weight with tight
tracking and small sizes (29px screen titles, 44px for a single hero number). Body sits at
13 to 15px. Eyebrows and section labels are 11px, uppercase, black weight, 1.4 to 1.6px
letter spacing. Numbers that matter are the biggest thing on their card.

## Shape and space

Phone frame is `max-w-[480px]`, centered, cream, with page padding `px-5 pt-5 pb-10`.
Cards are white, `rounded-[24px]`, `p-[18px]`, and carry one soft shadow
(`0 5px 12px rgba(32,48,74,0.07)`). Controls are `rounded-[18px]`: buttons, icon chips, the
tab switch. Pills are `rounded-[14px]`. Stick to this radius family; do not invent a 6px
corner anywhere.

Vertical rhythm comes from `mb-3.5` between cards and `mb-[18px]` under a header. Cards
stack in one column. Two columns only for dense stat grids, never for primary content.

## Motion

Short and physical: `active:scale-[0.98]` on press, 300ms ease on meter width, nothing
looping in the background. Rewards get one clear beat (a hatch reveal, a number landing),
then stop. No ambient float, no shimmer, no confetti that keeps running.

## Copy

Plain, warm, specific. "Less scroll. More soul." "TODAY'S POCKET." "screen time collected
this week." Short sentences, real nouns, no exclamation marks stacking up.

Banned, permanently: "Unlock the power of", "Elevate your", "Supercharge",
"AI-powered" anything, "seamless", "effortless", "revolutionary", "Take control of your
digital wellbeing", sparkle emoji as a UI element, and invented metrics or testimonials of
any kind.

## The honesty rule

The browser cannot see real app usage or block apps. Any screen that claims protection,
screen time, or distraction blocking must say it is a simulation, in plain words, near the
control that does it. This is not a disclaimer to bury; it is part of the product's voice.
Same for sync: it is a single-device snapshot, so do not imply multi-device sync exists.

## Duck art

Sprites live in `public/ducks/*.png` and render through `DuckArt`. Do not redraw, crop, or
recolor them with CSS filters. Give each one a flat colored plate behind it
(`rounded-[18px]`, marigold or skyblue) instead of a shadow or outline.

## Known contrast failures (measured, not guessed)

Checked with `.cline/skills/antislop-human/contrast-check.py`. Fix these when touching the
relevant screen; do not ship new text on top of them.

- Muted `#718096` on cream `#FFF9EF` is 3.83:1 and on white is 4.02:1, both under the 4.5:1
  small-text floor. It is used for eyebrows, section labels, and captions, which are
  uppercase 11px, so they are small text and they fail. Use `#5C6B7F` instead (5.19:1 on
  cream, 5.43:1 on white) or keep `#718096` only at 18px+ or bold 15px+.
- Cream `#FFF9EF` on pond green `#62B58A` is 2.36:1. Never put cream text on a green meter
  fill or green button. Navy on green is the pairing to use.
- These pass and should not be second-guessed: navy on marigold 9.77:1, navy on skyblue
  10.02:1, navy on coral 5.90:1.

## What Focusly is not

Not dark mode by default. Not a landing page. Not a marketing site. No hero section, no
testimonial row, no pricing tiers, no "trusted by" strip. The app opens on the timer.
