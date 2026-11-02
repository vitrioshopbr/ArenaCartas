
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

const online = window.ArenaOnline;

function aviso(texto) {
  const el = $('#arenaMessage');
  if (el) el.textContent = texto;
}

function erroMensagem(erro) {
  return erro?.message || String(erro);
}

function adicionarPainelOnline() {
  const section = document.createElement('section');
  section.className = 'panel';
  section.id = 'arenaOnlinePanel';

  section.innerHTML = `
    <h2>🌐 Arena Online</h2>
    <p id="arenaMessage">
      Cadastro, login e mesas de teste.
      Sem apostas reais.
    </p>

    <div id="arenaLogin">
      <h3>Entrar ou cadastrar</h3>
      <input id="arenaEmail"
        type="email"
        placeholder="Seu e-mail"
        autocomplete="email">

      <input id="arenaPassword"
        type="password"
        placeholder="Sua senha"
        autocomplete="current-password">

      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">
        <button id="arenaEntrar">Entrar</button>
        <button id="arenaCadastrar">Cadastrar</button>
      </div>
    </div>

    <div id="arenaLogged" hidden>
      <p id="arenaUser"></p>
      <button id="arenaSair">Sair</button>

      <h3>Criar mesa de teste</h3>

      <select id="arenaGame">
        ${games.map(g =>
          `<option value="${g[0]}">${g[0]}</option>`
        ).join('')}
      </select>

      <input id="arenaRoomName"
        maxlength="60"
        placeholder="Nome da mesa">

      <select id="arenaCapacity">
        <option value="2">2 jogadores</option>
        <option value="4" selected>4 jogadores</option>
        <option value="6">6 jogadores</option>
      </select>

      <button id="arenaCreate">Criar mesa</button>
    </div>

    <h3>Mesas disponíveis</h3>
    <button id="arenaRefresh">Atualizar mesas</button>
    <div id="arenaRooms" style="margin-top:12px"></div>
  `;

  const footer = document.querySelector('footer');
  footer.parentNode.insertBefore(section, footer);

  section.querySelectorAll('input,select').forEach(el => {
    el.style.cssText += `
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
    throw new Error('A senha deve ter pelo menos 6 caracteres.');
  }

  return {email, senha};
}

async function cadastrar() {
  try {
    const {email, senha} = credenciais();
    aviso('Criando cadastro...');

    const resultado = await online.cadastrar(email, senha);

    if (resultado?.access_token) {
      aviso('Cadastro realizado. Agora entre com sua conta.');
    } else {
      aviso('Cadastro solicitado. Verifique seu e-mail para confirmar a conta, se necessário.');
    }
  } catch (erro) {
    aviso('Erro no cadastro: ' + erroMensagem(erro));
  }
}

async function entrar() {
  try {
    const {email, senha} = credenciais();
    aviso('Entrando...');

    const jogador = await online.entrar(email, senha);

    $('#arenaLogin').hidden = true;
    $('#arenaLogged').hidden = false;
    $('#arenaUser').textContent =
      'Conectado: ' + (jogador.email || 'Jogador');

    aviso('Login realizado com sucesso!');
    await listarMesas();
  } catch (erro) {
    aviso('Erro no login: ' + erroMensagem(erro));
  }
}

function sair() {
  online.sair();
  $('#arenaLogin').hidden = false;
  $('#arenaLogged').hidden = true;
  $('#arenaUser').textContent = '';
  aviso('Você saiu da conta.');
}

async function listarMesas() {
  const area = $('#arenaRooms');
  area.textContent = 'Carregando mesas...';

  try {
    const mesas = await online.listarMesas();
    area.replaceChildren();

    if (!Array.isArray(mesas) || !mesas.length) {
      area.textContent = 'Nenhuma mesa disponível.';
      return;
    }

    mesas.forEach(mesa => {
      const card = document.createElement('div');
      card.style.cssText = `
        padding:12px;
        border:1px solid #527568;
        border-radius:12px;
        margin:8px 0;
      `;

      const titulo = document.createElement('strong');
      titulo.textContent =
        mesa.name || mesa.game || 'Mesa';

      const detalhes = document.createElement('p');
      detalhes.textContent =
        (mesa.game || 'Baralho') +
        ' • Até ' +
        (mesa.max_players || 4) +
        ' jogadores';

      const info = document.createElement('small');
      info.textContent =
        'Mesa de teste — partida ainda indisponível.';

      card.append(titulo, detalhes, info);
      area.appendChild(card);
    });

  } catch (erro) {
    area.textContent =
      'Não foi possível carregar as mesas: ' +
      erroMensagem(erro);
  }
}

async function criarMesa() {
  try {
    const jogo = $('#arenaGame').value;
    const nome = $('#arenaRoomName').value.trim();
    const capacidade = Number($('#arenaCapacity').value);

    if (!nome) {
      throw new Error('Digite o nome da mesa.');
    }

    aviso('Criando mesa...');

    await online.criarMesa(jogo, nome, capacidade);

    aviso('Mesa de teste criada!');
    $('#arenaRoomName').value = '';
    await listarMesas();

  } catch (erro) {
    aviso('Erro ao criar mesa: ' + erroMensagem(erro));
  }
}

$('#games').innerHTML = games.map(([name,sub,suit]) => `
  <button class="game"
    data-game="${name}"
    data-suit="${suit}">
    <span class="suit">${suit}</span>
    <b>${name}</b>
    <small>${sub}</small>
    <span class="tag">PREPARANDO MOTOR DE JOGO</span>
  </button>
`).join('');

$('#games').addEventListener('click', e => {
  const b = e.target.closest('[data-game]');
  if (!b) return;

  show(
    b.dataset.game,
    'Esta modalidade está no catálogo. ' +
    'O motor de regras, os robôs e as partidas ' +
    'multiplayer ainda serão implementados.'
  );
});

$('#settings').onclick = () => {
  show(
    'Áudio e experiência',
    'Os 11 efeitos premium serão adicionados com gravações reais licenciadas.',
    `
      <label>
        <input id="audioEnabled" type="checkbox"
          ${audio.enabled ? 'checked' : ''}>
        Ativar áudio
      </label>

      <label>
        Volume:
        <input id="audioVolume" type="range"
          min="0" max="1" step="0.05"
          value="${audio.volume}">
      </label>

      <label>
        Estilo:
        <select id="audioMode">
          <option value="realista">Realista</option>
          <option value="cinematico">Cinematográfico</option>
        </select>
      </label>

      <button id="saveAudio">
        Salvar preferências
      </button>
    `
  );

  $('#audioMode').value = audio.mode;

  $('#saveAudio').onclick = () => {
    audio.enabled = $('#audioEnabled').checked;
    audio.volume = Number($('#audioVolume').value);
    audio.mode = $('#audioMode').value;

    localStorage.setItem(
      'arena_audio',
      audio.enabled ? 'on' : 'off'
    );
    localStorage.setItem(
      'arena_volume',
      String(audio.volume)
    );
    localStorage.setItem(
      'arena_mode',
      audio.mode
    );

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
  $('#remaining').textContent =
    '52 cartas restantes';
}

$('#test').onclick = () => {
  $('#deck').hidden = false;
  shuffle();
  $('#deck').scrollIntoView({
    behavior:'smooth',
    block:'nearest'
  });
};

$('#draw').onclick = () => {
  if (!deck.length) {
    $('#remaining').textContent =
      'Baralho esgotado. Inicie outro.';
    return;
  }

  const c = deck.pop();

  $('#drawn').textContent = c.r + c.s;
  $('#drawn').style.color =
    ['♥','♦'].includes(c.s)
      ? '#b21f2d'
      : '#142321';

  $('#remaining').textContent =
    deck.length + ' cartas restantes';
};

$('#reset').onclick = shuffle;

if (online) {
  adicionarPainelOnline();
  listarMesas();
} else {
  $('#status').textContent =
    'Arquivo online.js não carregado. Verifique a conexão.';
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('./sw.js')
      .catch(() => {});
  });
}
