#!/usr/bin/env python3
"""Piso Wais internal test video (style_montage preset, approved defaults 2026-10-22). INTERNAL ONLY - do not publish.
Free tools only: Pillow, ffmpeg, edge-tts (VO). No paid calls."""
import json, hashlib, subprocess, os, math, datetime
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageOps, ImageFilter, ImageEnhance
import numpy as np
W, H, FPS = 1080, 1920, 30
D = Path(__file__).resolve().parent; O = D/'out'; O.mkdir(exist_ok=True); (D/'vo').mkdir(exist_ok=True); (D/'stills').mkdir(exist_ok=True)
NAVY, OFF, COIN, PINK = (21,37,75), (253,252,250), (252,204,103), (252,161,149)
FONT = '/workspace/video-app-pack/fonts/Caprasimo-Regular.ttf'
FALL = '/workspace/video-app-pack/fonts/Fraunces[SOFT,WONK,opsz,wght].ttf'
LOGO3 = Path('/workspace/brand/pisowais/drive/logo3.jpg')
SFX = Path('/workspace/grokvid2/sfxlib')
sha = lambda p: hashlib.sha256(Path(p).read_bytes()).hexdigest()
run = lambda *a: subprocess.run(a, check=True, capture_output=True)
dur = lambda p: float(subprocess.check_output(['ffprobe','-v','0','-show_entries','format=duration','-of','csv=p=0',str(p)]))

# ---- script: hook + 5 habits x (label, payoff) + CTA. ^word^ = highlight. English only.
SHOTS = [('hook', 'Five ^habits^ that save pesos', 'Five habits that save pesos.')]
HAB = [('Wait a ^day^', 'Wait a day.', 'Sleep on it before you ^buy^', 'Sleep on it before you buy.'),
       ('Pay ^yourself^ first', 'Pay yourself first.', 'Save first on ^payday^', 'Save first on payday.'),
       ('Shop with a ^list^', 'Shop with a list.', 'Not listed? ^Skip^ it', 'Not listed? Skip it.'),
       ('Track every ^peso^', 'Track every peso.', 'Small leaks drain ^savings^', 'Small leaks drain savings.'),
       ('Mute sale ^alerts^', 'Mute sale alerts.', 'Fewer pings, fewer ^buys^', 'Fewer pings, fewer impulse buys.')]
for i, (l, lv, p, pv) in enumerate(HAB, 1): SHOTS += [(f'h{i}a', l, lv), (f'h{i}b', p, pv)]
CTA = 'Follow Piso Wais for one money habit every week.'
SHOTS += [('cta', 'Follow ^Piso Wais^', CTA), ('end', None, None)]

# ---- base still: logo3 edited to a plain coin (sun rays painted out), cut out of its off-white plate
def base_still():
    im = Image.open(LOGO3).convert('RGB'); d = ImageDraw.Draw(im)
    cx, cy = 763, 244
    d.ellipse([cx-54, cy-54, cx+54, cy+54], fill=(232,160,22))   # rim
    d.ellipse([cx-44, cy-44, cx+44, cy+44], fill=(250,190,40))   # plain face, no emblem
    d.ellipse([cx-44, cy-44, cx+44, cy+44], outline=(226,150,18), width=3)
    d.arc([cx-34, cy-34, cx+34, cy+34], 200, 290, fill=(255,226,140), width=6)  # highlight
    a = np.array(im).astype(int); bg = (a.min(axis=2) > 236)
    from collections import deque
    hgt, wid = bg.shape; out = np.zeros_like(bg); q = deque([(0,0),(wid-1,0),(0,hgt-1),(wid-1,hgt-1)])
    while q:  # flood the outer plate from the corners (enclosed light areas like eyes stay opaque)
        x, y = q.popleft()
        if 0 <= x < wid and 0 <= y < hgt and bg[y, x] and not out[y, x]:
            out[y, x] = True; q.extend(((x+1,y),(x-1,y),(x,y+1),(x,y-1)))
    alpha = Image.fromarray(np.where(out, 0, 255).astype('uint8')).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(1.2))
    im.putalpha(alpha); p = D/'stills'/'base_plaincoin.png'; im.save(p); return im, p
