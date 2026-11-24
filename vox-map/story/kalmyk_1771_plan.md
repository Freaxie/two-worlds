# The Nation That Walked Out of Russia: pre-production

1920×1080, 30 fps. Narration starts at 0.40 s, the last word ends at 34.88 s, and the 1.3 s hold runs to **36.18 s (frames 0–1085)**.
Voice: Kokoro-82M `am_michael` at speed 1.08, 83 words, 34.5 s, normalised to −16 LUFS.
Alignment: faster-whisper medium.en word timestamps, 2.4% word error rate against the script. The only "error" is "170,000" split into two tokens.

## Narration (frame = when the sentence starts on the video timeline)

| # | Beat | Frames | Line |
|---|------|--------|------|
| s1 | 1 | 12–142 | In 1771, an entire nation tried to walk out of Russia. |
| s2 | 1 | 154–242 | The Kalmyks: Buddhist herders on the lower Volga. |
| s3 | 2 | 253–304 | They answered to Catherine the Great. |
| s4 | 3 | 312–445 | Her empire curbed their khan, seized their pastures, drafted their horsemen. |
| s5 | 4 | 455–600 | So in January, Ubashi Khan led some 170,000 people east. |
| s6 | 5 | 610–728 | But the Volga never froze, stranding the clans on its west bank. |
| s7 | 6 | 739–821 | The rest marched for months, raided and starving. |
| s8 | 7 | 830–893 | Tens of thousands never reached China. |
| s9 | 8 | 907–1048 | The stranded clans are still there: Kalmykia, Europe's only Buddhist republic. |

## Fact sheet

| Claim | Source(s) | Note |
|---|---|---|
| Kalmyks (Oirat Mongols, Tibetan Buddhist herders) on the lower Volga since about 1630 | Wikipedia, *Kalmyk Khanate* and *Kho Orluk*; Britannica, *Kalmyk* | |
| Under Russian rule; Catherine II was empress from 1762 | Wikipedia, *Kalmyk Khanate* | |
| Russia imposed a council that diluted the khan's power | Wikipedia, *Kalmyk Khanate*; Kitinov, *Revue d'Études Tibétaines* 71 (2024): Russia's 1762 letter set the terms of Ubashi's government | |
| Pastures lost; Kalmyks pushed onto semi-desert and salt marsh | Tepkeev & Kabuldinov, *Oriental Studies* (2023); European Proceedings article on the causes of the migration | |
| Kalmyk cavalry mobilised for the 1768–74 Russo-Turkish war; Ubashi gathered his troops in April 1769 | Tsyuryumov, *Oriental Studies* (2022) | |
| Departure 5 January 1771; march ended 24 July 1771 | Wikipedia, *1771 Torghut migration* | Narration says only "January" and "for months", so the Julian/Gregorian question doesn't matter |
| About 169,000–170,000 set out | Encyclopedia.com (*Kalmyks*); National Palace Museum (Taiwan) Chengde exhibit | Estimates range from 150,000 to 200,000; the script says "some 170,000" |
| The Volga didn't freeze in a warm winter, stranding about a fifth on the west bank | Encyclopedia.com; Britannica: "the right-bank Kalmyk … remained in Russia" | |
| Kazakh attack near the Emba (about 15 March); clashes as they rounded Lake Balkhash from the north | Wikipedia, *1771 Torghut migration* | |
| Tens of thousands never arrived | One source gives 62,137 arrivals; another says between a third and a half perished; Baidu Baike says nearly half | "Tens of thousands" holds under every estimate |
| Kalmykia, west of the Volga, is the only region of Europe where Buddhism is the predominant religion | Wikipedia, *Kalmykia* and *Buddhism in Kalmykia* | "Buddhist republic" here means a Russian republic where Buddhism is the main faith |
| Distance tags | Astrakhan–St Petersburg is 1,906 km and Astrakhan–Kulja (Ili) is 2,606 km, both great-circle distances | Computed here |

## Map

- **Projection:** equirectangular, longitude scaled by cos 51° (the mid-latitude of the map), 150 px per degree of latitude.
- **Extent:** longitude −5° to 115°, latitude 14° to 88°, which comes to 11,330 × 11,100 px at the base level.
  - **Deviation from spec:** this is wider than the specified 7,200 px. Keeping both your zoom values (0.3 to 1.35) and the 25° margin around every shot for a story that runs from St Petersburg to China needs a map about 11,300 px wide.
  - At 7,200 px, either the close-ups would be magnified past 1:1 (soft engraving), or the margins would shrink to about 6°.
- **Coastlines:** lon/lat lists written out in the source code and traced from Natural Earth (public domain), then smoothed with three Chaikin passes.
  - The Aral Sea uses Natural Earth's historic shoreline, because the sea was full in 1771.
  - Land is clipped well beyond the map edge, so smoothing never invents coastline.
- **Rivers:** the Volga, Ural (Yaik), Don, Emba and Ili, drawn as tapered ink lines. The story depends on the Volga, so the rivers are needed.
- **Borders:** no 1771 political borders, because they can't be drawn reliably. The dashed 4 px border style is used for the approximate Kalmyk pastures in 1771 and for modern Kalmykia in the payoff.
- **Labels:** CASPIAN SEA, BLACK SEA, ARAL SEA and Lake Balkhash in italic; RUSSIAN EMPIRE, KAZAKH STEPPE and QING EMPIRE letter-spaced; St Petersburg, Astrakhan, Volga and Ili.
- **Featured region:** the 1771 Kalmyk pastures, approximate: Saratov to the Caspian, from the Manych and Kuma in the west to the Yaik in the east.

