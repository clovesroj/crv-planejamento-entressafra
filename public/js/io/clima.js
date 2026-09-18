/**
 * Clima atual, via Open-Meteo — gratuita, sem chave, com CORS liberado pra
 * qualquer origem. Ao contrário da ANP, aqui não há bloqueio nem credencial:
 * a chamada sai direto do navegador, sem passar pelo servidor. Cache em
 * memória por coordenada (10 min — clima não muda rápido o bastante pra valer
 * bater sempre) e por termo de busca de cidade, só pra não repetir a mesma
 * consulta a cada tecla apagada e redigitada.
 */
const geoCache = new Map();    // termo -> [{nome,uf,pais,lat,lon}]
const climaCache = new Map();  // "lat,lon" -> {ts, dados}
const TTL = 10 * 60 * 1000;

/** Até 6 cidades que batem o termo (nome ou "nome, uf"), ou [] se não achou nada. */
async function buscarCidades(termo) {
  const t = (termo || "").trim();
  if (t.length < 2) return [];
  if (geoCache.has(t)) return geoCache.get(t);
  const qs = new URLSearchParams({ name: t, count: 6, language: "pt", format: "json" });
  const r = await fetch("https://geocoding-api.open-meteo.com/v1/search?" + qs);
  const d = await r.json().catch(() => ({}));
  const lista = (d.results || []).map(c => ({
    nome: c.name, uf: c.admin1 || "", pais: c.country || "", lat: c.latitude, lon: c.longitude,
  }));
  geoCache.set(t, lista);
  return lista;
}

// código WMO (weather_code) -> [descrição, emoji]; fora da tabela cai no "—"
const CODIGOS = {
  0: ["Céu limpo", "☀️"], 1: ["Poucas nuvens", "🌤️"], 2: ["Parcialmente nublado", "⛅"], 3: ["Nublado", "☁️"],
  45: ["Neblina", "🌫️"], 48: ["Neblina com geada", "🌫️"],
  51: ["Garoa fraca", "🌦️"], 53: ["Garoa", "🌦️"], 55: ["Garoa forte", "🌦️"],
  56: ["Garoa congelante", "🌧️"], 57: ["Garoa congelante forte", "🌧️"],
  61: ["Chuva fraca", "🌧️"], 63: ["Chuva", "🌧️"], 65: ["Chuva forte", "🌧️"],
  66: ["Chuva congelante", "🌧️"], 67: ["Chuva congelante forte", "🌧️"],
  71: ["Neve fraca", "🌨️"], 73: ["Neve", "🌨️"], 75: ["Neve forte", "🌨️"], 77: ["Grãos de neve", "🌨️"],
  80: ["Pancada fraca", "🌧️"], 81: ["Pancada", "🌧️"], 82: ["Pancada forte", "⛈️"],
  85: ["Pancada de neve fraca", "🌨️"], 86: ["Pancada de neve forte", "🌨️"],
  95: ["Trovoada", "⛈️"], 96: ["Trovoada com granizo", "⛈️"], 99: ["Trovoada com granizo forte", "⛈️"],
};
const descricaoCodigo = c => (CODIGOS[c] || ["—", "🌡️"])[0];
const iconeCodigo = c => (CODIGOS[c] || ["—", "🌡️"])[1];

/** {temp, min, max, vento, umidade, codigo, ventoSerie, chuvaSerie, umidadeSerie} pra uma coordenada. */
async function climaAtual(lat, lon) {
  const chave = `${lat.toFixed(2)},${lon.toFixed(2)}`;
  const c = climaCache.get(chave);
  if (c && Date.now() - c.ts < TTL) return c.dados;
  const qs = new URLSearchParams({
    latitude: lat, longitude: lon, timezone: "auto",
    current: "temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m",
    hourly: "precipitation_probability,wind_speed_10m,relative_humidity_2m",
    daily: "temperature_2m_max,temperature_2m_min",
    forecast_days: 2,
  });
  const r = await fetch("https://api.open-meteo.com/v1/forecast?" + qs);
  if (!r.ok) throw new Error("não foi possível buscar o clima agora");
  const d = await r.json();
  const horas = d.hourly.time;
  const agora = new Date();
  let ix0 = horas.findIndex(h => new Date(h) >= agora);
  if (ix0 < 0) ix0 = 0;
  // 4 pontos de 6 em 6h, cobrindo ~as próximas 24h
  const serieDe = chaveSerie => [0, 1, 2, 3]
    .map(k => ix0 + k * 6)
    .filter(ix => ix < horas.length)
    .map(ix => ({ hora: horas[ix], v: d.hourly[chaveSerie][ix] }));
  const dados = {
    temp: d.current.temperature_2m,
    umidade: d.current.relative_humidity_2m,
    vento: d.current.wind_speed_10m,
    codigo: d.current.weather_code,
    max: d.daily.temperature_2m_max[0],
    min: d.daily.temperature_2m_min[0],
    ventoSerie: serieDe("wind_speed_10m"),
    chuvaSerie: serieDe("precipitation_probability"),
    umidadeSerie: serieDe("relative_humidity_2m"),
  };
  climaCache.set(chave, { ts: Date.now(), dados });
  return dados;
}

export { buscarCidades, climaAtual, descricaoCodigo, iconeCodigo };
