const Dashboard = (() => {
  const CATEGORY_COLORS = {
    'Верх': '#A55166',
    'Низ': '#D38C9D',
    'Обувь': '#8A3D52',
    'Аксессуар': '#E2B4C1',
    'Верхняя одежда': '#C98AA0',
    'Платье': '#7A4D5B',
  };

  const MONTH_NAMES = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];

  const buildDonutGradient = (counts, total) => {
    let cursor = 0;
    const stops = [];
    Object.entries(counts).forEach(([cat, count]) => {
      if (!count) return;
      const pct = (count / total) * 100;
      const color = CATEGORY_COLORS[cat] || '#B08090';
      stops.push(`${color} ${cursor}% ${cursor + pct}%`);
      cursor += pct;
    });
    return stops.join(', ');
  };

  const renderLegend = (counts, total) => {
    return Object.entries(counts)
      .filter(([, count]) => count > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, count]) => {
        const pct = Math.round((count / total) * 100);
        const color = CATEGORY_COLORS[cat] || '#B08090';
        return `
          <div class="donut-legend-item">
            <span class="donut-legend-swatch" style="background:${color}"></span>
            <span class="donut-legend-label">${cat}</span>
            <span class="donut-legend-value">${count} · ${pct}%</span>
          </div>`;
      }).join('');
  };

  const renderCategoryChart = () => {
    const counts = AppState.getCategoryCounts();
    const total = AppState.items.length;

    if (!total) {
      return `<div class="dashboard-empty">Добавьте вещи в гардероб, чтобы увидеть распределение по категориям</div>`;
    }

    const gradient = buildDonutGradient(counts, total);
    return `
      <div class="donut-chart-wrap">
        <div class="donut-chart" style="background: conic-gradient(${gradient})">
          <div class="donut-chart-hole">
            <div class="donut-chart-total">${total}</div>
            <div class="donut-chart-total-label">${total === 1 ? 'вещь' : 'вещей'}</div>
          </div>
        </div>
        <div class="donut-legend">${renderLegend(counts, total)}</div>
      </div>`;
  };

  const renderMonthlyChart = () => {
    const data = AppState.getMonthlyWearStats(6);
    const max = Math.max(1, ...data.map(d => d.count));
    const hasAny = data.some(d => d.count > 0);

    const bars = data.map(d => {
      const heightPct = d.count > 0 ? Math.max(Math.round((d.count / max) * 100), 6) : 2;
      return `
        <div class="bar-chart-col">
          <div class="bar-chart-value">${d.count || ''}</div>
          <div class="bar-chart-track">
            <div class="bar-chart-bar" style="height:${heightPct}%"></div>
          </div>
          <div class="bar-chart-label">${MONTH_NAMES[d.month]}</div>
        </div>`;
    }).join('');

    return `
      <div class="bar-chart">${bars}</div>
      ${hasAny ? '' : '<div class="dashboard-empty">Пока нет отметок «надето» за последние полгода</div>'}`;
  };

  const renderTopItems = () => {
    const items = AppState.getTopWornItems(5);
    if (!items.length) {
      return `<div class="dashboard-empty">Пока нет данных о носке — отметьте вещи как надетые («✓» на карточке вещи)</div>`;
    }

    return `<div class="top-items-list">${items.map((item, idx) => {
      const icon = CATEGORY_ICONS[item.category] || '👕';
      const imagePart = item.imageUrl
        ? `<img src="${item.imageUrl}" alt="${item.name}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
        : '';
      const placeholderPart = `<div class="top-items-thumb-placeholder" style="${item.imageUrl ? 'display:none' : ''}">${icon}</div>`;
      return `
        <div class="top-items-row">
          <div class="top-items-rank">${idx + 1}</div>
          <div class="top-items-thumb">${imagePart}${placeholderPart}</div>
          <div class="top-items-name" title="${item.name}">${item.name}</div>
          <div class="top-items-count">👁 ${item.wornCount}</div>
        </div>`;
    }).join('')}</div>`;
  };

  const renderStatCards = () => {
    const stats = AppState.getStats();
    const wishlistTotal = AppState.getWishlistTotal();
    const cards = [
      { icon: '👗', value: stats.total, label: 'Вещей в гардеробе' },
      { icon: '👁', value: stats.totalWorn, label: 'Всего отметок «надето»' },
      { icon: '😴', value: stats.forgotten, label: 'Забытых вещей' },
      { icon: '✨', value: AppState.looks.length, label: 'Сохранённых образов' },
      { icon: '🛍️', value: formatPrice(wishlistTotal), label: 'В вишлисте на сумму' },
    ];

    return cards.map(c => `
      <div class="dashboard-stat-card">
        <div class="dashboard-stat-icon">${c.icon}</div>
        <div class="dashboard-stat-text">
          <div class="dashboard-stat-value">${c.value}</div>
          <div class="dashboard-stat-label">${c.label}</div>
        </div>
      </div>`).join('');
  };

  const render = () => {
    const statsEl = document.getElementById('dashboard-stats');
    if (!statsEl) return;

    statsEl.innerHTML = renderStatCards();

    const categoryEl = document.getElementById('dashboard-category-chart');
    if (categoryEl) categoryEl.innerHTML = renderCategoryChart();

    const monthlyEl = document.getElementById('dashboard-monthly-chart');
    if (monthlyEl) monthlyEl.innerHTML = renderMonthlyChart();

    const topEl = document.getElementById('dashboard-top-items');
    if (topEl) topEl.innerHTML = renderTopItems();
  };

  return { render };
})();
