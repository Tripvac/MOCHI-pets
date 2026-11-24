"""Reproducible original sound design. No downloads, licensed samples or APIs."""
from pathlib import Path
import wave, math, random, array
RATE=22050
out=Path(__file__).resolve().parent.parent/'public/audio'
out.mkdir(parents=True,exist_ok=True)
random.seed(74)
def save(name, samples):
    pcm=array.array('h',(int(max(-.96,min(.96,v))*32767) for v in samples))
    with wave.open(str(out/(name+'.wav')),'wb') as f:
        f.setnchannels(1);f.setsampwidth(2);f.setframerate(RATE);f.writeframes(pcm.tobytes())
def bell(notes,duration):
    data=[]
    for i in range(int(duration*RATE)):
        t=i/RATE;v=0
        for start,freq,gain in notes:
            a=t-start
            if a>=0:
                env=(1-math.exp(-a*130))*math.exp(-a*4.8)
                v+=gain*env*(math.sin(2*math.pi*freq*a)+.22*math.sin(2*math.pi*freq*2.76*a))
        data.append(v)
    return data
save('doorbell',bell([(0,784,.3),(.25,622.25,.26)],1.5))
save('reward',bell([(0,659.25,.25),(.11,830.61,.25),(.24,987.77,.26)],1.25))
save('place',bell([(0,392,.22),(.08,523.25,.17)],.65))
save('sleep',bell([(0,392,.18),(.27,329.63,.14),(.52,261.63,.12)],1.7))
save('tap',[.27*math.exp(-(i/RATE)*65)*(math.sin(2*math.pi*660*i/RATE)+random.uniform(-.28,.28)) for i in range(int(.16*RATE))])
purr=[]
for i in range(int(.95*RATE)):
    t=i/RATE;env=min(1,t/.05)*min(1,(.95-t)/.12)
    pulse=.55+.45*math.sin(2*math.pi*26*t)
    purr.append(.25*env*pulse*(math.sin(2*math.pi*135*t)+.2*random.uniform(-1,1)))
save('pet',purr)
feed=[]
for i in range(int(.75*RATE)):
    t=i/RATE;a=t%.23;env=math.exp(-a*36)*min(1,t/.008)
    feed.append(.27*env*(random.uniform(-1,1)*.72+.2*math.sin(2*math.pi*900*t)))
save('feed',feed)
# A gentle continuous rain bed with tiny isolated droplets.
rain=[];low=0
for i in range(RATE*6):
    low=low*.89+random.uniform(-1,1)*.11
    rain.append(low*.43+random.uniform(-1,1)*.033)
for start in [.35,1.2,2.15,3.7,4.4,5.1]:
    for j in range(int(.035*RATE)):
        rain[int(start*RATE)+j]+=.09*math.exp(-j/RATE*170)*math.sin(2*math.pi*(1700-j*.1)*j/RATE)
save('rain',rain)
for name,night in [('garden',False),('night',True)]:
    data=[];low=0
    for i in range(RATE*8):
        t=i/RATE;low=low*.985+random.uniform(-1,1)*.015
        v=low*.1
        starts=[.65,1.05,4.3,4.65,6.8] if not night else [.8,1,1.2,3.9,4.1,4.3,6.6]
        for st in starts:
            a=t-st
            if 0<a<.19:
                env=math.sin(math.pi*a/.19)**2
                freq=2800 if night else 1900+1100*a/.19
                v+=.05*env*math.sin(2*math.pi*freq*a)
        data.append(v)
    save(name,data)
print('Wrote',len(list(out.glob('*.wav'))),'original sound files')
