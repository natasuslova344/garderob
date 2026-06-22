const Looks = (() => {
  let editingId = null;
  let selectedItemIds = new Set();

  const fields = () => ({
    name: document.getElementById('l-name'),
  });

  const setError = (msg) => {
    const f = fields();
    const e = document.getElementById('l-name-error');
    if (f.name) f.name.classList.add('error');
    if (e) { e.textContent = msg; e.classList.add('visible'); }
  };

  const clearError = () => {
    const f = fields();
    const e = document.getElementById('l-name-error');
    if (f.name) f.name.classList.remove('error');
    if (e) e.classList.remove('visible');
  };

  const validateName = () => {
    const value = fields().name?.value?.trim() || '';
    if (!value) { setError('Название обязательно'); return false; }
    if (value.length > 50) { setError('Максимум 50 символов'); return false; }
    clearError();
    return true;
  };

  const updatePickerCount = () => {
    const el = document.getElementById('look-picker-count');
    if (el) el.textContent = `Выбрано: ${selectedItemIds.size}`;
  };

  const updateSaveBtn = () => {
    const btn = document.getElementById('btn-save-look');
    const nameOk = (fields().name?.value.trim().length || 0) > 0
      && (fields().name?.value.trim().length || 0) <= 50;
    if (btn) btn.disabled = !(nameOk && selectedItemIds.size >= 2);
  };

  const renderItemPicker = () => {
    const grid = document.getElementById('look-item-picker');
    if (!grid) return;

    if (!AppState.items.length) {
      grid.innerHTML = `<div class="item-picker-empty">Сначала добавьте хотя бы пару вещей в гардероб — потом из них можно будет собрать образ.</div>`;
      return;
    }

    grid.innerHTML = AppState.items.map(item => {
      const icon = CATEGORY_ICONS[item.category] || '👕';
      const selected = selectedItemIds.has(item.id);
      const imagePart = item.imageUrl
        ? `<img src="${item.imageUrl}" alt="${item.name}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
        : '';
      const placeholderPart = `<div class="item-picker-placeholder" style="${item.imageUrl ? 'display:none' : ''}">${icon}</div>`;

      return `
        <div class="item-picker-tile ${selected ? 'selected' : ''}" data-picker-item="${item.id}" title="${item.name}">
          <div class="item-picker-check">✓</div>
          ${imagePart}
          ${placeholderPart}
          <div class="item-picker-name">${item.name}</div>
        </div>`;
    }).join('');
  };

  const togglePick = (id) => {
    if (selectedItemIds.has(id)) selectedItemIds.delete(id);
    else selectedItemIds.add(id);

    const tile = document.querySelector(`[data-picker-item="${id}"]`);
    if (tile) tile.classList.toggle('selected', selectedItemIds.has(id));

    updatePickerCount();
    updateSaveBtn();
  };

  const resetForm = () => {
    const f = fields();
    if (f.name) f.name.value = '';
    clearError();
    selectedItemIds = new Set();
    renderItemPicker();
    updatePickerCount();
    updateSaveBtn();
    editingId = null;
    document.getElementById('modal-look-title').textContent = 'Новый образ';
  };

  const openForCreate = () => {
    resetForm();
    Modal.open('modal-look-overlay');
  };

  const openForEdit = (look) => {
    resetForm();
    editingId = look.id;
    document.getElementById('modal-look-title').textContent = 'Редактировать образ';

    const f = fields();
    if (f.name) f.name.value = look.name || '';

    selectedItemIds = new Set(look.itemIds.filter(id => AppState.items.find(i => i.id === id)));
    renderItemPicker();
    updatePickerCount();
    updateSaveBtn();
    Modal.open('modal-look-overlay');
  };

  const handleSave = () => {
    if (!validateName() || selectedItemIds.size < 2) return;

    const data = {
      name: fields().name.value.trim(),
      itemIds: [...selectedItemIds],
    };

    if (editingId) {
      AppState.updateLook(editingId, data);
      Toast.show('✓ Образ обновлён', 'success');
    } else {
      AppState.addLook(data);
      Toast.show('✓ Образ сохранён', 'success');
    }

    Modal.close('modal-look-overlay');
    render();
  };

  const renderCover = (look) => {
    const items = look.itemIds
      .map(id => AppState.items.find(i => i.id === id))
      .filter(Boolean)
      .slice(0, 3);

    if (!items.length) {
      return `<div class="look-cover-placeholder">✨</div>`;
    }

    return `<div class="look-cover look-cover-${items.length}">` + items.map(item => {
      const icon = CATEGORY_ICONS[item.category] || '👕';
      return item.imageUrl
        ? `<div class="look-cover-piece"><img src="${item.imageUrl}" alt="${item.name}" loading="lazy" onerror="this.parentElement.innerHTML='${icon}'"></div>`
        : `<div class="look-cover-piece look-cover-icon">${icon}</div>`;
    }).join('') + '</div>';
  };

  const renderCard = (look) => {
    const validCount = look.itemIds.filter(id => AppState.items.find(i => i.id === id)).length;

    return `
      <div class="card look-card" data-id="${look.id}">
        <div class="card-image-wrap look-cover-wrap">
          ${renderCover(look)}
        </div>
        <div class="card-body">
          <div class="card-name" title="${look.name}">${look.name}</div>
          <div class="card-meta">
            <span class="card-category">${validCount} ${pluralizeItems(validCount)}</span>
          </div>
          <div class="card-actions">
            <button class="card-action-btn wear" data-look-action="wear" data-id="${look.id}" title="Надеть весь образ">✓ Надеть</button>
            <button class="card-action-btn" data-look-action="edit" data-id="${look.id}" title="Редактировать">✏</button>
            <button class="card-action-btn delete" data-look-action="delete" data-id="${look.id}" title="Удалить">🗑</button>
          </div>
        </div>
      </div>`;
  };

  const pluralizeItems = (n) => {
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return 'вещь';
    if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)) return 'вещи';
    return 'вещей';
  };

  const render = () => {
    const grid = document.getElementById('looks-grid');
    if (!grid) return;

    const countEl = document.getElementById('looks-items-count');
    const badgeEl = document.getElementById('looks-count-badge');

    if (countEl) countEl.textContent = `(${AppState.looks.length})`;
    if (badgeEl) badgeEl.textContent = AppState.looks.length;

    if (!AppState.looks.length) {
      grid.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">✨</div>
          <h3>Пока нет сохранённых образов</h3>
          <p>Соберите сочетание из вещей гардероба — потом сможете надеть его одним кликом</p>
        </div>`;
      return;
    }

    grid.innerHTML = AppState.looks.map(renderCard).join('');
    bindCardEvents();
  };

  const bindCardEvents = () => {
    document.querySelectorAll('[data-look-action]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = btn.dataset.lookAction;
        const id = btn.dataset.id;
        const look = AppState.looks.find(l => l.id === id);
        if (!look) return;

        if (action === 'edit') {
          openForEdit(look);
        } else if (action === 'wear') {
          const result = AppState.wearLook(id);
          if (!result) return;
          if (result.worn > 0) {
            Toast.show(`✓ Образ «${look.name}» надет (${result.worn} вещ. отмечено)`, 'success');
          } else if (result.alreadyWorn > 0) {
            Toast.show('Все вещи образа уже надеты', 'info');
          } else {
            Toast.show('В этом образе не осталось вещей в гардеробе', 'error');
          }
          UI.render();
          UI.renderEquippedItems();
        } else if (action === 'delete') {
          const cardEl = btn.closest('.card');
          ConfirmDialog.open(() => {
            AppState.deleteLook(id);
            render();
            Toast.show('✓ Образ удалён', 'info');
          }, {
            cardEl,
            title: 'Удалить образ?',
            text: 'Сами вещи останутся в гардеробе, удалится только сочетание.',
          });
        }
      });
    });
  };

  const init = () => {
    document.getElementById('btn-add-look')?.addEventListener('click', openForCreate);

    document.getElementById('l-name')?.addEventListener('input', updateSaveBtn);
    document.getElementById('l-name')?.addEventListener('blur', validateName);

    document.getElementById('look-item-picker')?.addEventListener('click', (e) => {
      const tile = e.target.closest('[data-picker-item]');
      if (tile) togglePick(tile.dataset.pickerItem);
    });

    document.getElementById('btn-save-look')?.addEventListener('click', (e) => {
      e.preventDefault();
      handleSave();
    });

    document.getElementById('btn-cancel-look')?.addEventListener('click', () => {
      Modal.close('modal-look-overlay');
    });

    document.getElementById('btn-modal-look-close')?.addEventListener('click', () => {
      Modal.close('modal-look-overlay');
    });

    document.getElementById('modal-look-overlay')?.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) Modal.close('modal-look-overlay');
    });
  };

  return { init, render, openForCreate, openForEdit };
})();
