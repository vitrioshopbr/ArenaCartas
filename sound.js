/* Arena das Cartas — Áudio premium v8: efeitos sintetizados e demonstração */
'use strict';
window.ArenaSound=(()=>{
 let ctx=null;let musicTimer=null;let musicStep=0;let musicBus=null;
 const settings={effects:localStorage.getItem('arena_fx')!=='off',volume:Number(localStorage.getItem('arena_fx_volume')??'.8'),voice:localStorage.getItem('arena_voice')!=='off',music:localStorage.getItem('arena_music')!=='off',musicVolume:Number(localStorage.getItem('arena_music_volume')??'.20')};
 function audio(){
  try{
   const C=window.AudioContext||window.webkitAudioContext;
   if(!C)return null;
   ctx=ctx||new C();
   if(ctx.state==='suspended')ctx.resume().catch(()=>{});
   return ctx;
  }catch{return null}
 }
 function musicNote(freq,when,length=.35,level=.1,kind='sine'){
  const c=audio();if(!c||!musicBus)return;
  const o=c.createOscillator(),g=c.createGain();o.type=kind;o.frequency.value=freq;
  g.gain.setValueAtTime(.0001,when);g.gain.exponentialRampToValueAtTime(Math.max(.0002,level),when+.025);
  g.gain.exponentialRampToValueAtTime(.0001,when+length);
  o.connect(g).connect(musicBus);o.start(when);o.stop(when+length+.02);
 }
 // Trilha original lounge de cassino: harmonia Am7 Dm7 G7 Cmaj7, 92 BPM.
 function musicTick(){
  if(!settings.music||document.hidden)return;
  const c=audio();if(!c||c.state!=='running')return;
  const beat=60/92,now=c.currentTime+.045,step=musicStep++%32;
  const roots=[110,146.83,98,130.81],root=roots[Math.floor(step/8)];
  if(step%2===0)musicNote(root,now,.25,.055,'triangle');
  if(step%8===0){const chord=[1,1.2,1.5,1.8];chord.forEach((ratio,i)=>musicNote(root*ratio*2,now+i*.055,1.4,.032,'sine'));}
  if(step%4===2)musicNote(root*4*(step%8===2?1.5:1.2),now,.25,.04,'sine');
 }
 function startMusic(){
  const c=audio();if(!c)return false;
  if(!musicBus){musicBus=c.createGain();musicBus.connect(c.destination)}
  musicBus.gain.value=settings.music?Math.min(.7,settings.musicVolume):0;
  if(!musicTimer){musicTick();musicTimer=setInterval(musicTick,326)}
  return true;
 }
 function stopMusic(){if(musicTimer){clearInterval(musicTimer);musicTimer=null}if(musicBus)musicBus.gain.value=0}
 function setMusic(v){settings.music=!!v;localStorage.setItem('arena_music',v?'on':'off');if(v)startMusic();else stopMusic()}
 function setMusicVolume(v){settings.musicVolume=Math.max(0,Math.min(1,Number(v)));localStorage.setItem('arena_music_volume',settings.musicVolume);if(musicBus)musicBus.gain.value=settings.music?settings.musicVolume:0}
 function tone(freq=440,duration=.13,type='sine',gain=.20,delay=0){
  if(!settings.effects)return;
  const c=audio();if(!c)return;
  const start=c.currentTime+delay,osc=c.createOscillator(),g=c.createGain();
  osc.type=type;osc.frequency.setValueAtTime(freq,start);
  g.gain.setValueAtTime(.0001,start);
  g.gain.exponentialRampToValueAtTime(Math.max(.0002,gain*settings.volume),start+.015);
  g.gain.exponentialRampToValueAtTime(.0001,start+duration);
  osc.connect(g).connect(c.destination);osc.start(start);osc.stop(start+duration+.03);
 }
 function noise(duration=.18,volume=.30,delay=0,frequency=2100){
  if(!settings.effects)return;
  const c=audio();if(!c)return;
  const b=c.createBuffer(1,Math.ceil(c.sampleRate*duration),c.sampleRate),a=b.getChannelData(0);
  for(let i=0;i<a.length;i++)a[i]=(Math.random()*2-1)*Math.exp(-4*i/a.length);
  const src=c.createBufferSource(),filter=c.createBiquadFilter(),g=c.createGain();
  filter.type='bandpass';filter.frequency.value=frequency;filter.Q.value=.7;
  g.gain.value=volume*settings.volume;
  src.buffer=b;src.connect(filter).connect(g).connect(c.destination);src.start(c.currentTime+delay);
 }
 function say(phrase){
  if(!settings.effects||!settings.voice||!('speechSynthesis' in window))return;
  try{
   speechSynthesis.cancel();
   const u=new SpeechSynthesisUtterance(phrase);
   u.lang='pt-BR';u.rate=.93;u.pitch=.85;u.volume=Math.min(1,settings.volume);
   speechSynthesis.speak(u);
  }catch{}
 }
 function play(name){
  if(!settings.effects)return;
  switch(name){
   case 'card':noise(.19,.36,0,1400);tone(175,.09,'triangle',.12);break;
   case 'deal':for(let i=0;i<3;i++)noise(.17,.34,i*.18,1500);break;
   case 'tap':tone(630,.075,'sine',.13);break;
   case 'turn':tone(530,.16,'sine',.18);tone(790,.18,'sine',.16,.16);break;
   case 'win':for(let i=0;i<5;i++)tone([392,494,587,784,988][i],.34,'triangle',.21,i*.15);break;
   case 'truco':tone(160,.38,'sawtooth',.25);tone(245,.42,'triangle',.23,.16);say('Truco!');break;
   case 'error':tone(230,.22,'triangle',.17);break;
   case 'shuffle':for(let i=0;i<7;i++)noise(.12,.26,i*.08,900+i*180);break;
  }
 }
 function setEffects(v){settings.effects=!!v;localStorage.setItem('arena_fx',v?'on':'off')}
 function setVolume(v){settings.volume=Math.max(0,Math.min(1,Number(v)));localStorage.setItem('arena_fx_volume',String(settings.volume))}
 function setVoice(v){settings.voice=!!v;localStorage.setItem('arena_voice',v?'on':'off')}
 document.addEventListener('pointerdown',()=>{audio();if(settings.music)startMusic()},{once:true});document.addEventListener('visibilitychange',()=>{if(document.hidden)stopMusic();else if(settings.music&&ctx?.state==='running')startMusic()});
 document.addEventListener('click',e=>{if(e.target.closest('button')&&!e.target.closest('#tgHand')&&!e.target.closest('#soundDemo'))play('tap')});
 return {play,settings,setEffects,setVolume,setVoice,audio,startMusic,stopMusic,setMusic,setMusicVolume};
})();
