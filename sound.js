/* Arena das Cartas — Áudio premium v8: efeitos sintetizados e demonstração */
'use strict';
window.ArenaSound=(()=>{
 let ctx=null;
 const settings={effects:localStorage.getItem('arena_fx')!=='off',volume:Number(localStorage.getItem('arena_fx_volume')??'.8'),voice:localStorage.getItem('arena_voice')!=='off'};
 function audio(){
  try{
   const C=window.AudioContext||window.webkitAudioContext;
   if(!C)return null;
   ctx=ctx||new C();
   if(ctx.state==='suspended')ctx.resume().catch(()=>{});
   return ctx;
  }catch{return null}
 }
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
 document.addEventListener('pointerdown',()=>audio(),{once:true});
 document.addEventListener('click',e=>{if(e.target.closest('button')&&!e.target.closest('#tgHand')&&!e.target.closest('#soundDemo'))play('tap')});
 return {play,settings,setEffects,setVolume,setVoice,audio};
})();
