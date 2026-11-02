/* Arena das Cartas — Navegação Premium */
'use strict';
(()=>{
 const $=s=>document.querySelector(s);
 const routes=['home','login','register','lobby','game','settings'];
 let current='home';
 const nav=document.createElement('nav');nav.id='arenaNav';nav.innerHTML=`<button data-route="home">⌂ <span>Início</span></button><button data-route="lobby">♠ <span>Jogar</span></button><button data-route="login">♙ <span>Entrar</span></button><button data-route="register">✦ <span>Cadastrar</span></button>`;
 document.body.append(nav);
 const back=document.createElement('button');back.id='arenaBack';back.textContent='‹ Voltar às mesas';back.onclick=()=>go('lobby');document.body.append(back);
 const homeActions=document.createElement('div');homeActions.className='home-actions';homeActions.innerHTML='<button class="primary" data-route="lobby">♠ JOGAR AGORA</button><button data-route="register">Criar conta grátis</button>';
 $('.hero')?.append(homeActions);
 function logged(){return !!window.ArenaOnline?.jogador()}
 function go(to){
  if(!routes.includes(to))to='home';
  if((to==='game'||to==='lobby')&&!logged())to='login';
  current=to;document.body.dataset.screen=to;
  const heading=$('#arenaLogin h3');if(heading)heading.textContent=to==='register'?'Crie sua conta':'Bem-vindo de volta';
  const loginButton=$('#arenaEntrar'),registerButton=$('#arenaCadastrar');
  if(loginButton)loginButton.hidden=to==='register';
  if(registerButton)registerButton.hidden=to==='login';
  nav.querySelectorAll('button').forEach(b=>{b.classList.toggle('active',b.dataset.route===to);b.hidden=logged()&&['login','register'].includes(b.dataset.route)});
  if(to==='game')window.dispatchEvent(new Event('arena-game-open'));
  if(to!=='game')window.dispatchEvent(new Event('arena-game-close'));
  window.scrollTo(0,0);
 }
 document.addEventListener('click',e=>{const b=e.target.closest('[data-route]');if(b){e.preventDefault();go(b.dataset.route)}});
 document.addEventListener('click',e=>{if(e.target?.id==='arenaEntrar')setTimeout(()=>{if(logged())go('lobby')},800)});
 document.addEventListener('click',e=>{if(e.target.closest('#games [data-game]'))go(logged()?'lobby':'login')});
 window.ArenaNav={go,current:()=>current};
 setTimeout(()=>go(logged()?'lobby':'home'),400);
})();