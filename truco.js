'use strict';
(() => {
 const BASE='https://vxqbfkjcmzbrhadkoyqx.supabase.co';
 const KEY='sb_publishable_rS9ZWWdxEN9bOKHiVjnryg_835_hS6a';
 const el=document.createElement('section');
 el.className='panel';el.id='trucoGame';
 el.innerHTML=`<h2>🃏 Mesa de Truco Online</h2>
 <p id="tgMessage">Entre em uma mesa 1×1 completa para jogar.</p>
 <div id="tgPanel" hidden>
 <h3 id="tgRoom"></h3>
 <div id="tgScore" class="tg-score"></div><p id="tgMeta" class="tg-trick"></p>
 <p><span id="tgTurn" class="tg-pill"></span></p>
 <div id="tgBoard" class="tg-board"></div>
 <h3>🖐️ Suas cartas — toque para jogar</h3><div id="tgHand" class="tg-hand"></div>
 <p id="tgNotice" class="tg-alert"></p>
 </div>
 <button id="tgRefresh">Atualizar partida</button>`;
 const anchor=document.querySelector('#arenaOnlinePanel');
 if(anchor) anchor.after(el);else document.querySelector('main')?.append(el);
 const css=document.createElement('style');
 css.textContent='';
 document.head.append(css);
 const $=s=>document.querySelector(s);
 let activeRoom=null, loading=false, lastError='';
 function session(){try{return JSON.parse(localStorage.getItem('arena_session')||'null')}catch{return null}}
 async function call(name,body){
   const s=session();
   if(!s?.access_token)throw Error('Faça login para jogar.');
   const res=await fetch(BASE+'/rest/v1/rpc/'+name,{
    method:'POST',
    headers:{apikey:KEY,Authorization:'Bearer '+s.access_token,'Content-Type':'application/json'},
    body:JSON.stringify(body)
   });
   const raw=await res.text();let data;try{data=JSON.parse(raw)}catch{data=raw}
   if(!res.ok)throw Error(data?.message||data?.error||'Erro '+res.status);
   return data;
 }
 function cardLabel(c){return c ? c.replace('S','♠').replace('H','♥').replace('D','♦').replace('C','♣') : '🂠'}
 function isRed(c){return c?.endsWith('H')||c?.endsWith('D')}
 function room(){
  const list=typeof mesasAtuais!=='undefined'?mesasAtuais:[];
  const selected=typeof mesaSelecionada!=='undefined'?mesaSelecionada:null;
  const m=list.find(r=>r.id===selected);
  if(m?.game==='truco'&&m.max_players===2&&m.participating)return m;
  return list.find(r=>r.game==='truco'&&r.max_players===2&&r.participating&&['ready','playing'].includes(r.status))||null;
 }
 function show(data,m){
  $('#tgPanel').hidden=false;
  $('#tgRoom').textContent='Mesa '+m.room_code;
  $('#tgScore').innerHTML='<div><small>VOCÊ</small><b>'+data.scores[data.seat]+'</b></div><span class="tg-vs">×</span><div><small>ADVERSÁRIO</small><b>'+data.scores[1-data.seat]+'</b></div>';
  $('#tgMeta').textContent='🃏 Mão '+data.hand_number+'  ·  Rodada '+Math.min(3,data.trick_number+1)+' de 3  ·  Vence quem chegar a 12 pontos';
  $('#tgTurn').textContent=data.finished?'🏆 Partida encerrada':data.your_turn?'🟢 SUA VEZ — escolha uma carta':'⏳ Aguarde o adversário';$('#tgTurn').className='tg-pill'+(data.your_turn?'':' wait');
  const board=$('#tgBoard');board.replaceChildren();
  if(!(data.table_cards||[]).length){board.textContent='🂠 Aguardando a primeira carta desta rodada';}
  else {for(const x of data.table_cards){const slot=document.createElement('div');slot.className='tg-play';const name=document.createElement('strong');name.textContent=x.player===data.seat?'VOCÊ':'ADVERSÁRIO';const card=document.createElement('div');card.className='tg-card'+(isRed(x.card)?' red':'');card.textContent=cardLabel(x.card);slot.append(name,card);board.append(slot);}}
  const hand=$('#tgHand');hand.replaceChildren();
  for(const c of data.hand||[]){
   const b=document.createElement('button');b.className='tg-card'+(isRed(c)?' red':'');
   b.textContent=cardLabel(c);b.disabled=!data.your_turn||data.finished;
   b.onclick=async()=>{
    b.disabled=true;
    try{const next=await call('ac_truco_play',{p_room_id:m.id,p_card:c});show(next,m)}
    catch(e){$('#tgNotice').textContent='Erro na jogada: '+e.message;await update(true)}
   };
   hand.append(b);
  }
  $('#tgNotice').textContent=data.notice||'';
  $('#tgMessage').textContent=data.finished?'Partida concluída.':'Truco 1×1 online — cartas sincronizadas.';
 }
 async function update(silent=false){
  if(loading)return;
  loading=true;
  try{
   const m=room();
   if(!m){
    activeRoom=null;$('#tgPanel').hidden=true;
    if(!silent)$('#tgMessage').textContent='Entre em uma mesa 1×1 completa para jogar.';
    return;
   }
   activeRoom=m.id;
   if(m.status==='waiting'){
    $('#tgPanel').hidden=true;$('#tgMessage').textContent='Aguardando adversário na mesa '+m.room_code;
    return;
   }
   let state;
   try{
    state=await call('ac_truco_state',{p_room_id:m.id});
   }catch(e){
    if(m.status==='ready'){
      state=await call('ac_truco_start',{p_room_id:m.id});
    }else throw e;
   }
   show(state,m);
  }catch(e){
   if(e.message!==lastError||!silent)$('#tgMessage').textContent='Truco: '+e.message;
   lastError=e.message;
  }finally{loading=false}
 }
 $('#tgRefresh').onclick=()=>update();
 setInterval(()=>{if(!document.hidden&&session()?.access_token)update(true)},3500);
 setTimeout(()=>update(),1200);
})();
