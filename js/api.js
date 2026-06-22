const ApiService = (() => {
  const WEATHER_FETCH_TIMEOUT_MS = 5000;

  const fetchWithTimeout = async (url, timeoutMs = WEATHER_FETCH_TIMEOUT_MS) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(url, { signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }
  };

  const fetchFromOpenMeteo = async (lat, lon) => {
    const res = await fetchWithTimeout(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weathercode&timezone=auto`
    );
    if (!res.ok) throw new Error('open-meteo error');
    const data = await res.json();
    const temp = Math.round(data.current.temperature_2m);
    const code = data.current.weathercode;
    return { temp, desc: weatherCodeToDesc(code), emoji: weatherCodeToEmoji(code) };
  };

  const fetchFromWttr = async (lat, lon) => {
    const res = await fetchWithTimeout(`https://wttr.in/${lat},${lon}?format=j1`);
    if (!res.ok) throw new Error('wttr error');
    const data = await res.json();
    const cur = data.current_condition && data.current_condition[0];
    if (!cur) throw new Error('wttr empty response');
    const temp = Math.round(parseFloat(cur.temp_C));
    const descText = (cur.weatherDesc && cur.weatherDesc[0] && cur.weatherDesc[0].value) || '';
    return { temp, ...wttrDescToRu(descText) };
  };

  const fetchWeather = async () => {
    const widget = document.getElementById('weather-widget');
    if (!widget) return;

    widget.innerHTML = `
      <div class="weather-loading">
        <div class="spinner" style="width:16px;height:16px;border-width:2px;border-color:rgba(255,255,255,0.3);border-top-color:white;"></div>
        <span>Загружаем погоду...</span>
      </div>`;

    const lat = 57.1522;
    const lon = 65.5272;
    const city = 'Тюмень';

    const providers = [fetchFromOpenMeteo, fetchFromWttr];
    let result = null;

    for (const provider of providers) {
      try {
        result = await provider(lat, lon);
        break;
      } catch {

      }
    }

    if (!result) {
      widget.innerHTML = `
        <div class="weather-loading">
          <span>⚠️ Не удалось загрузить погоду</span>
        </div>`;
      return;
    }

    const { temp, desc, emoji } = result;
    const tip = getWeatherTip(temp);

    widget.innerHTML = `
      <div class="weather-temp">${temp > 0 ? '+' : ''}${temp}°C</div>
      <div class="weather-desc">${emoji} ${desc}</div>
      <div class="weather-tip">💡 Рекомендуем: <strong>${tip}</strong></div>
      <div class="weather-city">📍 ${city}</div>`;
  };

  const weatherCodeToDesc = (code) => {
    if (code === 0) return 'Ясно';
    if (code <= 3) return 'Переменная облачность';
    if (code <= 48) return 'Туман';
    if (code <= 57) return 'Морось';
    if (code <= 67) return 'Дождь';
    if (code <= 77) return 'Снег';
    if (code <= 82) return 'Ливень';
    return 'Гроза';
  };

  const weatherCodeToEmoji = (code) => {
    if (code === 0) return '☀️';
    if (code <= 3) return '⛅';
    if (code <= 48) return '🌫️';
    if (code <= 67) return '🌧️';
    if (code <= 77) return '❄️';
    if (code <= 82) return '🌦️';
    return '⛈️';
  };

  const wttrDescToRu = (text) => {
    const t = text.toLowerCase();
    if (t.includes('thunder')) return { desc: 'Гроза', emoji: '⛈️' };
    if (t.includes('snow') || t.includes('sleet') || t.includes('ice')) return { desc: 'Снег', emoji: '❄️' };
    if (t.includes('drizzle')) return { desc: 'Морось', emoji: '🌧️' };
    if (t.includes('heavy rain') || t.includes('torrential')) return { desc: 'Ливень', emoji: '🌦️' };
    if (t.includes('rain') || t.includes('shower')) return { desc: 'Дождь', emoji: '🌧️' };
    if (t.includes('fog') || t.includes('mist')) return { desc: 'Туман', emoji: '🌫️' };
    if (t.includes('overcast') || t.includes('cloud')) return { desc: 'Переменная облачность', emoji: '⛅' };
    if (t.includes('sunny') || t.includes('clear')) return { desc: 'Ясно', emoji: '☀️' };
    return { desc: 'Переменная облачность', emoji: '⛅' };
  };

  const fetchStylePeople = async () => {
    const container = document.getElementById('api-users-container');
    if (!container) return;

    container.innerHTML = Array(3).fill(0).map(() => `
      <div class="api-user-item">
        <div class="skeleton" style="width:28px;height:28px;border-radius:50%;flex-shrink:0;"></div>
        <div style="flex:1;display:flex;flex-direction:column;gap:4px;">
          <div class="skeleton" style="height:10px;width:80%;border-radius:4px;"></div>
          <div class="skeleton" style="height:9px;width:60%;border-radius:4px;"></div>
        </div>
      </div>`).join('');

    try {
      const res = await fetch('https://randomuser.me/api/?results=4&inc=name,email,picture&nat=fr,gb,de');
      if (!res.ok) throw new Error('API error');
      const data = await res.json();

      container.innerHTML = data.results.map(u => `
        <div class="api-user-item">
          <img class="api-user-avatar" src="${u.picture.thumbnail}" alt="${u.name.first}">
          <div class="api-user-info">
            <div class="api-user-name">${u.name.first} ${u.name.last}</div>
            <div class="api-user-email">${u.email}</div>
          </div>
        </div>`).join('');
    } catch {
      container.innerHTML = `<div style="font-size:0.75rem;color:var(--color-text-muted);padding:var(--space-2);">⚠️ Не удалось загрузить стилистов</div>`;
    }
  };

  return { fetchWeather, fetchStylePeople };
})();
