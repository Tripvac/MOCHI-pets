"""Original, reproducible stylized pet voices. No external recordings or APIs.
Two takes each of happy, excited and sleepy for all seven companions.
"""
from pathlib import Path
import math, wave, array, random, json
RATE = 22050
ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'public/audio/pets'
OUT.mkdir(parents=True, exist_ok=True)
KINDS = ['cat', 'rabbit', 'dog', 'hamster', 'pusheen', 'capybara', 'cheems']

def voice(species, mood, take):
    rng = random.Random(KINDS.index(species)*103 + take*17 + ['happy','excited','sleepy'].index(mood)*307)
    sleepy = mood == 'sleepy'
    excited = mood == 'excited'
    length = 1.35 if sleepy else 1.05 if excited else 1.15
    output = [0.0]*int(length*RATE)
    base = {'cat': 370, 'rabbit': 530, 'dog': 230, 'hamster': 1280, 'pusheen': 185, 'capybara': 780, 'cheems': 305}[species]
    base *= (1 + .07*take) * (.78 if sleepy else 1.08 if excited else 1)
    count = 1 if sleepy else 3 if excited else 2
    starts = [.04 + i*(.25 if excited else .38) for i in range(count)]
    if sleepy: starts = [.06]
    for note, start in enumerate(starts):
        duration = (.85 if sleepy else .21 if excited else .34)
        if species in ['cat','pusheen']: duration *= 1.18
        phase = 0.0
        low = 0.0
        for i in range(int(duration*RATE)):
            at = int(start*RATE)+i
            if at >= len(output): break
            t = i/RATE; u = t/duration
            noise = rng.uniform(-1, 1)
            low = .82*low + .18*noise
            attack = 1-math.exp(-t*95)
            env = attack * math.sin(math.pi*u)**1.2
            if species == 'cat':
                freq = base*(.78+.85*math.sin(math.pi*u)**1.6-.18*u)
                harmonics = [1,.55,.30,.13,.07]
            elif species == 'pusheen':
                freq = base*(1+.34*math.sin(math.pi*u)-.22*u)
                harmonics = [1,.25,.10,.05]
                env *= .7+.3*math.sin(2*math.pi*25*t)
            elif species in ['dog','cheems']:
                freq = base*(1.27-.55*u) * (1+.014*math.sin(2*math.pi*35*t))
                harmonics = [1,.8,.5,.31,.17,.1]
                env *= math.exp(-u*(1.8 if species=='dog' else 1.1))
            elif species == 'hamster':
                freq = base*(1+.32*math.sin(math.pi*u)+.13*math.sin(2*math.pi*11*t))
                harmonics = [1,.13,.035]
                env *= .8+.2*math.sin(2*math.pi*17*t)
            elif species == 'rabbit':
                freq = base*(1-.27*u+.045*math.sin(2*math.pi*18*t))
                harmonics = [.55,.2,.07]
                env *= .68+.32*math.sin(2*math.pi*31*t)
            else:
                freq = base*(.88+.29*math.sin(math.pi*u)+.025*math.sin(2*math.pi*7*t))
                harmonics = [1,.08,.03]
            phase += 2*math.pi*freq/RATE
            signal = sum(g*math.sin(phase*(h+1)) for h,g in enumerate(harmonics)) / sum(harmonics)
            if species == 'rabbit': signal = signal*.40 + low*.8
            if species in ['dog','cheems']: signal += low*(.24 if species=='cheems' else .14)
            if species == 'capybara': signal += .13*math.sin(phase*.25)
            if sleepy: signal = signal*.68 + low*.08
            output[at] += env*signal
    # A short soft purr/exhale makes sleep a separate take rather than a pitch shift.
    if sleepy:
        for i in range(len(output)):
            t = i/RATE
            output[i] += .025*math.sin(math.pi*t/length)**2 * math.sin(2*math.pi*(34+KINDS.index(species)*3)*t)
    peak = max(abs(v) for v in output) or 1
    gain = (.34 if sleepy else .52)/peak
    return [v*gain for v in output]

manifest = []
for species in KINDS:
    for mood in ['happy','excited','sleepy']:
        for take in range(2):
            samples = voice(species, mood, take)
            name = f'{species}-{mood}-{take}.wav'
            pcm = array.array('h', (int(max(-.98,min(.98,v))*32767) for v in samples))
            with wave.open(str(OUT/name),'wb') as file:
                file.setnchannels(1);file.setsampwidth(2);file.setframerate(RATE);file.writeframes(pcm.tobytes())
            manifest.append({'file': name, 'species':species, 'mood':mood, 'take':take, 'duration':len(samples)/RATE})
(ROOT/'docs/PET_VOICES.json').write_text(json.dumps(manifest, indent=2)+'\n')
print(f'Generated {len(manifest)} original pet voice takes')
