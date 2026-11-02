
'use strict';

const ARENA_URL = 'https://vxqbfkjcmzbrhadkoyqx.supabase.co';
const ARENA_KEY = 'sb_publishable_rS9ZWWdxEN9bOKHiVjnryg_835_hS6a';

const ArenaOnline = (() => {
  let session = null;

  try {
    session = JSON.parse(
      localStorage.getItem('arena_session') || 'null'
    );
  } catch {
    session = null;
  }

  function saveSession(data) {
    session = {
      ...data,
      expires_at: Math.floor(Date.now() / 1000) +
        (data.expires_in || 3600)
    };
    localStorage.setItem(
      'arena_session', JSON.stringify(session)
    );
  }

  async function request(path, options = {}) {
    const headers = {
      apikey: ARENA_KEY,
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (session?.access_token) {
      headers.Authorization =
        'Bearer ' + session.access_token;
    }

    const response = await fetch(ARENA_URL + path, {
      ...options, headers
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
      body: JSON.stringify({
        email, password: senha
      })
    });
  }

  async function entrar(email, senha) {
    const data = await request(
      '/auth/v1/token?grant_type=password',
      {
        method: 'POST',
        body: JSON.stringify({
          email, password: senha
        })
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

  async function listarMesas() {
    const user = await garantirSessao();
    if (!user) throw new Error('Faça login primeiro.');

    const [mesas, participantes] = await Promise.all([
      request(
        '/rest/v1/ac_rooms' +
        '?select=id,room_code,game,max_players,status,visibility,owner_id,created_at' +
        '&order=created_at.desc&limit=50'
      ),
      request(
        '/rest/v1/ac_room_players' +
        '?select=room_id,user_id'
      )
    ]);

    return mesas.map(mesa => {
      const pessoas = participantes.filter(
        p => p.room_id === mesa.id
      );

      return {
        ...mesa,
        total_players: pessoas.length,
        participating: pessoas.some(
          p => p.user_id === user.id
        )
      };
    });
  }

  async function criarMesa(jogo, capacidade = 4) {
    const user = await garantirSessao();
    if (!user) throw new Error('Entre na sua conta.');

    const permitidos = [
      'Truco', 'Cacheta', 'Buraco',
      'Tranca', 'Poker', 'Pife', 'Canastra'
    ];

    if (!permitidos.includes(jogo)) {
      throw new Error('Jogo inválido.');
    }

    const mesas = await request('/rest/v1/ac_rooms', {
      method: 'POST',
      headers: {
        Prefer: 'return=representation'
      },
      body: JSON.stringify({
        owner_id: user.id,
        game: jogo.toLowerCase(),
        visibility: 'public',
        max_players: capacidade,
        status: 'waiting'
      })
    });

    return mesas[0];
  }

  async function entrarMesa(roomId) {
    const user = await garantirSessao();
    if (!user) throw new Error('Faça login primeiro.');

    return request('/rest/v1/rpc/ac_join_room', {
      method: 'POST',
      body: JSON.stringify({
        p_room_id: roomId
      })
    });
  }

  async function sairMesa(roomId) {
    const user = await garantirSessao();
    if (!user) throw new Error('Faça login primeiro.');

    return request('/rest/v1/rpc/ac_leave_room', {
      method: 'POST',
      body: JSON.stringify({
        p_room_id: roomId
      })
    });
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

  return {
    cadastrar,
    entrar,
    sair,
    jogador,
    garantirSessao,
    listarMesas,
    criarMesa,
    entrarMesa,
    sairMesa,
    buscarPerfil
  };
})();

window.ArenaOnline = ArenaOnline;
