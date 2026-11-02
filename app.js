
'use strict';

const games = [
  ['Truco', 'Paulista e Mineiro', '♠'],
  ['Cacheta', 'Forme suas trincas', '♥'],
  ['Buraco', 'Canastras e duplas', '♣'],
  ['Tranca', 'Estratégia e parceria', '♦'],
  ['Poker', 'Texas Hold’em', '♠'],
  ['Pife', 'Sequências e trincas', '♥'],
  ['Canastra', 'Jogo clássico', '♣']
];

const $ = selector => document.querySelector(selector);
const dialog = $('#dialog');
const online = window.ArenaOnline;

let mesasAtuais = [];
let mesaSelecionada = null;
let atualizando = false;
let timer = null;
let filtroJogo = 'truco';

function mostrarModal(titulo, descricao, controles = '') {
  $('#modalTitle').textContent = titulo;
  $('#modalText').textContent = descricao;
  $('#modalControls').innerHTML = controles;
  dialog.showModal();
}

$('#close').onclick = () => dialog.close();

$('#games').innerHTML = games.map(([nome, descricao, naipe]) => `
  <button class="game" data-game="${nome}">
    <span class="suit">${naipe}</span>
    <b>${nome}</b>
    <small>${descricao}</small>
    <span class="tag">MESAS ONLINE</span>
  </button>
`).join('');

$('#games').onclick = event => {
  const botao = event.target.closest('[data-game]');
  if (!botao) return;

  const jogo = botao.dataset.game.toLowerCase();
  filtroJogo = jogo;

  if ($('#arenaOnlinePanel')) {
    $('#arenaFilter').value = jogo;
    renderizarMesas();
    $('#arenaOnlinePanel').scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }
};

const audio = {
  enabled: localStorage.getItem('arena_audio') !== 'off',
  volume: Number(localStorage.getItem('arena_volume') ?? '0.5'),
  mode: localStorage.getItem('arena_mode') || 'realista'
};

