# النميمة / الغيبة — cinematic reel

A polished vertical cut of the uploaded 30-second clip: 1080×1920, 30 fps,
45.4 s, Arabic male voice-over, cinematic sound design, **no music**.

## What the source contains

The uploaded clip is a flat illustrated piece with five continuous segments and
its own Arabic captions. Nothing here is regenerated — every frame you see is
the original artwork, re-cut and re-graded.

| Source time | Segment | Its own on-screen Arabic |
|---|---|---|
| 0.00 – 4.65 s | three men, the middle one whispering behind his hand | `هلق عم تاكل لحم …` |
| 4.67 – 9.30 s | the man in the white thobe speaking to the other two | `قاعدين تحكوا عن فلان وهو غايب` |
| 9.30 – 19.37 s | dark blue geometric card carrying the hadith | `سُئل رسول الله ﷺ: أتدرون ما الغِيبة؟ قالوا: الله ورسوله أعلم. قال: ذِكرك أخاك بما يكره` |
| 19.37 – 24.82 s | the man in the white thobe, palm raised | — |
| 24.83 – 30.00 s | empty light-blue frame | — |

The hadith is Sahih Muslim 2589. **It is never re-typeset**: the hadith the
viewer reads is the source video's own artwork. The only thing added over it is
the attribution line. No Qur'anic verse or hadith is invented, paraphrased or
altered anywhere in this build.

## The cut

`src/timeline.ts` is the single source of truth. Each scene walks the source
forward, so the original order is preserved and no segment is replayed.

| Out | Scene | Source | Added |
|---|---|---|---|
| 0.0 – 6.2 s | Hook | 0.00 – 4.65 s @ 0.75× | `كلمة واحدة منك… / قد تأكل حسناتك.` low in frame, low impact on frame 0 |
| 5.7 – 11.0 s | Talking about someone absent | 4.67 – 9.30 s @ 0.88× | — (the source carries its own caption) |
| 10.5 – 24.9 s | **Hadith** | 9.30 – 19.37 s @ 0.703× | `حديث صحيح — رواه مسلم ٢٥٨٩` |
| 24.4 – 30.3 s | How would it feel said of you | 19.37 – 24.82 s @ 0.93× | — |
| 29.8 – 33.7 s | Your tongue | 24.83 – 26.80 s @ 0.5× | `لسانك… إمّا لك أو عليك.` |
| 33.3 – 42.9 s | Closing question | 26.80 – 30.00 s @ 0.33× | `قبل أن تتحدث عن شخصٍ غائب… / اسأل نفسك: / هل ترضى أن تأكل لحمه؟` |
| 42.3 – 45.3 s | Closing card | — | `احفظ لسانك.` / `في أمان الله` |

Scenes overlap by ~14 frames, so every join is a cross-dissolve rather than a cut.

## Character animation

The source characters are drawn perfectly still. `scripts/grade.sh` masks each
figure — and the gesturing hand in the scenes that have one — with a feathered
ellipse and nudges that region by 2–4 px on two slow, out-of-phase sine curves.
That reads as breathing and small posture shifts without redrawing anyone: no
face is added to a faceless character, no limb is regenerated, no body is
distorted. Motion is gated to the two segments with people on screen, so the
hadith card never moves.

Verified by measuring per-region drift on a grain-free grade: 1.5–2.3 (figures)
against 0.05 (sky) and 0.29 (floor).

On top of that, every scene gets a slow push-in and a drift, which is what keeps
still artwork from reading as a slideshow.

## Voice-over

Eleven lines of Modern Standard Arabic, all from one Higgsfield preset voice
("Arthur", male). No real person's voice is cloned. The three lines carrying the
hadith are slowed to 0.94× so the Prophet's ﷺ words are delivered more calmly
and slightly slower than the rest.

## Sound design

`scripts/make_sfx.py` synthesises everything from noise and impulses — there is
no melody, no chord, no tempo and no loop anywhere in the mix:

| | |
|---|---|
| `ambience.wav` | low-passed pink noise with a slow breathing envelope |
| `impact.wav` | sub sine dropping 58 → 26 Hz plus a short body transient |
| `whoosh.wav` | band-passed air, centre gliding 380 → 2600 Hz |
| `riser.wav` | rising band-passed air, cut short at the top |
| `cloth.wav` | high band noise burst for a posture shift |
| `tick.wav` | very light tick under a key Arabic word |

No footsteps: nobody walks in the source.

## Delivery

Loudness is normalised to −14 LUFS with a −1.5 dBTP ceiling and a limiter, so
the mix is at platform level with no clipping. Text sits inside a 330 px bottom
and 96 px side safe area.

## Building

Needs ffmpeg, node and Chromium. In the Higgsfield sandbox:

```sh
bash scripts/build.sh
```

It fetches this project and the source clip, generates the masks, grain and
sound effects, runs the grade, pulls the narration from its permanent generation
URLs, renders with Remotion and masters the audio into `out/nameema-final.mp4`.
