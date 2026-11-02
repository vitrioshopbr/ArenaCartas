/* Sons originais sintetizados, sem dependências externas. */
'use strict';
window.ArenaSound=(()=>{
 let ctx=null;
 const settings={effects:localStorage.getItem('arena_fx')!=='off',music:localStorage.getItem('arena_music')==='on',volume:Number(localStorage.getItem('arena_fx_volume')||'.55')};
 function audio(){try{ctx=ctx||new(window.AudioContext||window.webkitAudioContext)();if(ctx.state==='suspended')ctx.resume();return ctx}catch{return null}}
 function tone(freq=440,duration=.08,type='sine',gain=.08,delay=0){if(!settings.effects)return;const c=audio();if(!c)return;const osc=c.createOscillator(),g=c.createGain(),start=c.currentTime+delay;osc.type=type;osc.frequency.setValueAtTime(freq,start);g.gain.setValueAtTime(.0001,start);g.gain.exponentialRampToValueAtTime(Math.max(.0002,gain*settings.volume),start+.012);g.gain.exponentialRampToValueAtTime(.0001,start+duration);osc.connect(g).connect(c.destination);osc.start(start);osc.stop(start+duration+.02)}
 function noise(duration=.13,volume=.17,delay=0){if(!settings.effects)return;const c=audio();if(!c)return;const buffer=c.createBuffer(1,Math.ceil(c.sampleRate*duration),c.sampleRate),arr=buffer.getChannelData(0);for(let i=0;i<arr.length;i++)arr[i]=(Math.random()*2-1)*Math.exp(-5*i/arr.length);const src=c.createBufferSource(),filter=c.createBiquadFilter(),gain=c.createGain();filter.type='bandpass';filter.frequency.value=1800;gain.gain.value=volume*settings.volume;src.buffer=buffer;src.connect(filter).connect(gain).connect(c.destination);src.start(c.currentTime+delay)}
 function play(name){if(!settings.effects)return;switch(name){case 'card':noise(.12,.28);tone(190,.05,'triangle',.04);break;case 'deal':for(let i=0;i<3;i++)noise(.10,.2,i*.12);break;case 'tap':tone(580,.05,'sine',.05);break;case 'turn':tone(510,.12,'sine',.08);tone(740,.13,'sine',.07,.13);break;case 'win':for(let i=0;i<4;i++)tone([440,554,659,880][i],.24,'triangle',.11,i*.12);break;case 'truco':tone(180,.27,'sawtooth',.14);tone(260,.28,'triangle',.11,.13);break;case 'error':tone(220,.15,'triangle',.07);break;}}
 function setEffects(v){settings.effects=!!v;localStorage.setItem('arena_fx',v?'on':'off')}
 function setVolume(v){settings.volume=Math.max(0,Math.min(1,Number(v)));localStorage.setItem('arena_fx_volume',String(settings.volume))}
 document.addEventListener('pointerdown',()=>{audio()},{once:true});
 document.addEventListener('click',e=>{if(e.target.closest('button')&&!e.target.closest('#tgHand'))play('tap')});
 return {play,settings,setEffects,setVolume};
})();