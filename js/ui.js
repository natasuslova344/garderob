const UI = (() => {
  const showAuth = () => {
    document.getElementById('auth-screen').style.display = 'flex';
    document.getElementById('app-screen').classList.remove('active');
  };

  const showApp = () => {
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('app-screen').classList.add('active');

    const user = AppState.currentUser;
    const initials = user.email[0].toUpperCase();
    document.getElementById('user-avatar').textContent = initials;
    document.getElementById('user-name').textContent = user.email.split('@')[0];

    render();
    ApiService.fetchWeather();
    ApiService.fetchStylePeople();
    updateFilterCounts();
    renderEquippedItems();
  };

  const render = () => {
    const items = AppState.getFilteredItems();
    const grid = document.getElementById('wardrobe-grid');
    const countEl = document.getElementById('items-count');

    if (countEl) countEl.textContent = `(${items.length})`;

    if (!items.length) {
      grid.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">👗</div>
          <h3>${AppState.items.length === 0 ? 'Ваш гардероб пуст' : 'Ничего не найдено'}</h3>
          <p>${AppState.items.length === 0 ? 'Нажмите «+ Добавить вещь», чтобы начать' : 'Попробуйте изменить фильтры или запрос поиска'}</p>
        </div>`;
      updateStats();
      return;
    }

    grid.innerHTML = items.map((item, idx) => renderCard(item, idx)).join('');

    // Staggered animation
    grid.querySelectorAll('.card').forEach((card, i) => {
      card.style.animationDelay = `${i * 50}ms`;
    });

    updateStats();
    updateFilterCounts();
    bindCardEvents();
  };

  const renderCard = (item, idx) => {
    const forgotten = AppState.isForgotten(item);
    const days = item.lastWorn ? daysSince(item.lastWorn) : null;
    const icon = CATEGORY_ICONS[item.category] || '👕';

    const imagePart = item.imageUrl
      ? `<img src="${item.imageUrl}" alt="${item.name}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
      : '';
    const placeholderPart = `<div class="card-image-placeholder" style="${item.imageUrl ? 'display:none' : ''}">${icon}</div>`;

    return `
      <div class="card" data-id="${item.id}">
        <div class="card-image-wrap">
          ${imagePart}
          ${placeholderPart}
          ${forgotten ? '<div class="card-badge-forgotten">Забытая</div>' : ''}
          <div class="card-status-dot ${item.status === 'clean' ? 'clean' : 'washing'}" title="${item.status === 'clean' ? 'Чистое' : 'В стирке'}"></div>
        </div>
        <div class="card-body">
          <div class="card-name" title="${item.name}">${item.name}</div>
          <div class="card-meta">
            <span class="card-category">${item.category}</span>
            <span class="card-worn-count">👁 ${item.wornCount || 0}</span>
          </div>
          <div class="card-meta" style="margin-bottom:var(--space-3);font-size:0.7rem;">
            <span title="${item.color}">🎨 ${item.color}</span>
            <span>${item.season}</span>
          </div>
          <div style="font-size:0.7rem;color:var(--color-text-muted);margin-bottom:var(--space-3);">
            ${days !== null ? `${days} дн. назад` : 'Не надевалась'}
          </div>
          <div class="card-actions">
            <button class="card-action-btn wear" data-action="wear" data-id="${item.id}" title="Отметить как надетое">✓</button>
            <button class="card-action-btn" data-action="edit" data-id="${item.id}" title="Редактировать">✏</button>
            <button class="card-action-btn delete" data-action="delete" data-id="${item.id}" title="Удалить">🗑</button>
          </div>
        </div>
      </div>`;
  };

  const bindCardEvents = () => {
    document.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = btn.dataset.action;
        const id = btn.dataset.id;

        if (action === 'wear') handleWear(id);
        else if (action === 'edit') handleEdit(id);
        else if (action === 'delete') handleDelete(id, btn.closest('.card'));
      });
    });
  };

  const handleWear = (id) => {
    const updated = AppState.wearItem(id);
    if (updated) {
      Toast.show('✓ Отмечено как надетое', 'success');
      render();
      renderEquippedItems();
    }
  };

  const handleEdit = (id) => {
    const item = AppState.items.find(i => i.id === id);
    if (item) ItemForm.openForEdit(item);
  };

  let pendingDeleteId = null;
  let pendingDeleteCard = null;

  const handleDelete = (id, cardEl) => {
    pendingDeleteId = id;
    pendingDeleteCard = cardEl;
    Modal.open('modal-confirm-overlay');
  };

  const confirmDelete = () => {
    if (!pendingDeleteId) return;
    if (pendingDeleteCard) {
      pendingDeleteCard.classList.add('removing');
      pendingDeleteCard.addEventListener('animationend', () => {
        AppState.deleteItem(pendingDeleteId);
        pendingDeleteId = null;
        pendingDeleteCard = null;
        Modal.close('modal-confirm-overlay');
        render();
        Toast.show('✓ Вещь удалена', 'info');
      }, { once: true });
    } else {
      AppState.deleteItem(pendingDeleteId);
      pendingDeleteId = null;
      Modal.close('modal-confirm-overlay');
      render();
      Toast.show('✓ Вещь удалена', 'info');
    }
  };

  

  const renderEquippedItems = () => {
    const el=document.getElementById("equipped-items-list");
    if(!el) return;
    const items=AppState.items.filter(i=>AppState.equippedItems.includes(i.id));
    if(!items.length){el.innerHTML="Пока ничего не надето";return;}
    el.innerHTML=items.map(i=>`<div style="display:flex;justify-content:space-between;margin:6px 0;"><span>${i.name}</span><button data-remove-equipped="${i.id}">✕</button></div>`).join('');
    el.querySelectorAll('[data-remove-equipped]').forEach(b=>b.onclick=()=>{AppState.removeEquipped(b.dataset.removeEquipped);renderEquippedItems();});
  };

  const updateStats = () => {
    const stats = AppState.getStats();
    const el = (id, val) => {
      const e = document.getElementById(id);
      if (e) e.textContent = val;
    };
    el('stat-total', stats.total);
    el('stat-forgotten', stats.forgotten);
    el('stat-washing', stats.inWash);
    el('stat-worn', stats.totalWorn);
  };

  const updateFilterCounts = () => {
    const catCounts = AppState.getCategoryCounts();
    CATEGORY_OPTIONS.forEach(cat => {
      const el = document.getElementById(`count-${cat}`);
      if (el) el.textContent = catCounts[cat] || 0;
    });
  };

  const initSearch = () => {
    const inputs = document.querySelectorAll('.search-input');
    inputs.forEach(input => {
      input.addEventListener('input', (e) => {
        AppState.filters.search = e.target.value;
        // Sync all search inputs
        inputs.forEach(i => { if (i !== e.target) i.value = e.target.value; });
        render();
      });
    });
  };

  const initFilters = () => {
    document.querySelectorAll('[data-filter-category]').forEach(cb => {
      cb.addEventListener('change', () => {
        AppState.filters.categories = [...document.querySelectorAll('[data-filter-category]:checked')]
          .map(el => el.value);
        // Sync chips
        syncChips();
        render();
      });
    });

    document.querySelectorAll('[data-filter-status]').forEach(cb => {
      cb.addEventListener('change', () => {
        AppState.filters.statuses = [...document.querySelectorAll('[data-filter-status]:checked')]
          .map(el => el.value);
        render();
      });
    });
    document.querySelectorAll('[data-filter-season]').forEach(cb => {
      cb.addEventListener('change', () => {
        AppState.filters.seasons = [...document.querySelectorAll('[data-filter-season]:checked')]
          .map(el => el.value);
        render();
      });
    });
    document.querySelectorAll('[data-chip-category]').forEach(chip => {
      chip.addEventListener('click', () => {
        const val = chip.dataset.chipCategory;
        chip.classList.toggle('active');
        AppState.filters.categories = [...document.querySelectorAll('[data-chip-category].active')]
          .map(el => el.dataset.chipCategory);
        // Sync sidebar checkboxes
        document.querySelectorAll('[data-filter-category]').forEach(cb => {
          cb.checked = AppState.filters.categories.includes(cb.value);
        });
        render();
      });
    });

    document.getElementById('btn-clear-filters')?.addEventListener('click', clearFilters);
  };

  const clearFilters = () => {
    AppState.filters = { search: '', categories: [], statuses: [], seasons: [] };
    document.querySelectorAll('[data-filter-category], [data-filter-status], [data-filter-season]')
      .forEach(cb => cb.checked = false);
    document.querySelectorAll('[data-chip-category]').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.search-input').forEach(i => i.value = '');
    render();
  };

  const syncChips = () => {
    document.querySelectorAll('[data-chip-category]').forEach(chip => {
      chip.classList.toggle('active', AppState.filters.categories.includes(chip.dataset.chipCategory));
    });
  };

  const initSort = () => {
    document.getElementById('sort-select')?.addEventListener('change', (e) => {
      AppState.sortBy = e.target.value;
      render();
    });

    document.getElementById('sort-dir-btn')?.addEventListener('click', (btn) => {
      AppState.sortDir = AppState.sortDir === 'asc' ? 'desc' : 'asc';
      const el = document.getElementById('sort-dir-btn');
      if (el) el.textContent = AppState.sortDir === 'asc' ? '↑' : '↓';
      render();
    });
  };
  const initDrawer = () => {
    const drawer = document.getElementById('drawer');
    const overlay = document.getElementById('drawer-overlay');
    const burger = document.getElementById('burger-btn');
    const close = document.getElementById('drawer-close');

    const openDrawer = () => {
      drawer.classList.add('open');
      overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    };

    const closeDrawer = () => {
      drawer.classList.remove('open');
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    };

    burger?.addEventListener('click', openDrawer);
    close?.addEventListener('click', closeDrawer);
    overlay?.addEventListener('click', closeDrawer);
  };

  const initAddButtons = () => {
    ['btn-add-desktop', 'btn-fab'].forEach(id => {
      document.getElementById(id)?.addEventListener('click', () => {
        ItemForm.resetForm();
        Modal.open('modal-item-overlay');
      });
    });
  };

  const initLogout = () => {
    document.getElementById('btn-logout')?.addEventListener('click', () => {
      AppState.logout();
      showAuth();
    });
  };

  const initConfirmDelete = () => {
    document.getElementById('btn-confirm-delete')?.addEventListener('click', confirmDelete);
    document.getElementById('btn-cancel-delete')?.addEventListener('click', () => {
      Modal.close('modal-confirm-overlay');
    });
    document.getElementById('modal-confirm-overlay')?.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) Modal.close('modal-confirm-overlay');
    });
  };

  const init = () => {
    initSearch();
    initFilters();
    initSort();
    initDrawer();
    initAddButtons();
    initLogout();
    initConfirmDelete();
  };

  return { init, showAuth, showApp, render, renderEquippedItems };
})();