# ---- 5 looks (free, local image edits of the same still; stand-ins for the xAI-API looks)
def look(base, k):
    rgb, a = base.convert('RGB'), base.split()[3]
    if k == 0: out = rgb
    elif k == 1: out = ImageOps.posterize(ImageEnhance.Color(rgb).enhance(1.3), 3)
    elif k == 2: g = ImageOps.grayscale(rgb); out = ImageOps.colorize(g, (40,60,120), COIN)
    elif k == 3:
        e = ImageOps.invert(rgb.filter(ImageFilter.FIND_EDGES).convert('L')).point(lambda v: 0 if v < 200 else 255)
        out = Image.composite(ImageOps.posterize(rgb, 2), Image.new('RGB', rgb.size, (30,30,40)), e)
    else: out = rgb.filter(ImageFilter.ModeFilter(9)).filter(ImageFilter.SMOOTH_MORE)
    out = out.convert('RGBA'); out.putalpha(a); return out
LOOKS = ['original_cartoon', 'poster_print', 'duotone_coin', 'ink_outline', 'soft_paint']

def font(sz, f=FONT): return ImageFont.truetype(f, sz)
def _line(d, img, parts, f, y, sz):
    widths = [d.textlength(t, font=f) for t, _ in parts]; x = (W - sum(widths)) / 2; st = max(2, round(sz*0.10))
    for (t, h), w in zip(parts, widths):
        if t.startswith(' '): sp = d.textlength(' ', font=f); x += sp; w -= sp; t = t[1:]
        if h:
            l, tp, r, b = d.textbbox((x, y), t, font=f); d.rounded_rectangle([l-14, tp-12, r+14, b+14], 18, fill=COIN); d.text((x, y), t, font=f, fill=NAVY)
        else: d.text((x, y), t, font=f, fill=OFF, stroke_width=st, stroke_fill=NAVY)
        x += w
def caption(img, text, y):
    d = ImageDraw.Draw(img); toks = []  # word tokens with highlight flag
    for i, seg in enumerate(text.split('^')):
        if i % 2: toks.append((seg, True))
        else: toks += [(w, False) for w in seg.split()]
    def parts(ts): return [(' '.join(t for t, _ in ts[:1]) if False else None, None)] if False else [((' ' if k else '') + t, h) for k, (t, h) in enumerate(ts)]
    wid = lambda ts, f: sum(d.textlength(t, font=f) for t, _ in parts(ts))
    for sz in (104, 96, 88):
        f = font(sz)
        if wid(toks, f) <= 820: _line(d, img, parts(toks), f, y, sz); return 1
    for sz in (96, 88, 80, 72):
        f = font(sz); best = None
        for k in range(1, len(toks)):
            a, b = toks[:k], toks[k:]
            if wid(a, f) <= 820 and wid(b, f) <= 820:
                score = (abs(sum(h for _, h in a) - 1) + abs(sum(h for _, h in b) - 1), max(wid(a, f), wid(b, f)))
                if best is None or score < best[0]: best = (score, a, b)
        if best:
            _line(d, img, parts(best[1]), f, y, sz); _line(d, img, parts(best[2]), f, y + int(sz*1.3), sz); return 2
    raise SystemExit('caption does not fit: ' + text)
def chrome(img):
    d = ImageDraw.Draw(img); f = font(34, FALL)
    d.rounded_rectangle([40, 120, 330, 178], 29, fill=(11,15,26)); d.text((62, 128), 'AI-generated', font=f, fill=OFF)
    d.text((W/2, 1745), 'Educational only. Not financial advice.', font=font(32, FALL), fill=OFF, anchor='mm')
    d.text((W/2, 1800), 'INTERNAL TEST - NOT FOR PUBLISHING', font=font(26, FALL), fill=PINK, anchor='mm')
