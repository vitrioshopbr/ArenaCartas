/* Demonstração de áudio e confirmação de saída — Pacote 08 */
'use strict';
(()=>{
 const css=document.createElement('style');
 css.textContent=`
 #soundDemo{position:fixed;inset:0;z-index:9999;background:#060c20ed;display:none;align-items:center;justify-content:center;padding:16px;overflow:auto}
 #soundDemo.open{display:flex}
 .sound-box{background:linear-gradient(155deg,#1e2156,#111632);border:1px solid #8174c8;border-radius:22px;max-width:440px;width:100%;padding:22px;color:#fff;box-shadow:0 20px 70px #000b}
 .sound-box h2{font-size:23px;margin:0 0 6px}.sound-box p{color:#ccd2f4;line-height:1.5}
 .sound-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:15px 0}
 .sound-grid button,.sound-close,.sound-open{border:1px solid #a58de2;background:linear-gradient(140deg,#6857ba,#342e80);color:#fff;padding:13px 9px;border-radius:13px;font-size:15px;font-weight:700}
 .sound-box input[type=range]{width:100%}
 .sound-box label{display:block;margin:12px 0}
 #soundOpen{position:fixed;right:15px;bottom:82px;z-index:200;border-radius:999px;padding:12px 17px;background:#7c51e5;color:white;border:1px solid #b79cff;font-weight:700;box-shadow:0 5px 22px #0007}
 body[data-screen="game"] #soundOpen{display:none}
 #arenaExitConfirm{position:fixed;inset:0;z-index:10001;display:none;align-items:center;justify-content:center;background:#000b;padding:18px}
 #arenaExitConfirm.open{display:flex}
 #arenaExitConfirm .sound-box{text-align:center}
 #arenaExitConfirm .sound-grid{grid-template-columns:1fr 1fr}
 `;
 document.head.append(css);
 const b=document.createElement('button');b.id='soundOpen';b.textContent='🔊 Testar sons';document.body.append(b);
 const overlay=document.createElement('div');overlay.id='soundDemo';
 overlay.innerHTML=`<div class="sound-box" role="dialog" aria-modal="true" aria-label="Efeitos especiais">
 <h2>🔊 Efeitos da Arena</h2><p>Toque nos efeitos para ouvir como o jogo vai soar.</p>
 <div class="sound-grid">
 <button data-fx="shuffle">🃏 Embaralhar</button><button data-fx="deal">🎴 Distribuir</button>
 <button data-fx="card">♠ Jogar carta</button><button data-fx="turn">⏰ Sua vez</button>
 <button data-fx="truco">🔥 TRUCO!</button><button data-fx="win">🏆 Vitória</button>
 </div>
 <label><input id="fxEnabled" type="checkbox"> Ativar efeitos sonoros</label>
 <label><input id="fxVoice" type="checkbox"> Voz anunciando Truco (se disponível)</label>
 <label>Volume <input id="fxVolume" type="range" min="0" max="1" step=".05"></label>
 <button class="sound-close" id="fxClose">Fechar</button>
 </div>`;
 document.body.append(overlay);
 const confirm=document.createElement('div');confirm.id='arenaExitConfirm';
 confirm.innerHTML=`<div class="sound-box" role="dialog" aria-modal="true">
 <h2>⚠️ Abandonar partida?</h2>
 <p>Se sair agora, você deixará de acompanhar esta mesa. A saída não cancela automaticamente a partida no servidor.</p>
 <div class="sound-grid"><button id="exitStay">Continuar jogando</button><button id="exitLeave">Sair da tela</button></div>
 </div>`;
 document.body.append(confirm);
 function open(){
  const a=window.ArenaSound;if(!a)return;
  a.audio();document.querySelector('#fxEnabled').checked=a.settings.effects;
  document.querySelector('#fxVoice').checked=a.settings.voice;
  document.querySelector('#fxVolume').value=a.settings.volume;
  overlay.classList.add('open');
 }
 b.onclick=open;
 document.querySelector('#fxClose').onclick=()=>overlay.classList.remove('open');
 overlay.querySelectorAll('[data-fx]').forEach(btn=>btn.onclick=()=>window.ArenaSound?.play(btn.dataset.fx));
 document.querySelector('#fxEnabled').onchange=e=>window.ArenaSound?.setEffects(e.target.checked);
 document.querySelector('#fxVoice').onchange=e=>window.ArenaSound?.setVoice(e.target.checked);
 document.querySelector('#fxVolume').oninput=e=>window.ArenaSound?.setVolume(e.target.value);
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&overlay.classList.contains('open'))overlay.classList.remove('open')});
 let pending=false;
 function askExit(){pending=true;confirm.classList.add('open')}
 document.querySelector('#exitStay').onclick=()=>{pending=false;confirm.classList.remove('open')};
 document.querySelector('#exitLeave').onclick=()=>{
  pending=false;confirm.classList.remove('open');
  window.ArenaNav?.go('lobby');
 };
 // intercept UI back buttons before their existing onclick handlers
 document.addEventListener('click',e=>{
  const button=e.target.closest('#tgExit,#arenaBack');
  if(button&&document.body.dataset.screen==='game'){
   e.stopImmediatePropagation();e.preventDefault();askExit();
  }
 },true);
 window.addEventListener('popstate',()=>{
  if(document.body.dataset.screen==='game')askExit();
 });
 window.ArenaExit={ask:askExit};
})();