$('#settings').onclick = () => {
  mostrarModal(
    'Configurações',
    'Personalize o áudio do aplicativo.',
    `
      <label>
        <input id="audioEnabled" type="checkbox"
          ${audio.enabled ? 'checked' : ''}>
        Ativar áudio
      </label>
      <label>Volume</label>
      <input id="audioVolume" type="range"
        min="0" max="1" step="0.05"
        value="${audio.volume}">
      <label>Estilo</label>
      <select id="audioMode">
        <option value="realista">Realista</option>
        <option value="cinematico">Cinematográfico</option>
      </select>
      <button id="saveAudio">Salvar</button>
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
    localStorage.setItem('arena_mode', audio.mode);

    dialog.close();
  };
};

// Demonstração do baralho
const suits = ['♠', '♥', '♦', '♣'];
const ranks = [
  'A', '2', '3', '4', '5', '6', '7',
  '8', '9', '10', 'J', 'Q', 'K'
];

let deck = [];

function embaralhar() {
  deck = suits.flatMap(s =>
    ranks.map(r => ({ s, r }))
  );

  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  $('#drawn').textContent = '🂠';
  $('#remaining').textContent = '52 cartas restantes';
}

$('#test').onclick = () => {
  $('#deck').hidden = false;
  embaralhar();

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

  const carta = deck.pop();

  $('#drawn').textContent = carta.r + carta.s;
  $('#drawn').style.color =
    ['♥', '♦'].includes(carta.s) ? '#b21f2d' : '#142321';

  $('#remaining').textContent =
    deck.length + ' cartas restantes';
};

$('#reset').onclick = embaralhar;

// Sistema online
function mensagem(texto) {
  $('#arenaMessage').textContent = texto;
}

function elemento(tag, texto, classe) {
  const el = document.createElement(tag);

  if (texto !== undefined) {
    el.textContent = texto;
  }

  if (classe) el.className = classe;

  return el;
}

function botao(texto, acao, desabilitado = false) {
  const el = elemento('button', texto);
  el.disabled = desabilitado;
  el.onclick = acao;
  return el;
}

function criarPainelOnline() {
  const section = document.createElement('section');
  section.id = 'arenaOnlinePanel';
  section.className = 'panel';

  section.innerHTML = `
    <h2>🌐 Arena Online</h2>
    <p id="arenaMessage">Preparando Arena...</p>

    <div id="arenaLogin">
      <h3>Entrar ou cadastrar</h3>
      <input id="arenaEmail" type="email"
        placeholder="E-mail" autocomplete="email">
      <input id="arenaPassword" type="password"
        placeholder="Senha" autocomplete="current-password">
      <button id="arenaEntrar">Entrar</button>
      <button id="arenaCadastrar">Cadastrar</button>
    </div>

    <div id="arenaLogged" hidden>
      <p id="arenaUser">Jogador conectado</p>
      <button id="arenaSair">Sair da conta</button>

      <h3>🃏 Escolha sua partida</h3>

      <div id="arenaQuick">
        <div class="arenaMode">
          <h3>⚔️ Mano a Mano</h3>
          <p>Você contra outro jogador</p>
          <button class="primary" id="arenaQuick2">
            Entrar em mesa 1×1
          </button>
        </div>

        <div class="arenaMode">
          <h3>🤝 Duplas</h3>
          <p>Dois contra dois</p>
          <button class="primary" id="arenaQuick4">
            Entrar em mesa 2×2
          </button>
        </div>
      </div>

      <div id="arenaWaiting" hidden>
        <h3>⏳ Sala de espera</h3>
        <p id="arenaWaitingCode"></p>
        <p id="arenaWaitingCount"></p>
        <div id="arenaSeats"></div>
        <p id="arenaWaitingText"></p>
        <button id="arenaBot" disabled>
          🤖 Completar com bots (em desenvolvimento)
        </button>
        <button id="arenaLeave">
          Sair da mesa
        </button>
      </div>
    </div>

    <h3>Mesas disponíveis</h3>

    <label>Jogo</label>
    <select id="arenaFilter">
      ${games.map(g => `
        <option value="${g[0].toLowerCase()}">
          ${g[0]}
        </option>
      `).join('')}
    </select>

    <button id="arenaRefresh">Atualizar mesas</button>
    <div id="arenaRooms"></div>
  `;

  const footer = document.querySelector('footer');

  if (footer) {
    footer.before(section);
  } else {
    document.body.append(section);
  }

  section.querySelectorAll('input, select').forEach(el => {
    el.style.cssText = `
      display:block;
      width:100%;
      box-sizing:border-box;
      padding:12px;
      margin:10px 0;
      border-radius:10px;
      background:#102b26;
      color:white;
      border:1px solid #527568;
      font-size:16px;
    `;
  });

  $('#arenaEntrar').onclick = fazerLogin;
  $('#arenaCadastrar').onclick = cadastrar;
  $('#arenaSair').onclick = fazerLogout;

  $('#arenaQuick2').onclick = () => entradaRapida(2);
  $('#arenaQuick4').onclick = () => entradaRapida(4);

  $('#arenaLeave').onclick = sairDaMesa;
  $('#arenaRefresh').onclick = () => carregarMesas();

  $('#arenaFilter').onchange = event => {
    filtroJogo = event.target.value;
    renderizarMesas();
  };
}

function lerCredenciais() {
  const email = $('#arenaEmail').value.trim();
  const senha = $('#arenaPassword').value;

  if (!email || !senha) {
    throw new Error('Informe e-mail e senha.');
  }

  if (senha.length < 6) {
    throw new Error('A senha precisa ter 6 caracteres.');
  }

  return { email, senha };
}

async function cadastrar() {
  try {
    const { email, senha } = lerCredenciais();
    mensagem('Criando cadastro...');

    await online.cadastrar(email, senha);

    mensagem(
      'Cadastro solicitado. Confirme o e-mail, se necessário.'
    );
  } catch (error) {
    mensagem('Erro: ' + error.message);
  }
}

async function mostrarConta(user) {
  $('#arenaLogin').hidden = !!user;
  $('#arenaLogged').hidden = !user;

  if (!user) return;

  $('#arenaUser').textContent = 'Jogador conectado';

  try {
    const perfil = await online.buscarPerfil();

    if (perfil?.nickname?.trim()) {
      $('#arenaUser').textContent =
        '🎮 ' + perfil.nickname.trim();
    }
  } catch {
    // Mantém identificação genérica.
  }
}

async function fazerLogin() {
  try {
    const { email, senha } = lerCredenciais();

    mensagem('Entrando...');

    const user = await online.entrar(email, senha);

    await mostrarConta(user);
    mensagem('Bem-vindo à Arena!');

    await carregarMesas();
    iniciarAtualizacao();
  } catch (error) {
    mensagem('Erro: ' + error.message);
  }
}

function fazerLogout() {
  pararAtualizacao();
  online.sair();

  mesaSelecionada = null;
  mesasAtuais = [];

  mostrarConta(null);
  atualizarSalaEspera();

  $('#arenaRooms').textContent =
    'Entre na sua conta para ver as mesas.';

  mensagem('Você saiu da conta.');
}

function iniciarAtualizacao() {
  pararAtualizacao();

  timer = setInterval(() => {
    if (!document.hidden && online.jogador()) {
      carregarMesas(true);
    }
  }, 10000);
}

function pararAtualizacao() {
  if (timer) clearInterval(timer);
  timer = null;
}

async function carregarMesas(silencioso = false) {
  if (atualizando) return;

  atualizando = true;

  if (!silencioso) {
    $('#arenaRooms').textContent = 'Carregando mesas...';
  }

  try {
    mesasAtuais = await online.listarMesas();

    // Restaura a sala de espera ao reabrir o aplicativo.
    const salvas = mesasAtuais.filter(
      m => m.participating && m.status === 'waiting'
    );

    if (
      mesaSelecionada &&
      !salvas.some(m => m.id === mesaSelecionada)
    ) {
      mesaSelecionada = null;
    }

    if (!mesaSelecionada && salvas.length) {
      mesaSelecionada = salvas[0].id;
    }

    renderizarMesas();
    atualizarSalaEspera();
  } catch (error) {
    if (!silencioso) {
      $('#arenaRooms').textContent =
        'Erro ao carregar: ' + error.message;
    }
  } finally {
    atualizando = false;
  }
}

function renderizarMesas() {
  const area = $('#arenaRooms');
  area.replaceChildren();

  const lista = mesasAtuais.filter(m =>
    m.game === filtroJogo &&
    m.visibility === 'public' &&
    m.status === 'waiting'
  );

  if (!lista.length) {
    area.append(
      elemento(
        'p',
        'Nenhuma mesa aguardando. Use Entrada Rápida para abrir uma.'
      )
    );
    return;
  }

  // Mesas mais próximas de completar aparecem primeiro.
  lista.sort((a, b) =>
    b.total_players - a.total_players
  );

  for (const mesa of lista) {
    const card = elemento('div');

    card.style.cssText = `
      padding:14px;
      margin:10px 0;
      border:1px solid #527568;
      border-radius:12px;
    `;

    const modalidade =
      mesa.max_players === 2
        ? '⚔️ Mano a Mano'
        : mesa.max_players === 4
          ? '🤝 Duplas'
          : 'Mesa de ' + mesa.max_players;

    const titulo = elemento(
      'h3',
      mesa.room_code + ' · ' + modalidade
    );

    const ocupacao = elemento(
      'p',
      mesa.total_players + '/' +
      mesa.max_players + ' jogadores'
    );

    const acao = mesa.participating
      ? botao(
          'Abrir sala de espera',
          () => {
            mesaSelecionada = mesa.id;
            atualizarSalaEspera();

            $('#arenaWaiting').scrollIntoView({
              behavior: 'smooth',
              block: 'nearest'
            });
          }
        )
      : botao(
          'Entrar nesta mesa',
          () => entrarEmMesa(mesa),
          mesa.total_players >= mesa.max_players
        );

    card.append(titulo, ocupacao, acao);
    area.append(card);
  }
}

function atualizarSalaEspera() {
  const area = $('#arenaWaiting');

  if (!mesaSelecionada) {
    area.hidden = true;
    return;
  }

  const mesa = mesasAtuais.find(
    m => m.id === mesaSelecionada
  );

  if (!mesa || !mesa.participating) {
    area.hidden = true;
    return;
  }

  area.hidden = false;

  $('#arenaWaitingCode').textContent =
    'Mesa ' + mesa.room_code;

  $('#arenaWaitingCount').textContent =
    mesa.total_players + '/' +
    mesa.max_players + ' jogadores';

  const vagas = $('#arenaSeats');
  vagas.replaceChildren();

  for (let i = 0; i < mesa.max_players; i++) {
    const ocupado = i < mesa.total_players;

    const assento = elemento(
      'span',
      ocupado ? '👤' : '➕'
    );

    assento.style.cssText = `
      display:inline-flex;
      align-items:center;
      justify-content:center;
      width:46px;
      height:46px;
      margin:5px;
      border-radius:50%;
      background:${ocupado ? '#24694e' : '#253d38'};
      border:1px solid #527568;
      font-size:23px;
    `;

    vagas.append(assento);
  }

  const faltam =
    mesa.max_players - mesa.total_players;

  $('#arenaWaitingText').textContent =
    faltam > 0
      ? 'Aguardando ' + faltam +
        (faltam === 1 ? ' jogador...' : ' jogadores...')
      : 'Mesa completa! Motor de partida em desenvolvimento.';

  $('#arenaBot').disabled = true;
}

async function entradaRapida(capacidade) {
  const botoes = [
    $('#arenaQuick2'),
    $('#arenaQuick4')
  ];

  try {
    botoes.forEach(b => b.disabled = true);

    mensagem(
      'Procurando mesa de ' +
      capacidade + ' jogadores...'
    );

    const resultado = await online.entradaRapida(
      filtroJogo,
      capacidade
    );

    mesaSelecionada = resultado.room_id;

    mensagem(
      'Você entrou na mesa ' +
      resultado.room_code + '!'
    );

    await carregarMesas();

    $('#arenaWaiting').scrollIntoView({
      behavior: 'smooth',
      block: 'nearest'
    });
  } catch (error) {
    mensagem('Erro: ' + error.message);
  } finally {
    botoes.forEach(b => b.disabled = false);
  }
}

async function entrarEmMesa(mesa) {
  try {
    mensagem('Entrando na mesa...');

    await online.entrarMesa(mesa.id);

    mesaSelecionada = mesa.id;

    mensagem(
      'Você entrou na mesa ' +
      mesa.room_code + '!'
    );

    await carregarMesas();

    $('#arenaWaiting').scrollIntoView({
      behavior: 'smooth',
      block: 'nearest'
    });
  } catch (error) {
    mensagem('Erro: ' + error.message);
  }
}

async function sairDaMesa() {
  if (!mesaSelecionada) return;

  const id = mesaSelecionada;
  const botaoSair = $('#arenaLeave');

  try {
    botaoSair.disabled = true;
    mensagem('Saindo da mesa...');

    await online.sairMesa(id);

    mesaSelecionada = null;

    mensagem('Você saiu da mesa.');

    await carregarMesas();
  } catch (error) {
    mensagem('Erro: ' + error.message);
  } finally {
    botaoSair.disabled = false;
  }
}

async function iniciarOnline() {
  if (!online) {
    $('#status').textContent =
      'Sistema online indisponível.';
    return;
  }

  criarPainelOnline();

  try {
    const user = await online.garantirSessao();

    await mostrarConta(user);

    if (user) {
      mensagem('Bem-vindo à Arena!');
      await carregarMesas();
      iniciarAtualizacao();
    } else {
      mensagem('Entre ou cadastre-se para jogar.');
    }
  } catch (error) {
    mensagem('Erro ao conectar: ' + error.message);
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