## Beats and elements (frames)

1. **Home (0–247).** The camera opens on the lower Volga at zoom 0.72.
   - f17: ransom "1771" slaps on, one letter every 3–4 frames.
   - f159 ("Kalmyks"): a halftone herder cut-out slaps on beside the Volga.
   - f226 ("Volga"): yellow multiply paint sweeps south to north over 16 frames.
2. **The other side (248–311).** The camera pulls out to zoom 0.34 over f248–272.
   - f262–276: a dashed arc runs from Astrakhan to St Petersburg, then the yellow tag "1,906 KM" slaps on.
   - f279 ("Catherine"): a generic crowned empress cut-out is pinned at St Petersburg, and an ink circle is drawn f286–298.
3. **Causes (312–447).** Each arrow is drawn over 12 frames with a 26 px head, and each gets a dated tag.
   - f331 ("curbed"): an arrow from St Petersburg to the khan's camp, tagged "1762".
   - f372 ("seized"): an arrow pushing south from Saratov into the pastures, tagged "1760s".
   - f414 ("drafted"): an arrow from the Volga to the Caucasus front, tagged "1769". A horseman cut-out rides along it f418–445, wobbling ±4°.
4. **Exodus (448–605).** The camera zooms to 1.35 on the Volga over f448–472. Beat 2–3 elements are removed during the move.
   - f468 ("January"): title card "January 1771" with a FIG. 04 tag, typed at 1 letter per frame.
   - f502–526: yurt, camel, cart and khan cut-outs drop in one by one.
   - f538 ("170,000"): ransom "170,000" with two ink splashes.
   - f585 ("east"): a short arrow pointing east.
5. **The river (606–746).** The camera holds.
   - f629 ("never froze"): marker note "the river never froze", written at 1.3 letters per frame.
   - f667 ("stranding"): a west-bank herder cut-out slaps on.
   - f707 ("west bank"): an ink circle is drawn around the west-bank group.
6. **The march (747–829).** On "marched" (f751) the camera pulls wide to zoom 0.50 over f747–771, and the beat 4–5 elements are removed.
   - A dashed trail runs Volga → Yaik → Emba → Turgai → north of Balkhash → Ili.
   - The caravan cut-out travels it f757–815, with smoothstep easing and ±4° wobble.
   - Tag: "JAN–JUL 1771".
   - *Adaptation:* the caravan replaces the "document" from the template, because nothing in this story is posted.
7. **Losses (830–899).** The camera holds.
   - f832: ink X with tag "EMBA 1771", drawn over 6 frames.
   - f848: ink X with tag "BALKHASH 1771".
   - f878 ("China"): the caravan at the Ili is swapped for a thinned, weary version. This is the template's "defeated version", moved earlier.
8. **Payoff (900–1085).** The camera pulls out to zoom 0.30 over f898–922.
   - f941 ("still there"): a dashed border of modern Kalmykia is drawn on the west bank.
   - f970: ransom "KALMYKIA".
   - f975: marker note "still there".
   - f995: a beige sheet slaps on at bottom centre: **"Europe's only Buddhist republic: Kalmykia."**
   - f1027: a yellow highlighter swipe under "Kalmykia".
   - The frame holds to f1085.

## Camera keyframes (frame, lon, lat, zoom)

Easing is smoothstep, zoom is interpolated logarithmically, and moves are stepped on twos.

| Frame | Lon | Lat | Zoom | Shot | Visible lon / lat |
|---|---|---|---|---|---|
| 0 | 46.8 | 47.6 | 0.72 | Lower Volga | 32.7–60.9 / 42.6–52.6 |
| 248→272 | 50.0 | 51.9 | 0.34 | St Petersburg and the Volga | 20.1–79.9 / 41.3–62.5 |
| 448→472 | 46.6 | 47.4 | 1.35 | Both banks of the Volga | 39.1–54.2 / 44.7–50.1 |
| 747→771 | 63.5 | 46.6 | 0.50 | The route to the Ili | 43.2–83.9 / 39.4–53.8 |
| 898→922 | 55.0 | 51.0 | 0.30 | Whole story | 21.1–88.9 / 39.0–63.0 |

There are 5 moves of 24 frames each, one every 1–2 sentences. Every shot keeps at least 24–26° of map beyond the frame edges, inside a map that spans −5° to 115° and 14° to 88°.

## Sound plan

- **Music:** a synthesized ambient bed in D minor, made from a low drone, a bowed-fifth pad and a sparse plucked motif. It ducks under the voice.
- **Sound effects:** synthesized paper slaps, marker scratches, typewriter ticks, a brush sweep for the paint, whooshes on the five camera moves, ink scratches for circles and Xs, and paper flutter for the caravan.
- **Mix:** effects at about 0.32× the voice peak, hits of the same type merged within 3 frames, master peak at −0.3 dBFS, AAC at 192 kbps.
