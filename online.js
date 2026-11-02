
'use strict';

const ARENA_URL = 'https://vxqbfkjcmzbrhadkoyqx.supabase.co';
const ARENA_KEY = 'sb_publishable_rS9ZWWdxEN9bOKHiVjnryg_835_hS6a';

const ArenaOnline = (() => {
  let session = null;

  try {
    session = JSON.parse(localStorage.getItem('arena_session') || 'null');
  } catch {
    session = null;
  }

  function saveSession(data) {
    session = {
      ...data,
      expires_at: Math.floor(Date.now() / 1000) +
        (data.expires_in || 3600)
    };
    localStorage.setItem('arena_session', JSON.stringify(session));
  }

  async function request(path, options = {}) {
    const headers = {
      apikey: ARENA_KEY,
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (session?.access_token) {
      headers.Authorization = 'Bearer ' + session.access_token;
    }

    const response = await fetch(ARENA_URL + path, {
      ...options,
      headers
    });

    const raw = await response.text();
    let data;

    try {
      data = raw ? JSON.parse(raw) : null;
    } catch {
      data = raw;
    }

    if (!response.ok) {
      throw new Error(
        data?.message ||
        data?.error_description ||
        data?.msg ||
        data?.error ||
        'Erro ' + response.status
      );
    }

    return data;
  }

  async function cadastrar(email, senha) {
    return request('/auth/v1/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password: senha })
    });
  }

  async function entrar(email, senha) {
    const data = await request(
      '/auth/v1/token?grant_type=password',
      {
        method: 'POST',
        body: JSON.stringify({ email, password: senha })
      }
    );

    saveSession(data);
    return data.user;
  }

  async function garantirSessao() {
    if (!session) return null;

    if (
      session.expires_at &&
      Date.now() / 1000 < session.expires_at - 60
    ) {
      return session.user;
    }

    try {
      const data = await request(
        '/auth/v1/token?grant_type=refresh_token',
        {
          method: 'POST',
          body: JSON.stringify({
            refresh_token: session.refresh_token
          })
        }
      );

      saveSession(data);
      return data.user;
    } catch {
      sair();
      return null;
    }
  }

  function jogador() {
    return session?.user || null;
  }

  function sair() {
    session = null;
    localStorage.removeItem('arena_session');
  }

  async function buscarPerfil() {
    const user = await garantirSessao();
    if (!user) return null;

    const rows = await request(
      '/rest/v1/ac_profiles' +
      '?select=id,nickname' +
      '&id=eq.' + encodeURIComponent(user.id) +
      '&limit=1'
    );

    return rows[0] || null;
  }

  async function listarMesas() {
    const user = await garantirSessao();

    if (!user) {
      throw new Error('Entre na sua conta primeiro.');
    }

    const [mesas, contagens] = await Promise.all([
      request(
        '/rest/v1/ac_rooms' +
        '?select=id,room_code,game,max_players,status,visibility,owner_id,created_at' +
        '&order=created_at.desc&limit=100'
      ),
      request('/rest/v1/rpc/ac_room_counts', {
        method: 'POST',
        body: '{}'
      })
    ]);

    const mapa = new Map(
      contagens.map(c => [c.room_id, c])
    );

    return mesas.map(mesa => {
      const contagem = mapa.get(mesa.id);

      return {
        ...mesa,
        total_players: Number(contagem?.total_players || 0),
        participating: !!contagem?.participating
      };
    });
  }

  async function entradaRapida(jogo, capacidade) {
    const user = await garantirSessao();

    if (!user) {
      throw new Error('Faça login primeiro.');
    }

    return request('/rest/v1/rpc/ac_quick_join', {
      method: 'POST',
      body: JSON.stringify({
        p_game: jogo.toLowerCase(),
        p_max_players: capacidade
      })
    });
  }

  async function entrarMesa(roomId) {
    const user = await garantirSessao();

    if (!user) {
      throw new Error('Faça login primeiro.');
    }

    return request('/rest/v1/rpc/ac_join_room', {
      method: 'POST',
      body: JSON.stringify({ p_room_id: roomId })
    });
  }

  async function sairMesa(roomId) {
    const user = await garantirSessao();

    if (!user) {
      throw new Error('Faça login primeiro.');
    }

    return request('/rest/v1/rpc/ac_leave_room', {
      method: 'POST',
      body: JSON.stringify({ p_room_id: roomId })
    });
  }

  return {
    cadastrar,
    entrar,
    sair,
    jogador,
    garantirSessao,
    buscarPerfil,
    listarMesas,
    entradaRapida,
    entrarMesa,
    sairMesa
  };
})();

window.ArenaOnline = ArenaOnline;
