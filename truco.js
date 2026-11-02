'use strict';
(() => {
 const BASE='https://vxqbfkjcmzbrhadkoyqx.supabase.co';
 const KEY='sb_publishable_rS9ZWWdxEN9bOKHiVjnryg_835_hS6a';
 const el=document.createElement('section');
 el.className='panel';el.id='trucoGame';
 el.innerHTML=`<h2>🃏 Truco 1×1 — Partida</h2>
 <p id="tgMessage">Entre em uma mesa 1×1 completa para jogar.</p>
 <div id="tgPanel" hidden>
 <h3 id="tgRoom"></h3>
 <p id="tgScore"></p>
 <p id="tgTurn"></p>
 <div id="tgBoard" class="tg-board"></div>
 <h3>Suas cartas</h3><div id="tgHand" class="tg-hand"></div>
 <p id="tgNotice"></p>
 </div>
 <button id="tgRefresh">Atualizar partida</button>`;
 const anchor=document.querySelector('#arenaOnlinePanel');
 if(anchor) anchor.after(el);else document.querySelector('main')?.append(el);
 const css=document.createElement('style');
 css.textContent=`
 #trucoGame{margin-top:16px}.tg-hand{display:flex;gap:8px;flex-wrap:wrap;justify-content:center}
 .tg-card{min-width:66px;min-height:102px;border-radius:10px;background:#fff;color:#102b26;border:2px solid #d8c99e;font-weight:900;font-size:25px;box-shadow:0 4px 14px #0005}
 .tg-card.red{color:#b62136}.tg-card:disabled{opacity:.65}
 .tg-board{min-height:95px;background:linear-gradient(145deg,#174e37,#0c2c25);border:2px solid #53795c;border-radius:50%;padding:20px;text-align:center;margin:14px 0}
 #tgMessage,#tgNotice{line-height:1.5}`;
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
  $('#tgScore').textContent='Placar: '+data.scores.join(' × ')+' · Mão '+data.hand_number+' · Vaza '+(data.trick_number+1);
  $('#tgTurn').textContent=data.finished?'🏆 Partida encerrada':data.your_turn?'🟢 Sua vez de jogar':'⏳ Vez do adversário';
  $('#tgBoard').textContent=(data.table_cards||[]).map(x=>(x.player===data.seat?'Você':'Adversário')+': '+cardLabel(x.card)).join('   |   ')||'Mesa livre';
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
