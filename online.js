
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

  function saveSession(data) {
    session = data;
    localStorage.setItem(
      'arena_session',
      JSON.stringify(data)
    );
  }

  async function cadastrar(email, senha) {
    return request('/auth/v1/signup', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password: senha
      })
    });
  }

  async function entrar(email, senha) {
    const data = await request(
      '/auth/v1/token?grant_type=password',
      {
        method: 'POST',
        body: JSON.stringify({
          email,
          password: senha
        })
      }
    );

    saveSession(data);
    return data.user;
  }

  async function renovarSessao() {
    if (!session?.refresh_token) return null;

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

  async function garantirSessao() {
    if (!session) return null;

    if (
      session.expires_at &&
      Date.now() / 1000 < session.expires_at - 60
    ) {
      return session.user;
    }

    if (
      !session.expires_at &&
      session.expires_in &&
      session.access_token
    ) {
      return renovarSessao();
    }

    return renovarSessao();
  }

  function jogador() {
    return session?.user || null;
  }

  function sair() {
    session = null;
    localStorage.removeItem('arena_session');
  }

  async function listarMesas() {
    await garantirSessao();

    return request(
      '/rest/v1/ac_rooms' +
      '?select=id,room_code,game,max_players,status,visibility,created_at' +
      '&order=created_at.desc&limit=50'
    );
  }

  async function criarMesa(jogo, capacidade = 4) {
    const user = await garantirSessao();

    if (!user) {
      throw new Error('Entre na sua conta primeiro.');
    }

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
        game: jogo,
        visibility: 'public',
        max_players: capacidade,
        status: 'waiting'
      })
    });

    return mesas[0];
  }

  async function testarConexao() {
    try {
      await request('/auth/v1/settings');
      return {ok: true, mensagem: 'Conectado'};
    } catch (e) {
      return {ok: false, mensagem: e.message};
    }
  }

  return {
    cadastrar,
    entrar,
    sair,
    jogador,
    garantirSessao,
    listarMesas,
    criarMesa,
    testarConexao
  };
})();

window.ArenaOnline = ArenaOnline;
