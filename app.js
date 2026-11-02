
'use strict';

const games = [
  ['Truco','Paulista e Mineiro','♠'],
  ['Cacheta','Forme suas trincas','♥'],
  ['Buraco','Canastras e duplas','♣'],
  ['Tranca','Estratégia e parceria','♦'],
  ['Poker','Texas Hold’em','♠'],
  ['Pife','Sequências e trincas','♥'],
  ['Canastra','Jogo clássico','♣']
];

const $ = s => document.querySelector(s);
const dialog = $('#dialog');
const online = window.ArenaOnline;

const audio = {
  enabled: localStorage.getItem('arena_audio') !== 'off',
  volume: Number(localStorage.getItem('arena_volume') ?? '0.5'),
  mode: localStorage.getItem('arena_mode') || 'realista'
};

function show(title, description, controls = '') {
  $('#modalTitle').textContent = title;
  $('#modalText').textContent = description;
  $('#modalControls').innerHTML = controls;
  dialog.showModal();
}

$('#close').onclick = () => dialog.close();

$('#games').innerHTML = games.map(([name,sub,suit]) => `
  <button class="game" data-game="${name}">
    <span class="suit">${suit}</span>
    <b>${name}</b>
    <small>${sub}</small>
    <span class="tag">PREPARANDO MOTOR DE JOGO</span>
  </button>
`).join('');

$('#games').onclick = e => {
  const b = e.target.closest('[data-game]');
  if (!b) return;

  show(
    b.dataset.game,
    'O motor completo desta modalidade ainda está em desenvolvimento.'
  );
};

$('#settings').onclick = () => {
  show('Áudio e experiência',
    'Preferências de áudio. Os efeitos premium serão adicionados posteriormente.',
    `
    <label><input id="audioEnabled" type="checkbox"
      ${audio.enabled ? 'checked' : ''}> Ativar áudio</label>
    <label>Volume
      <input id="audioVolume" type="range" min="0"
        max="1" step="0.05" value="${audio.volume}">
    </label>
    <label>Estilo
      <select id="audioMode">
        <option value="realista">Realista</option>
        <option value="cinematico">Cinematográfico</option>
      </select>
    </label>
    <button id="saveAudio">Salvar</button>`
  );

  $('#audioMode').value = audio.mode;

  $('#saveAudio').onclick = () => {
    audio.enabled = $('#audioEnabled').checked;
    audio.volume = Number($('#audioVolume').value);
    audio.mode = $('#audioMode').value;

    localStorage.setItem(
      'arena_audio', audio.enabled ? 'on' : 'off'
    );
    localStorage.setItem(
      'arena_volume', String(audio.volume)
    );
    localStorage.setItem('arena_mode', audio.mode);
    dialog.close();
  };
};

const suits = ['♠','♥','♦','♣'];
const ranks = [
  'A','2','3','4','5','6','7',
  '8','9','10','J','Q','K'
];

let deck = [];

function shuffle() {
  deck = suits.flatMap(s =>
    ranks.map(r => ({s,r}))
  );

  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i],deck[j]] = [deck[j],deck[i]];
  }

  $('#drawn').textContent = '🂠';
  $('#remaining').textContent = '52 cartas restantes';
}

$('#test').onclick = () => {
  $('#deck').hidden = false;
  shuffle();
  $('#deck').scrollIntoView({
    behavior: 'smooth',
    block: 'nearest'
  });
};

$('#draw').onclick = () => {
  if (!deck.length) {
    $('#remaining').textContent = 'Baralho esgotado.';
    return;
  }

  const c = deck.pop();
  $('#drawn').textContent = c.r + c.s;
  $('#drawn').style.color =
    ['♥','♦'].includes(c.s) ? '#b21f2d' : '#142321';

  $('#remaining').textContent =
    deck.length + ' cartas restantes';
};

$('#reset').onclick = shuffle;

function message(text) {
  $('#arenaMessage').textContent = text;
}

function setLogged(user) {
  $('#arenaLogin').hidden = !!user;
  $('#arenaLogged').hidden = !user;

  $('#arenaUser').textContent = user
    ? 'Conectado: ' + user.email
    : '';
}

