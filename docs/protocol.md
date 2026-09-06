# Measurement protocol

How to take a measurement that counts as a *fact* here. The goal is
reproducibility: another person with a scale should be able to repeat your
measurement and get close. Records store your **individual trials**, never a
pre-averaged number, so reliability can be judged later.

## The three non-negotiables

1. **State the ROM position.** Every measurement records *where* it was taken — the
   pin position, the point in the range of motion, the seat/handle setting. A
   leverage ratio without a stated measurement point is not a fact and is rejected
   by the schema.
2. **Three trials, stored individually.** Take the measurement three times and
   record each number. Don't average them yourself.
3. **State the unit.** Weight values carry `lb` or `kg`. A bare "100" is a
   market-dependent trap (a "100" plate is 100 lb in the US, 100 kg elsewhere).

## Tools

- A **hanging scale** — a crane scale or a luggage scale — rated above the load
  you'll pull. Digital is easier to read at the moment of lift-off.
- A short **strap or carabiner** to connect the scale between the handle/carriage
  and a fixed point or your pull.
- Optional: a phone to photograph the setup and the reading (a photo is great
  provenance and can double as a machine photo).

Note the scale's capacity and, if known, its calibration — put it in the
observation's `source`.

## General procedure

1. Choose and **write down the ROM position** precisely — e.g. "pin at plate 5,
   handle at full contraction, seat height 4." Be specific enough that someone else
   can reproduce it.
2. Attach the scale in line with the resistance at the point you're measuring
   (usually the handle; for starting weight, at the carriage/handle with the
   selector at its lowest).
3. Pull smoothly until the load just lifts / the scale stabilizes; read the value.
4. Repeat for **three trials**, letting the stack settle between each.
5. Record all three trials, the ROM position, the unit, your handle/scale
   `source`, the date, and a `confidence`.

## What to measure, by mechanism

The headline fact depends on how the machine loads (this is why `loading` is a
first-class field):

- **Selectorized (pin stack) → starting weight.** Set the pin to the **lowest
  plate** and measure the load at the handle, *including* the carriage and linkage.
  This is the number no manual prints. Also record `stack_max` and
  `stack_increment` if you can read them.
- **Plate-loaded / cam (lever) → leverage ratio.** Resistance felt at the handle
  ÷ the load hung on the machine, at a stated ROM point. Because a cam's whole
  purpose is a *varying* strength curve, take readings at **several ROM points**
  (e.g. stretch, mid-range, contraction) — each is its own observation, and
  together they describe the curve. One number is a lie on a good cam.
- **Cable → pulley ratio.** The ratio between the selected stack weight and the
  force at the handle (a 2:1 column delivers half the stack at the handle). Note
  the stack increment.
- **Smith → counterbalance.** The net weight of the bar (how much the
  counterweight offsets it) and the bar-path angle.
- **Assisted (pull-up / dip) → assist range.** Remember it's *inverted*: more pin
  means *less* effort. Record the assist at the top and bottom of the pin range.

## Confidence

Pick the honest one — it lets readers filter later:

- `measured` — you measured it yourself with a scale, as above.
- `manufacturer` — from an official spec/manual (cite the document).
- `estimated` — a reasoned guess or a recollection; better than a hole, flagged as
  soft.
- `disputed` — recorded because it conflicts with another observation; the
  disagreement is shown openly for a tiebreak.

## Safety

Don't load a machine past its or your capacity to get a number, don't stand under
a raised stack, and rig the scale so nothing can snap back at you. A measurement is
never worth an injury.
