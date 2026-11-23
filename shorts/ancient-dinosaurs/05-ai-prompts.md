# 05 · AI Image and Video Generation Prompts

**Workflow:** generate a **still keyframe** with an image model, then animate it with an **image-to-video** model. Image-to-video gives far more control and consistency than text-to-video. The prompts are written to work with current image models (Midjourney, Flux, Imagen, etc.) and image-to-video models (Runway, Kling, Veo, Sora, etc.). Adjust the syntax to your tool.

- **Aspect:** 9:16 vertical. Midjourney: `--ar 9:16 --style raw`, stylize at 50–150.
- **Clip length:** generate 5 s and cut to 2–4 s. Motion is most stable in the first 3 s.
- **Frame rate:** conform everything to 24 fps.
- **Upscale** the stills to at least 2160 × 3840 before animating if the tool allows it.

## 1. Style bible (prefix this to every image prompt)

> cinematic documentary film still, vertical 9:16 composition, shot on ARRI Alexa 35 with vintage anamorphic lens, natural motivated light, deep shadows, earth-tone palette of umber, ochre, sandstone and charcoal, dusty gold highlights, low-contrast highlights with rich blacks, subtle 35mm film grain, gentle halation, atmospheric dust in the air, realistic textures, restrained color, photorealistic, National Geographic documentary realism

## 2. Global negative prompt

> cartoon, illustration, 3d render look, plastic, glossy, toy dinosaur, theme-park dinosaur, oversaturated colors, teal and orange grade, HDR, lens-flare overload, fantasy armor, glowing eyes, magic effects, text, letters, captions, watermark, logo, signature, hieroglyphs, inscriptions, extra fingers, deformed hands, modern clothing, sunglasses, wristwatch, plastic props, smooth clean bones, symmetrical perfect skeleton display

## 3. Recurring character: "THE WANDERER"

Use the same description (and a character reference image or seed, if your tool supports it) in P01, P03, P08 and P09.

> a weathered ancient traveler, adult, face mostly hidden in the shadow of a hood, sun-darkened skin, rough hands, an undyed coarse wool tunic belted with a leather cord, a heavy dark-brown wool cloak with a deep hood, leather wrap sandals, a worn wooden staff, a small leather pouch at the hip, no jewelry, no armor; timeless rather than tied to one specific culture

*Why timeless:* the Wanderer stands for "an ancient person" in general. Tying them to one culture would imply that this specific people found this specific fossil, which we can't claim.

## 4. Fossil look (applies to every fossil shot)

> real fossil bone: dark chocolate-brown to grey-black permineralized bone, cracked and fractured, partly encased in tan sandstone matrix, mineral staining, rough weathered surface, broken ends, heavy like stone

---

## 5. Shot prompts

### P01 · Wanderer's feet on badlands (S01)
**Image:**
> [STYLE BIBLE] extreme low-angle ground-level shot of leather-sandaled feet of [WANDERER] walking across cracked wind-scoured sandstone badlands at last light, low golden sun raking from the left, long shadows, fine dust lifting from each step, eroded ridges blurred in the background, shallow depth of field

**Motion:**
> the camera tracks low and slowly forward alongside the walking feet; dust puffs with each step; wind carries sand grains across the ground; subtle handheld drift; at the end the camera begins to tilt down toward the ground

### P02 · Through the ground to the buried skeleton (S02)
**Best method:** a 3D scene (Blender): a layered strata box, a downloaded CC-licensed theropod skeleton model with a fossil shader, and a camera crane-down. **AI method:** generate the cross-section still, then animate a vertical move.

**Image (the end frame):**
> [STYLE BIBLE] geological cross-section cutaway view of the earth, a thin surface line at the very top with a tiny hooded human silhouette standing on it against a dusk sky, below it many horizontal photoreal rock strata in tan sandstone, grey mudstone, red siltstone and dark shale, and deep below, embedded horizontally in rock, a complete articulated large theropod dinosaur skeleton in dark mineralized fossil bone, dramatic side light, museum-quality realism, scale contrast between the tiny human and the deep skeleton

**Motion:**
> the camera descends vertically from the surface down through the rock layers, the strata rushing upward past the lens, decelerating smoothly and stopping on the buried skeleton; faint dust and particulate in the light

### P03 · HERO: Wanderer beside the giant femur (S07 and thumbnail base)
**Image:**
> [STYLE BIBLE] wide shot at dusk, [WANDERER] standing small at the foot of a towering eroded sandstone cliff, from which an enormous dinosaur thigh bone nearly two meters tall and a row of huge vertebrae are weathering out, only partly exposed, [FOSSIL LOOK], wind blowing sand, deep blue-grey dusk sky with the last band of gold light on the horizon, the traveler's torch casting warm light on the bone, strong sense of scale and mystery, rule-of-thirds vertical composition with the figure in the lower third

**Motion:**
> slow pull-back and slight crane up revealing the full height of the cliff and the scale of the bone; wind ripples the cloak; sand drifts off the exposed fossil; torch flame flickers

### P04 · Linen-wrapped fossil bones, Egyptian tomb (S11), RECONSTRUCTION
**Image:**
> [STYLE BIBLE] close shot inside a torchlit rock-cut tomb in ancient Egypt, two hands carefully wrapping dark heavy fossil bone fragments in strips of coarse undyed linen on a stone ledge, [FOSSIL LOOK], warm flickering torchlight, deep shadow, in the far out-of-focus background a stylized carved relief of a Set-animal head with no legible inscriptions, dust in the air

**Motion:**
> slow push-in from the hands to the linen bundle; the hands tighten the wrap; torch shadows flicker across the stone