def frame(stl, text, close):
    img = Image.new('RGB', (W, H), NAVY); s = stl
    sc = 1.35 if close else 1.0; sz = int(1000*sc); s = s.resize((sz, sz), Image.LANCZOS)
    if close: img.paste(s, ((W-sz)//2, 560 - int(sz*0.12)), s)
    else: img.paste(s, ((W-sz)//2, 600), s)
    if text: caption(img, text, 250)
    chrome(img); return img
def end_card(base):
    img = Image.new('RGB', (W, H), OFF); d = ImageDraw.Draw(img); s = base.resize((720, 720), Image.LANCZOS)
    img.paste(s, (180, 380), s)
    d.text((W/2, 1180), 'Piso Wais', font=font(140), fill=NAVY, anchor='mm')
    d.rounded_rectangle([340, 1262, 740, 1274], 6, fill=PINK)
    for i, ln in enumerate(['Follow Piso Wais for one', 'money habit every week.']):
        d.text((W/2, 1350 + i*70), ln, font=font(54), fill=NAVY, anchor='mm')
    d.text((W/2, 1520), '@pisowaisph', font=font(44, FALL), fill=NAVY, anchor='mm')
    d.rounded_rectangle([40, 120, 330, 178], 29, fill=(11,15,26)); d.text((62, 128), 'AI-generated', font=font(34, FALL), fill=OFF)
    d.text((W/2, 1745), 'Educational only. Not financial advice.', font=font(32, FALL), fill=NAVY, anchor='mm')
    d.text((W/2, 1800), 'INTERNAL TEST - NOT FOR PUBLISHING', font=font(26, FALL), fill=(180,60,60), anchor='mm')
    return img

def main():
    base, bp = base_still(); prov = []
    looks = {k: look(base, k) for k in range(5)}
    for k, im in looks.items():
        p = D/'stills'/f'look{k}_{LOOKS[k]}.png'; im.save(p)
        prov.append(dict(still=p.name, sha256=sha(p), look_id=LOOKS[k], derived_from='logo3.jpg (plain-coin edit) -> base_plaincoin.png',
            base_sha256=sha(bp), source_sha256=sha(LOGO3), method='local Pillow filter (stand-in; publish path = xAI API image edit)',
            tool=f'Pillow {Image.__version__}', mascot_origin='AI-generated by Johnny via unslop.site', paid_call=False,
            created_at=datetime.datetime.now().astimezone().isoformat(timespec='seconds')))
    timeline = []; t = 0.0; vo_parts = []
    for sid, text, vo in SHOTS:
        if sid == 'end': d = 1.5; img = end_card(base)
        else:
            mp = D/'vo'/f'{sid}.mp3'
            if not mp.exists(): run(str(D/'venv/bin/edge-tts'), '--voice', 'en-US-AndrewNeural', '--rate', '+6%', '--text', vo, '--write-media', str(mp))
            vd = dur(mp); d = min(max(vd + 0.3, 2.0), 2.5)
            if sid == 'cta': d = min(max(vd + 0.6 - 1.5, 2.1), 2.5)  # CTA VO runs on into the 1.5 s end card (E12)
            k = 0 if sid in ('hook', 'cta') else int(sid[1]) - 1
            img = frame(looks[k], text, sid.endswith('b')); vo_parts.append((t + 0.08, mp, vd))
        d = round(d * FPS) / FPS; p = O/f'{len(timeline):02d}_{sid}.png'; img.save(p)
        timeline.append(dict(shot=sid, start=round(t, 3), dur=d, png=p.name, caption=text, vo=vo)); t += d
    T = t
    # video: concat stills, 8-frame fade into end card
    lst = O/'list.txt'; lst.write_text(''.join(f"file '{x['png']}'\nduration {x['dur']}\n" for x in timeline) + f"file '{timeline[-1]['png']}'\n")
    run('ffmpeg', '-y', '-f', 'concat', '-safe', '0', '-i', str(lst), '-vf', f'fps={FPS},format=yuv420p', '-t', f'{T:.3f}', str(O/'video_nofade.mp4'))
    # audio: VO + whoosh before each habit-start (look-change) cut; impact off; placeholder bed
    wh = [SFX/'norm/whoosh_v1.wav', SFX/'norm/whoosh_v2.wav', SFX/'norm/whoosh_v3.wav']
    cues = []
    for i, x in enumerate(timeline):
        if x['shot'].endswith('a') and x['shot'].startswith('h'):
            prev = timeline[i-1]; pv = [v for v in vo_parts if abs(v[0]-0.08-prev['start']) < 1e-6]
            pause = x['start'] - (pv[0][0] + pv[0][2]) if pv else 1
            f = wh[len(cues) % 3]; wd = dur(f)
            if pause >= 0.15: cues.append(dict(type='whoosh', file=str(f), sha256=sha(f), at=round(max(0, x['start'] - wd*0.6), 3), cut=x['start'], vo_pause_s=round(pause, 3), commercial_ok='unverified'))
    ins = []; fil = []
    for j, (st, mp, _) in enumerate(vo_parts): ins += ['-i', str(mp)]; fil.append(f'[{j}]adelay={int(st*1000)}:all=1,volume=1.0[v{j}]')
    n = len(vo_parts)
    for j, c in enumerate(cues): ins += ['-i', c['file']]; fil.append(f'[{n+j}]adelay={int(c["at"]*1000)}:all=1,volume=0.35[s{j}]')
    m = n + len(cues)
    ins += ['-f', 'lavfi', '-i', f"aevalsrc='0.05*sin(2*PI*220*t)*(0.6+0.4*sin(2*PI*1.83*t))+0.04*sin(2*PI*277.2*t)+0.035*sin(2*PI*329.6*t)+0.03*sin(2*PI*110*t)*(0.5+0.5*sin(2*PI*0.917*t))':s=48000:d={T:.3f}"]
    fil.append(f'[{m}]lowpass=f=1200,volume=0.5,afade=t=out:st={T-1.2:.3f}:d=1.2[bed]')
    mixin = ''.join(f'[v{j}]' for j in range(n)) + ''.join(f'[s{j}]' for j in range(len(cues))) + '[bed]'
    fil.append(f'{mixin}amix=inputs={m+1}:normalize=0:duration=longest,atrim=0:{T:.3f},loudnorm=I=-14:TP=-1.5:LRA=11[a]')
    run('ffmpeg', '-y', *ins, '-filter_complex', ';'.join(fil), '-map', '[a]', '-ar', '48000', str(O/'mix.wav'))
    fs = timeline[-1]['start']
    final = D/'pisowais_style_montage_TEST_internal.mp4'
    run('ffmpeg', '-y', '-i', str(O/'video_nofade.mp4'), '-i', str(O/'mix.wav'), '-filter_complex',
        f"[0]split[a][b];[a]trim=0:{fs:.3f},setpts=PTS-STARTPTS,fps={FPS}[pre];[b]trim={fs:.3f},setpts=PTS-STARTPTS,fps={FPS},tpad=stop_mode=clone:stop=8[post];[pre][post]xfade=transition=fade:duration={8/FPS:.4f}:offset={fs-8/FPS:.3f},format=yuv420p[v]",
        '-map', '[v]', '-map', '1:a', '-c:v', 'libx264', '-crf', '20', '-c:a', 'aac', '-b:a', '160k', '-shortest', '-metadata', 'comment=INTERNAL TEST - NOT FOR PUBLISHING', str(final))
    meta = dict(video=final.name, sha256=sha(final), runtime_s=round(dur(final), 3), status='INTERNAL TEST - NOT FOR PUBLISHING',
        preset='style_montage', defaults='approved 2026-10-22: 5x2, whoosh-only, impact off, plain-coin logo3 + typed end card, licensed_library music, PEAT before publish, xAI API for published stills',
        timeline=timeline, sfx_cues=cues, impact_on_look_changes=False,
        music=dict(source='placeholder_synth', note='ffmpeg aevalsrc tone pad generated locally; NOT the licensed_library bed the preset requires; replace before any publish', commercial_ok=False),
        voice=dict(tool='edge-tts', voice='en-US-AndrewNeural', language='en', note='free TTS stand-in for test only; confirm voice rights before any publish'),
        provenance=prov, peat_check='pending - run PEAT on Johnny Windows PC before any publish')
    (D/'manifest.json').write_text(json.dumps(meta, indent=1)); print(final, meta['runtime_s'], len(cues), 'whoosh cues')
main()
