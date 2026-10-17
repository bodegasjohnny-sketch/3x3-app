import json, re
from pathlib import Path
P = Path('/workspace/video-app-pack')
t = json.load(open(P/'taxonomy.json')); s = json.load(open(P/'styles.json'))
rules = json.load(open(P/'global_rule_set.example.json'))
short = lambda n: re.sub(r'\s*\(.*?\)', '', n).strip()
goals = [dict(id=g['id'], name=g['name'], short=short(g['name']), kpi=g['kpi'], cta=g['cta_style'],
              lengths=g.get('best_lengths_s',{}).get('recommended'), guards=g.get('rule_guards',[])) for g in t['goals']]
cats = [dict(id=c['id'], name=c['name'], subs=[dict(id=x['id'], name=x['name'], goals=x['goals'], risk=x['compliance_risk']['level'],
        areas=x['compliance_risk'].get('areas',[]), rpm=x['monetization'].get('rpm_tier'), vis=x.get('ai_visual_feasibility'),
        ever=x.get('evergreen'), bundles=x.get('rule_bundles',[]), dstyle=x.get('default_style'), alts=x.get('alt_styles',[]), seeds=x.get('topic_seeds',[])) for x in c['subs']])
        for c in t['categories']]
styles = [dict(id=x['id'], name=x['name'], desc=x['description'], layer=x['style_module']['image_layer'], suffix=x['style_module']['image_suffix'],
          moves=x['motion']['allowed_camera_moves'], caps=x['captions'], fit=x.get('fit_goals',[])) for x in s['styles']]
# QA/IP fixes: no brand names or studio names in style names/prompts
for x in styles:
    if x['id'] == 'vox_collage':
        x['name'] = 'Editorial collage'
        x['suffix'] = x['suffix'].replace('vox-style explainer aesthetic, ', '').replace('vox-style', 'editorial')
    if x['id'] == 'anime':
        x['suffix'] = 'generic hand-drawn anime style, film still look, 9:16 vertical, no text, original characters only'
    for k in ('name','desc','layer','suffix'):
        x[k] = re.sub(r'(?i)\b(ghibli[- ]?like|ghibli|vox[- ]style|vox)\b', 'editorial', x[k]).replace('editorial explainer aesthetic, ', '')
keep = ('name','forced','user_can_disable','banned_words','banned_claims','disclaimer','allowed_platforms','platform_note','goals_blocked','cta','extends','affiliate','age_gate','publishing','pii','sources','visual_rules','subject_rules','platform_flags')
bundles = {k: {f: v[f] for f in keep if f in v} for k, v in t.get('rule_bundles', {}).items()}
out = dict(generated=t.get('generated'), version=t.get('version'), assign=t.get('rule_bundle_assignment',{}), bundles=bundles, renamed=s.get('renamed_ids', {}), goals=goals, cats=cats, styles=styles, fit=s['style_fit_matrix'], rules=rules,
           counts=dict(goals=len(goals), cats=len(cats), subs=sum(len(c['subs']) for c in cats), styles=len(styles)))
(Path(__file__).resolve().parent.parent/'js'/'data.js').write_text('/* generated from /workspace/video-app-pack by build_data.py */\nwindow.RS_DATA = ' + json.dumps(out, ensure_ascii=False) + ';\n')
print(out['counts'], round((Path(__file__).resolve().parent.parent/'js'/'data.js').stat().st_size/1024), 'KB')
