const Theme = (() => {
  const KEY = 'wardrobe_theme';

  const get = () => localStorage.getItem(KEY) || 'light';

  const apply = (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
  };

  const init = () => {
    apply(get());
  };

  const toggle = () => {
    const next = get() === 'dark' ? 'light' : 'dark';
    localStorage.setItem(KEY, next);
    apply(next);
    return next;
  };

  return { init, get, toggle };
})();


const Toast = (() => {
  const container = document.getElementById('toast-container');

  const show = (message, type = 'success', duration = 3000) => {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icons = { success: '✓', error: '✕', info: 'ℹ' };
    toast.innerHTML = `<span>${icons[type] || '✓'}</span><span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('removing');
      toast.addEventListener('animationend', () => toast.remove(), { once: true });
    }, duration);
  };

  return { show };
})();


const Modal = (() => {
  const open = (id) => {
    const overlay = document.getElementById(id);
    if (overlay) {
      overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  };

  const close = (id) => {
    const overlay = document.getElementById(id);
    if (overlay) {
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    }
  };

  const closeAll = () => {
    document.querySelectorAll('.modal-overlay.active').forEach(el => {
      el.classList.remove('active');
    });
    document.body.style.overflow = '';
  };

  return { open, close, closeAll };
})();

const ConfirmDialog = (() => {
  let pendingAction = null;
  let pendingCardEl = null;

  const open = (action, opts = {}) => {
    const {
      cardEl = null,
      title = 'Удалить?',
      text = 'Это действие нельзя отменить.',
    } = opts;

    pendingAction = action;
    pendingCardEl = cardEl;

    const titleEl = document.getElementById('modal-confirm-title');
    const textEl = document.getElementById('modal-confirm-text');
    if (titleEl) titleEl.textContent = title;
    if (textEl) textEl.textContent = text;

    Modal.open('modal-confirm-overlay');
  };

  const confirm = () => {
    if (!pendingAction) return;
    const action = pendingAction;
    const cardEl = pendingCardEl;
    pendingAction = null;
    pendingCardEl = null;

    if (cardEl) {
      cardEl.classList.add('removing');
      cardEl.addEventListener('animationend', () => {
        action();
        Modal.close('modal-confirm-overlay');
      }, { once: true });
    } else {
      action();
      Modal.close('modal-confirm-overlay');
    }
  };

  const cancel = () => {
    pendingAction = null;
    pendingCardEl = null;
    Modal.close('modal-confirm-overlay');
  };

  return { open, confirm, cancel };
})();


const formatDate = (isoStr) => {
  if (!isoStr) return 'Не надевалась';
  const d = new Date(isoStr);
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
};

const daysSince = (isoStr) => {
  if (!isoStr) return null;
  return Math.floor((Date.now() - new Date(isoStr)) / (1000 * 60 * 60 * 24));
};

const formatPrice = (price) => {
  const num = Number(price) || 0;
  return num.toLocaleString('ru-RU') + ' ₽';
};

const extractWbArticle = (url) => {
  if (!url) return null;
  const match = String(url).match(/catalog\/(\d+)/);
  return match ? match[1] : null;
};

const CATEGORY_ICONS = {
  'Верх': '👔',
  'Низ': '👖',
  'Обувь': '👟',
  'Аксессуар': '👜',
  'Верхняя одежда': '🧥',
  'Платье': '👗',
};

const SEASON_ICONS = {
  'Весна': '🌸',
  'Лето': '☀️',
  'Осень': '🍂',
  'Зима': '❄️',
  'Всесезонное': '🔄',
};

const WEATHER_TIPS = {
  cold: ['пальто или куртку', 'тёплый свитер', 'шарф и перчатки'],
  cool: ['лёгкую куртку', 'джинсы и свитер', 'кардиган'],
  warm: ['лёгкую рубашку', 'летнее платье', 'легкие брюки'],
  hot: ['шорты и футболку', 'лёгкое платье', 'сандалии'],
};

const getWeatherTip = (temp) => {
  const tips = temp < 5 ? WEATHER_TIPS.cold :
               temp < 15 ? WEATHER_TIPS.cool :
               temp < 25 ? WEATHER_TIPS.warm : WEATHER_TIPS.hot;
  return tips[Math.floor(Math.random() * tips.length)];
};

const CATEGORY_OPTIONS = ['Верх', 'Низ', 'Обувь', 'Аксессуар', 'Верхняя одежда', 'Платье'];
const SEASON_OPTIONS = ['Весна', 'Лето', 'Осень', 'Зима', 'Всесезонное'];
const STATUS_OPTIONS = [
  { value: 'clean', label: 'Чистое' },
  { value: 'washing', label: 'В стирке' },
];

const isValidUrl = (str) => {
  try {
    const url = new URL(str);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};