function makeOnlinePanel() {
  const section = document.createElement('section');
  section.className = 'panel';
  section.id = 'arenaOnlinePanel';

  section.innerHTML = `
    <h2>🌐 Arena Online</h2>
    <p id="arenaMessage">Entre para criar mesas.</p>

    <div id="arenaLogin">
      <h3>Cadastro e login</h3>
      <input id="arenaEmail" type="email"
        placeholder="Seu e-mail" autocomplete="email">
      <input id="arenaPassword" type="password"
        placeholder="Sua senha" autocomplete="current-password">
      <button id="arenaEntrar">Entrar</button>
      <button id="arenaCadastrar">Cadastrar</button>
    </div>

    <div id="arenaLogged" hidden>
      <p id="arenaUser"></p>
      <button id="arenaSair">Sair</button>

      <h3>Nova mesa</h3>
      <label>Escolha o jogo</label>
      <select id="arenaGame">
        ${games.map(g =>
          `<option value="${g[0]}">${g[0]}</option>`
        ).join('')}
      </select>

      <label>Quantidade de jogadores</label>
      <select id="arenaCapacity">
        <option value="2">2 jogadores</option>
        <option value="4" selected>4 jogadores</option>
        <option value="6">6 jogadores</option>
      </select>

      <p>O número da mesa será gerado automaticamente.</p>
      <button class="primary" id="arenaCreate">
        Criar mesa
      </button>
    </div>

    <h3>Mesas disponíveis</h3>
    <button id="arenaRefresh">Atualizar mesas</button>
    <div id="arenaRooms"></div>
  `;

  document.querySelector('footer').before(section);

  section.querySelectorAll('input,select').forEach(el => {
    el.style.cssText = `
      display:block;
      width:100%;
      box-sizing:border-box;
      margin:10px 0;
      padding:12px;
      border-radius:10px;
      background:#102b26;
      color:white;
      border:1px solid #527568;
      font-size:16px;
    `;
  });

  $('#arenaCadastrar').onclick = cadastrar;
  $('#arenaEntrar').onclick = entrar;
  $('#arenaSair').onclick = sair;
  $('#arenaCreate').onclick = criarMesa;
  $('#arenaRefresh').onclick = listarMesas;
}

function credenciais() {
  const email = $('#arenaEmail').value.trim();
  const senha = $('#arenaPassword').value;

  if (!email || !senha) {
    throw new Error('Informe e-mail e senha.');
  }

  if (senha.length < 6) {
    throw new Error('Senha mínima: 6 caracteres.');
  }

  return {email, senha};
}

async function cadastrar() {
  try {
    const {email, senha} = credenciais();
    message('Cadastrando...');
    await online.cadastrar(email, senha);
    message('Cadastro solicitado. Verifique seu e-mail, se necessário.');
  } catch (e) {
    message('Erro no cadastro: ' + e.message);
  }
}

async function entrar() {
  try {
    const {email, senha} = credenciais();
    message('Entrando...');
    const user = await online.entrar(email, senha);
    setLogged(user);
    message('Login realizado!');
    await listarMesas();
  } catch (e) {
    message('Erro no login: ' + e.message);
  }
}

function sair() {
  online.sair();
  setLogged(null);
  message('Você saiu da conta.');
}

async function listarMesas() {
  const area = $('#arenaRooms');
  area.textContent = 'Carregando mesas...';

  try {
    const mesas = await online.listarMesas();
    area.replaceChildren();

    if (!mesas.length) {
      area.textContent = 'Nenhuma mesa disponível.';
      return;
    }

    for (const mesa of mesas) {
      const card = document.createElement('div');
      card.style.cssText = `
        padding:14px;
        margin:10px 0;
        border:1px solid #527568;
        border-radius:12px;
      `;

      const title = document.createElement('h3');
      title.textContent =
        (mesa.room_code || 'Mesa sem número') +
        ' · ' + mesa.game;

      const details = document.createElement('p');
      details.textContent =
        'Até ' + mesa.max_players +
        ' jogadores · ' +
        (mesa.status === 'waiting'
          ? 'Aguardando jogadores'
          : mesa.status);

      const note = document.createElement('small');
      note.textContent =
        'Entrada na partida em desenvolvimento';

      card.append(title, details, note);
      area.append(card);
    }
  } catch (e) {
    area.textContent = 'Erro: ' + e.message;
  }
}

async function criarMesa() {
  const button = $('#arenaCreate');

  try {
    button.disabled = true;
    message('Criando mesa...');

    const jogo = $('#arenaGame').value;
    const capacidade = Number($('#arenaCapacity').value);

    const mesa = await online.criarMesa(jogo, capacidade);

    message(
      'Mesa ' + mesa.room_code +
      ' criada com sucesso!'
    );

    await listarMesas();
  } catch (e) {
    message('Erro ao criar mesa: ' + e.message);
  } finally {
    button.disabled = false;
  }
}

async function iniciarOnline() {
  if (!online) {
    $('#status').textContent =
      'Conexão online não carregada.';
    return;
  }

  makeOnlinePanel();

  const user = await online.garantirSessao();
  setLogged(user);

  if (user) {
    message('Conectado: ' + user.email);
    await listarMesas();
  } else {
    message('Entre ou cadastre-se para jogar online.');
  }
}

iniciarOnline();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('./sw.js')
      .catch(() => {});
  });
}
