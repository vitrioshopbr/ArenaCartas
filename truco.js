/* Arena das Cartas — Mesa imersiva Truco 1x1 */
'use strict';
(()=>{
 const BASE='https://vxqbfkjcmzbrhadkoyqx.supabase.co';
 const KEY='sb_publishable_rS9ZWWdxEN9bOKHiVjnryg_835_hS6a';
 const el=document.createElement('section');el.id='trucoGame';
 el.innerHTML=`<div class="table-shell">
 <div class="table-top"><button id="tgExit" aria-label="Voltar às mesas">‹</button><div class="table-brand">♠ ARENA <b>DAS CARTAS</b><small>TRUCO ONLINE</small></div><button id="tgSound" aria-label="Ligar ou desligar efeitos sonoros">♫</button></div>
 <div class="table-score"><div><small>VOCÊ</small><strong id="tgMine">0</strong></div><div class="table-score-middle"><span id="tgRoom">MESA</span><b>×</b><span id="tgMeta">MÃO 1 · VAZA 1</span></div><div><small>ADVERSÁRIO</small><strong id="tgOther">0</strong></div></div>
 <div class="table-opponent"><div class="avatar">♟</div><div class="opponent-name">ADVERSÁRIO <small id="tgOtherStatus">Aguardando</small></div><div class="backs"><span>♠</span><span>♠</span><span>♠</span></div></div>
 <div class="felt"><div class="felt-glow"></div><div class="felt-logo">ARENA <span>♠</span> CARTAS</div><div id="tgBoard" class="table-cards"><span class="table-empty">Aguardando jogada</span></div></div>
 <div class="table-bottom"><div id="tgTurn" class="turn-pill">Preparando partida...</div><div id="tgHand" class="hand-fan"></div><div id="tgNotice" class="table-notice"></div><div class="table-controls"><button id="tgTruco" disabled>🔥 TRUCO!</button><button id="tgRefresh">↻ Atualizar</button></div></div>
 <div id="tgMessage" class="table-message">Entre em uma mesa 1×1 completa para jogar.</div>
 </div>`;
 document.body.append(el);
 const $=s=>document.querySelector(s);
 let loading=false,lastError='',lastTurn=null,lastNotice='',activeRoom=null,firstView=true;
 function session(){try{return JSON.parse(localStorage.getItem('arena_session')||'null')}catch{return null}}
 async function call(name,body){const s=session();if(!s?.access_token)throw Error('Faça login para jogar.');const res=await fetch(BASE+'/rest/v1/rpc/'+name,{method:'POST',headers:{apikey:KEY,Authorization:'Bearer '+s.access_token,'Content-Type':'application/json'},body:JSON.stringify(body)});const raw=await res.text();let data;try{data=JSON.parse(raw)}catch{data=raw}if(!res.ok)throw Error(data?.message||data?.error||'Erro '+res.status);return data}
 const suit={S:'♠',H:'♥',D:'♦',C:'♣'};
 function label(c){if(!c)return '🂠';const x=c.slice(-1);return c.slice(0,-1)+(suit[x]||x)}
 function red(c){return /[HD]$/.test(c)}
 function room(){const list=typeof mesasAtuais!=='undefined'?mesasAtuais:[];const selected=typeof mesaSelecionada!=='undefined'?mesaSelecionada:null;const m=list.find(r=>r.id===selected);if(m?.game==='truco'&&m.max_players===2&&m.participating)return m;return list.find(r=>r.game==='truco'&&r.max_players===2&&r.participating&&['ready','playing'].includes(r.status))||null}
 function makeCard(code,clickable){const b=document.createElement(clickable?'button':'div');b.className='premium-card'+(red(code)?' red':'');const r=code.slice(0,-1),s=suit[code.slice(-1)]||'';b.innerHTML=`<span class="card-corner">${r}<small>${s}</small></span><span class="card-center">${s}</span><span class="card-corner bottom">${r}<small>${s}</small></span>`;return b}
 function show(data,m){
  $('#tgMessage').hidden=true;$('#tgRoom').textContent=m.room_code;$('#tgMine').textContent=data.scores[data.seat];$('#tgOther').textContent=data.scores[1-data.seat];
  $('#tgMeta').textContent='MÃO '+data.hand_number+' · VAZA '+Math.min(3,data.trick_number+1);
  $('#tgTurn').textContent=data.finished?'🏆 PARTIDA ENCERRADA':data.your_turn?'🟢 SUA VEZ DE JOGAR':'⏳ VEZ DO ADVERSÁRIO';
  $('#tgTurn').classList.toggle('your-turn',!!data.your_turn);
  $('#tgOtherStatus').textContent=data.your_turn?'Esperando você':'Jogando agora';
  const board=$('#tgBoard');board.replaceChildren();
  if(!(data.table_cards||[]).length){const p=document.createElement('span');p.className='table-empty';p.textContent='Centro da mesa';board.append(p)}
  else for(const x of data.table_cards){const box=document.createElement('div');box.className='played-card';const tag=document.createElement('small');tag.textContent=x.player===data.seat?'VOCÊ':'ADVERSÁRIO';box.append(makeCard(x.card,false),tag);board.append(box)}
  const hand=$('#tgHand');hand.replaceChildren();
  for(const c of data.hand||[]){const b=makeCard(c,true);b.disabled=!data.your_turn||data.finished;b.setAttribute('aria-label','Jogar '+label(c));b.onclick=async()=>{b.disabled=true;window.ArenaSound?.play('card');try{const next=await call('ac_truco_play',{p_room_id:m.id,p_card:c});show(next,m)}catch(e){window.ArenaSound?.play('error');$('#tgNotice').textContent='Erro na jogada: '+e.message;await update(true)}};hand.append(b)}
  const notice=data.notice||'';$('#tgNotice').textContent=notice;
  if(!firstView&&lastTurn===false&&data.your_turn)window.ArenaSound?.play('turn');
  if(!firstView&&notice!==lastNotice&&notice.includes('venceu'))window.ArenaSound?.play('win');
  lastTurn=data.your_turn;lastNotice=notice;firstView=false;
 }
 async function update(silent=false){if(loading)return;loading=true;try{
  const m=room();if(!m){activeRoom=null;$('#tgMessage').hidden=false;$('#tgMessage').textContent='Entre em uma mesa de Truco 1×1 completa para jogar.';return}
  if(activeRoom!==m.id){activeRoom=m.id;firstView=true;lastTurn=null}
  if(m.status==='waiting'){$('#tgMessage').hidden=false;$('#tgMessage').textContent='Aguardando adversário na '+m.room_code;return}
  let state;try{state=await call('ac_truco_state',{p_room_id:m.id})}catch(e){if(m.status==='ready')state=await call('ac_truco_start',{p_room_id:m.id});else throw e}show(state,m);
 }catch(e){if(!silent||lastError!==e.message){$('#tgMessage').hidden=false;$('#tgMessage').textContent='Truco: '+e.message}lastError=e.message}finally{loading=false}}
 $('#tgExit').onclick=()=>window.ArenaNav?.go('lobby');
 $('#tgRefresh').onclick=()=>update();
 $('#tgSound').onclick=()=>{const a=window.ArenaSound;if(!a)return;a.setEffects(!a.settings.effects);$('#tgSound').textContent=a.settings.effects?'♫':'♪̸'};
 $('#tgTruco').onclick=()=>{}; // Pedido de Truco será liberado após regras implementadas no servidor.
 window.addEventListener('arena-game-open',()=>update());
 setInterval(()=>{if(!document.hidden&&session()?.access_token&&document.body.dataset.screen==='game')update(true)},3000);
 setTimeout(()=>update(),1200);
})();