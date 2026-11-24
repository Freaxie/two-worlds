#!/usr/bin/env python3
"""Writes narration/SCRIPT.md (final narration with timings) and output/youtube_description.txt."""
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
script = json.load(open(os.path.join(ROOT, 'narration', 'script.json')))
tl = json.load(open(os.path.join(ROOT, 'film', 'data', 'timeline.json')))
asr = open(os.path.join(ROOT, 'audio', 'tts', 'asr_report.txt')).read()
SCENES = {1: 'The Internet Graveyard', 2: 'Gopher: the internet before the web', 3: 'Archie (and WAIS): search before Google',
          4: 'Finger: when the internet was personal', 5: 'The protocols that lost (IPX/SPX, X.25)', 6: 'Not everything died (IRC, NNTP, Gopher)', 7: 'The final reveal'}
fmt = lambda s: f"{int(s // 60)}:{s % 60:05.2f}"

out = ['# Narration script — The Strange World of Dead Internet Protocols', '',
       f"Voice: Kokoro-82M `{script['voice']}` at speed {script['speed']} · total running time {tl['duration']:.2f} s (60 fps).", '',
       'Each line is synthesised separately, trimmed, and placed on the timeline below; scene cuts fall about 0.45 s before',
       "each scene's first line. Word-level timings (from Whisper) drive the subtitles and the on-screen beats.", '']
cur = None
for l in tl['lines']:
    if l['scene'] != cur:
        cur = l['scene']
        out += ['', f"## Scene {cur} — {SCENES[cur]}", '']
    src = next(x for x in script['lines'] if x['id'] == l['id'])
    spoken = '' if src['text'] == l['text'].replace('’', "'") else f"  \n  *spoken as:* “{src['text']}”"
    out.append(f"- `{fmt(l['start'])}–{fmt(l['end'])}` {l['text']}{spoken}")
out += ['', '## Pronunciation overrides (phonemes fed to the TTS)', '']
out += [f"- **{k}** → `/{v}/`" for k, v in script['phonemes'].items()]
out += ['', '## Machine verification (Whisper small, per line, dry narration)', '', '```', asr.strip(), '```', '',
        '"WAIS" is transcribed as "Waze" because Whisper has no spelling for /weɪz/; the pronunciation is the intended one.']
open(os.path.join(ROOT, 'narration', 'SCRIPT.md'), 'w').write('\n'.join(out) + '\n')

desc = """The Strange World of Dead Internet Protocols

The internet has a graveyard — not of websites, but of entire languages computers once used to talk.
Gopher, Archie, WAIS, Finger, IPX/SPX and X.25… and the survivors: IRC and Usenet's NNTP.

STATUS (as classified in the video)
• Gopher — niche: displaced by the Web, a few hundred hobbyist servers remain
• Archie — abandoned (one legacy server kept for history)
• WAIS — abandoned
• Finger — obsolete; mostly switched off for privacy and security
• IPX/SPX — obsolete; the IETF reclassified its IPX-over-IP RFCs as Historic
• X.25 — obsolete; displaced by Frame Relay and IP, legacy pockets remain
• IRC, Usenet/NNTP — alive in niche communities

Interfaces shown are illustrative reconstructions; hostnames, users and chats are invented.

SOURCES
RFC 742 (Finger, 1977) https://www.rfc-editor.org/rfc/rfc742
RFC 1288 (Finger, 1991) https://www.rfc-editor.org/rfc/rfc1288
RFC 1436 (Gopher, 1993) https://www.rfc-editor.org/rfc/rfc1436
RFC 1689 (Status of networked information retrieval: Archie, Gopher, WAIS, 1994) https://www.rfc-editor.org/rfc/rfc1689
RFC 1625 (WAIS over Z39.50, 1994) https://www.rfc-editor.org/rfc/rfc1625
RFC 1234 / RFC 1552 (IPX, now Historic) https://www.rfc-editor.org/rfc/rfc1234
ITU-T Recommendation X.25 https://www.itu.int/rec/T-REC-X.25
RFC 877 / RFC 1356 (IP over X.25) https://www.rfc-editor.org/rfc/rfc1356
RFC 977 / RFC 3977 (NNTP) https://www.rfc-editor.org/rfc/rfc3977
RFC 1459 / RFC 2810 (IRC) https://www.rfc-editor.org/rfc/rfc1459
Les Earnest on Finger https://web.stanford.edu/~learnest/sail/finger.html
McGill: the first internet search engine https://200.mcgill.ca/history/creation-of-the-first-internet-search-engine/
Google Groups ends Usenet support (2024) https://support.google.com/groups/answer/11036538
Libera.Chat annual report 2025 https://libera.chat/annual-reports/2025/

Made entirely in code: Three.js + Canvas visuals, Kokoro-82M narration, procedurally synthesised score and sound design.

#internethistory #retrocomputing #networking #gopher #IRC #usenet #shorts
"""
os.makedirs(os.path.join(ROOT, 'output'), exist_ok=True)
open(os.path.join(ROOT, 'output', 'youtube_description.txt'), 'w').write(desc)
print('docs written')