### P05 · Augustus's villa on Capri, "bones of giants" (S12b), RECONSTRUCTION
**Image:**
> [STYLE BIBLE] interior of a cliff-top Roman villa niche at dusk, enormous dark fossil limb bones and a huge fossil tooth arranged on a stone shelf as curiosities, a bronze oil lamp in the foreground, painted Roman plaster walls in muted red and ochre, an open colonnade behind with the Mediterranean sea glowing at twilight, quiet and reverent, no people, no text

**Motion:**
> rack focus from the oil-lamp flame to the giant bones; the lamp flame flickers; a faint sea breeze stirs a curtain

### P06 · Carcass decay vs burial, Cretaceous floodplain (S16)
**Image:**
> [STYLE BIBLE] overhead aerial view of a Late Cretaceous river floodplain under an overcast sky, the scattered weathered bones of a large dinosaur carcass on cracked mud, ferns and conifer debris, and nearby a second carcass half-covered by fresh grey flood silt, muted natural colors, documentary realism, no living animals in frame

**Motion:**
> time-lapse: the exposed bones bleach, crack and crumble away to nothing as plants grow over them, while muddy floodwater flows over the second carcass and covers it completely with silt; the camera descends slowly from above

### P07 · Layers bury the skeleton and the camera rises to today (S17)
**Image (start frame):**
> [STYLE BIBLE] geological cross-section, a dinosaur skeleton freshly buried in grey river silt, thin layers above it, side-lit cutaway, photoreal rock textures

**Motion:**
> sediment layers stack one after another on top of the skeleton, compressing it; the camera then rises fast vertically through hundreds of meters of layered rock, including a pale marine limestone band and a black coal seam, and breaks through to a modern grassy farm field at the surface under a grey sky

*(If the AI output is unstable, build this as 2D motion graphics with photographic strata textures.)*

### P08 · SIGNATURE: Shadow transformation (S23), ILLUSTRATIVE
Generate **three stills** (A, B, C) and blend them with image-to-video and dissolves, or film a practical shadow and composite the AI-generated shadow shapes onto it.

**Image A:**
> [STYLE BIBLE] firelit rough stone chamber at night, [WANDERER] seen from behind, raising a huge fossil thigh bone toward a low fire, a large dark shadow of the bone cast on the uneven stone wall, flickering orange light, deep black shadows, ominous

**Image B (shadow as giant):**
> same chamber and fire, the shadow on the wall has stretched into the silhouette of a towering human-like giant with long arms, the traveler small in the foreground, unsettling and quiet, realistic shadow edges on rough stone

**Image C (shadow as dragon, then myth):**
> same chamber, the shadow on the wall is now a coiling winged dragon silhouette; the wall surface subtly takes on the look of an ancient black-figure ceramic painting, terracotta orange and black, in a generic style that copies no specific vase, with no inscriptions

**Motion (A→B→C):**
> the camera pushes slowly toward the wall; the fire flickers and the shadow of the raised bone stretches and morphs into a giant figure, then twists into a dragon, which flattens into the painted style of ancient pottery

### P09 · Wanderer kneels, hand on the bone (S27)
**Image:**
> [STYLE BIBLE] the same cliff and giant fossil femur as the hero shot, now at deeper dusk, [WANDERER] kneeling at its base with one rough palm laid flat on the fossil bone, hood slightly lowered, looking up toward the darkening horizon, wind carrying sand across the bone, contemplative, quiet, a single torch planted in the sand

**Motion:**
> a very slow 30-degree arc around the kneeling figure; sand streams off the bone in the wind; torch flame flickers; the figure lifts their gaze slightly

### P10 · Museum archive drawer and loop (S29)
**Image:**
> [STYLE BIBLE] the dark aisle of a natural history museum collection store, rows of grey steel specimen cabinets receding into darkness, one drawer pulled open in the foreground under a single cool overhead light, the drawer filled with unlabeled dark fossil bone fragments in foam trays, a nitrile-gloved hand resting on the drawer handle, quiet and slightly eerie

**Motion:**
> the gloved hand slides the drawer fully open; the camera pushes slowly past it down the dark aisle; the light hums

**Loop tip:** for the last 1 s, cross-dissolve a macro of the fragment texture into the first frame of P01 (cracked ground), matching the texture scale and brightness.

---

## 6. Thumbnail prompt (see 07-packaging.md)

**T01, base image:**
> [STYLE BIBLE] vertical 9:16 thumbnail composition, [WANDERER] in the lower-left third holding up a torch, face partly lit, looking up in awe at an enormous dinosaur skull and jaw with long teeth emerging from a dark sandstone cliff that fills the upper two-thirds of the frame, [FOSSIL LOOK], warm torchlight on the traveler and the front of the skull, cold blue-grey moonlight on the rest of the cliff, a faint translucent ghost-silhouette of the living dinosaur's head formed by drifting dust in the darkness behind the skull, high contrast, strong readable silhouette, clean negative space in the top 20% for text

**Text is added in a design tool, never generated.**

## 7. Consistency checklist

- [ ] Same Wanderer wardrobe in every shot (hood, brown cloak, undyed tunic, staff)
- [ ] The same cliff and femur in P03 and P09 (use P03 as the image reference for P09)
- [ ] Fossil bone is **dark and mineralized**, never white or clean
- [ ] No legible text anywhere in generated frames
- [ ] Every generated shot carries a `RECONSTRUCTION` or `ILLUSTRATIVE` tag in the edit
- [ ] Hands checked frame by frame (P04, P08, P09, P10). Regenerate if they deform
