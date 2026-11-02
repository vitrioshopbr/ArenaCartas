
const ARENA_URL = "https://vxqbfkjcmzbrhadkoyqx.supabase.co";
const ARENA_KEY = "sb_publishable_rS9ZWWdxEN9bOKHiVjnryg_835_hS6a";

const ArenaOnline = (() => {
  let token = null;
  let user = null;

  async function request(path, options = {}) {
    const headers = {
      apikey: ARENA_KEY,
      "Content-Type": "application/json",
      ...options.headers
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(ARENA_URL + path, {
      ...options,
      headers
    });

    const body = await response.text();
    let data;
    try {
      data = body ? JSON.parse(body) : null;
    } catch {
      data = body;
    }

    if (!response.ok) {
      throw new Error(
        data?.msg ||
        data?.error_description ||
        data?.message ||
        `Erro ${response.status}`
      );
    }
    return data;
  }

  async function cadastrar(email, senha) {
    return request("/auth/v1/signup", {
      method: "POST",
      body: JSON.stringify({
        email,
        password: senha
      })
    });
  }

  async function entrar(email, senha) {
    const data = await request(
      "/auth/v1/token?grant_type=password",
      {
        method: "POST",
        body: JSON.stringify({
          email,
          password: senha
        })
      }
    );
    token = data.access_token;
    user = data.user;
    return user;
  }

  function sair() {
    token = null;
    user = null;
  }

  function jogador() {
    return user;
  }

  async function listarMesas() {
    return request(
      "/rest/v1/ac_rooms?select=*&order=created_at.desc&limit=30"
    );
  }

  async function criarMesa(jogo, nome, capacidade = 4) {
    if (!user) {
      throw new Error("Entre na sua conta primeiro.");
    }

    return request("/rest/v1/ac_rooms", {
      method: "POST",
      headers: {
        Prefer: "return=representation"
      },
      body: JSON.stringify({
        game: jogo,
        name: nome,
        max_players: capacidade,
        owner_id: user.id
      })
    });
  }

  async function testarConexao() {
    try {
      await request("/auth/v1/settings");
      return {
        ok: true,
        mensagem: "Supabase conectado!"
      };
    } catch (erro) {
      return {
        ok: false,
        mensagem: erro.message
      };
    }
  }

  return {
    cadastrar,
    entrar,
    sair,
    jogador,
    listarMesas,
    criarMesa,
    testarConexao
  };
})();

window.ArenaOnline = ArenaOnline;
