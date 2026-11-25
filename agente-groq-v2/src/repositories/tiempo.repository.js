// REPOSITORIO DEL TIEMPO: la única parte que habla con Open-Meteo
// Open-Meteo es gratis y NO necesita clave. https://open-meteo.com
// Solo pide datos y los devuelve "en crudo". Traducirlos lo hace el service.

const URL_GEOCODING = 'https://geocoding-api.open-meteo.com/v1/search';
const URL_PREVISION = 'https://api.open-meteo.com/v1/forecast';

// Ciudad -> coordenadas. Devuelve null si no la encuentra.
export async function buscarCiudad(ciudad) {
  const url = `${URL_GEOCODING}?name=${encodeURIComponent(ciudad)}&count=1&language=es`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('No se pudo buscar la ciudad');
  const datos = await res.json();

  if (!datos.results || datos.results.length === 0) return null;
  const { latitude, longitude, name, country } = datos.results[0];
  return { latitud: latitude, longitud: longitude, nombre: name, pais: country };
}

// Previsión de UN día en unas coordenadas
export async function obtenerPrevisionDia(latitud, longitud, fecha) {
  const params = new URLSearchParams({
    latitude: latitud,
    longitude: longitud,
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
    timezone: 'auto',
    start_date: fecha,
    end_date: fecha,
  });
  const res = await fetch(`${URL_PREVISION}?${params}`);
  if (!res.ok) throw new Error('No se pudo obtener la previsión');
  const datos = await res.json();

  // "daily" trae arrays; como pedimos un solo día, usamos la posición [0]
  const d = datos.daily;
  return {
    codigo: d.weather_code[0],
    maxima: d.temperature_2m_max[0],
    minima: d.temperature_2m_min[0],
    probabilidadLluvia: d.precipitation_probability_max[0],
  };
}
