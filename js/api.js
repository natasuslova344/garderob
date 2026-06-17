const ApiService = (() => {
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

    try {
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weathercode&timezone=auto`
      );
      if (!res.ok) throw new Error('API error');
      const data = await res.json();

      const temp = Math.round(data.current.temperature_2m);
      const code = data.current.weathercode;
      const desc = weatherCodeToDesc(code);
      const tip = getWeatherTip(temp);

      widget.innerHTML = `
        <div class="weather-temp">${temp > 0 ? '+' : ''}${temp}°C</div>
        <div class="weather-desc">${weatherCodeToEmoji(code)} ${desc}</div>
        <div class="weather-tip">💡 Рекомендуем: <strong>${tip}</strong></div>
        <div class="weather-city">📍 ${city}</div>`;
    } catch {
      widget.innerHTML = `
        <div class="weather-loading">
          <span>⚠️ Не удалось загрузить погоду</span>
        </div>`;
    }
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
