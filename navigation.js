/* Arena das Cartas — navegação por telas (Pacote 06) */
'use strict';
(() => {
 const valid=['home','login','register','lobby','game','settings'];
 let route='home';
 const $=s=>document.querySelector(s);
 const style=document.createElement('style');
 style.textContent=`
 .arena-nav{display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding:12px 14px;background:#102e27;border-bottom:1px solid #537568;position:sticky;top:0;z-index:15}
 .arena-nav button{border-radius:12px;padding:10px 13px;min-height:42px;font-weight:700;background:#1a4a3b;color:#fff;border:1px solid #537568}
 .arena-nav button[aria-current=page]{background:#e3c98d;color:#122a24}
 .arena-screen-head{margin:18px 0 12px}.arena-screen-head h2{margin:0 0 5px}
 body[data-screen=home] #arenaOnlinePanel,body[data-screen=home] #trucoGame{display:none!important}
 body:not([data-screen=home]) #arenaDemoSection{display:none!important}
 body[data-screen=login] .hero,body[data-screen=login] #games,body[data-screen=login] #gamesSection,body[data-screen=login] #trucoGame,
 body[data-screen=register] .hero,body[data-screen=register] #games,body[data-screen=register] #gamesSection,body[data-screen=register] #trucoGame{display:none!important}
 body[data-screen=lobby] .hero,body[data-screen=lobby] #games,body[data-screen=lobby] #gamesSection,body[data-screen=lobby] #trucoGame{display:none!important}
 body[data-screen=game] .hero,body[data-screen=game] #games,body[data-screen=game] #gamesSection{display:none!important}
 body[data-screen=login] #arenaLogged,body[data-screen=register] #arenaLogged{display:none!important}
 body[data-screen=lobby] #arenaLogin,body[data-screen=game] #arenaLogin{display:none!important}
 body[data-screen=game] #arenaOnlinePanel{display:none!important}
 body[data-screen=login] #arenaRoomsWrap,body[data-screen=register] #arenaRoomsWrap{display:none!important}
 body[data-screen=login] #arenaLogin,body[data-screen=register] #arenaLogin{display:block!important}
 body[data-screen=register] #arenaEntrar,body[data-screen=login] #arenaCadastrar{display:none!important}
 body[data-screen=login] #arenaLogin h3,body[data-screen=register] #arenaLogin h3{font-size:1.5rem}
 body[data-screen=login] #arenaOnlinePanel>h2,body[data-screen=register] #arenaOnlinePanel>h2{display:none}
 body[data-screen=game] #trucoGame{display:block!important;min-height:75vh}
 body[data-screen=home] #arenaHomeButtons{display:flex!important}
 #arenaHomeButtons{display:none;gap:12px;flex-wrap:wrap;margin:20px 0}
 #arenaHomeButtons button{padding:15px 22px;border-radius:14px}
 body[data-screen=login] #arenaOnlinePanel,body[data-screen=register] #arenaOnlinePanel{max-width:520px;margin:28px auto}
 body[data-screen=login] #arenaOnlinePanel input,body[data-screen=register] #arenaOnlinePanel input{min-height:48px}
 body[data-screen=game] #trucoGame{margin:14px auto;max-width:850px}
 .arena-login-back{margin-top:12px;display:block}
 `;
 document.head.append(style);
 const nav=document.createElement('nav');nav.className='arena-nav';nav.setAttribute('aria-label','Navegação da Arena');
 nav.innerHTML=`<button data-route="home">🏠 Início</button><button data-route="login">🔑 Entrar</button><button data-route="register">📝 Cadastrar</button><button data-route="lobby">🃏 Mesas</button><button data-route="game">🎮 Partida</button>`;
 const header=$('header');if(header)header.after(nav);else document.body.prepend(nav);
 const home=document.createElement('div');home.id='arenaHomeButtons';
 home.innerHTML='<button class="primary" data-route="login">🔑 Entrar</button><button data-route="register">📝 Criar conta</button><button data-route="lobby">🃏 Escolher mesa</button>';
 const hero=$('.hero');if(hero)hero.append(home);
 const games=$('#games');if(games?.parentElement)games.parentElement.id='gamesSection';
 const demo=$('#test');if(demo?.closest('section'))demo.closest('section').id='arenaDemoSection';
 const panel=$('#arenaOnlinePanel');
 if(panel){
   const rooms=$('#arenaRooms');
   if(rooms){
    const wrap=document.createElement('div');wrap.id='arenaRoomsWrap';
    const title=Array.from(panel.children).find(e=>e.tagName==='H3'&&e.textContent.includes('Mesas disponíveis'));
    if(title){title.before(wrap);while(title.nextSibling)wrap.append(title.nextSibling);wrap.prepend(title)}
   }
   const login=$('#arenaLogin');
   if(login){
     const back=document.createElement('button');back.className='arena-login-back';back.textContent='← Voltar ao início';back.onclick=()=>go('home');login.append(back);
   }
 }
 function logged(){return !!window.ArenaOnline?.jogador()}
 function go(next){
   if(!valid.includes(next))next='home';
   if((next==='lobby'||next==='game')&&!logged())next='login';
   route=next;document.body.dataset.screen=route;
   const title=$('#arenaLogin h3');if(title)title.textContent=route==='register'?'Crie sua conta':'Entre na sua conta';
   nav.querySelectorAll('button').forEach(b=>{
    b.setAttribute('aria-current',b.dataset.route===route?'page':'false');
    b.hidden=logged()&&(b.dataset.route==='login'||b.dataset.route==='register');
   });
   if(route==='game'&&!$('#trucoGame')){route='lobby';document.body.dataset.screen=route}
   window.scrollTo({top:0,behavior:'instant'});
 }
 document.addEventListener('click',event=>{
  const btn=event.target.closest('[data-route]');if(btn){event.preventDefault();go(btn.dataset.route)}
 });
 window.ArenaNav={go,current:()=>route};
 // App scripts may initialize the online panel after this file.
 const init=()=>{
  const hash=location.hash.replace('#','');
  go(valid.includes(hash)?hash:(logged()?'lobby':'home'));
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,300));else setTimeout(init,300);
})();
