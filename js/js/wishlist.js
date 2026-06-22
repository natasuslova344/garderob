const Wishlist = (() => {
  let editingId = null;
  let imagePreviewTimer = null;

  const fields = () => ({
    name: document.getElementById('w-name'),
    link: document.getElementById('w-link'),
    price: document.getElementById('w-price'),
    category: document.getElementById('w-category'),
    imageUrl: document.getElementById('w-image-url'),
    comment: document.getElementById('w-comment'),
  });

  const errors = () => ({
    name: document.getElementById('w-name-error'),
    link: document.getElementById('w-link-error'),
    price: document.getElementById('w-price-error'),
    imageUrl: document.getElementById('w-image-url-error'),
  });

  const setError = (key, msg) => {
    const f = fields();
    const e = errors();
    if (f[key]) f[key].classList.add('error');
    if (e[key]) { e[key].textContent = msg; e[key].classList.add('visible'); }
  };

  const clearError = (key) => {
    const f = fields();
    const e = errors();
    if (f[key]) f[key].classList.remove('error');
    if (e[key]) e[key].classList.remove('visible');
  };

  const validateField = (key) => {
    const f = fields();
    const value = f[key]?.value?.trim() || '';

    if (key === 'name') {
      if (!value) { setError('name', 'Название обязательно'); return false; }
      if (value.length > 60) { setError('name', 'Максимум 60 символов'); return false; }
      clearError('name'); return true;
    }

    if (key === 'link') {
      if (!value || !isValidUrl(value)) {
        setError('link', 'Укажите корректную ссылку (http:// или https://)');
        return false;
      }
      clearError('link'); return true;
    }

    if (key === 'price') {
      const num = Number(value);
      if (value === '' || isNaN(num) || num < 0) { setError('price', 'Укажите цену'); return false; }
      clearError('price'); return true;
    }

    if (key === 'imageUrl') {
      if (value && !isValidUrl(value)) {
        setError('imageUrl', 'URL должен начинаться с http:// или https://');
        return false;
      }
      clearError('imageUrl'); return true;
    }

    return true;
  };

  const validateAll = () => ['name', 'link', 'price', 'imageUrl'].map(validateField).every(Boolean);

  const updateSaveBtn = () => {
    const btn = document.getElementById('btn-save-wishlist');
    const f = fields();
    const hasRequired = f.name?.value.trim() && f.link?.value.trim() && f.price?.value !== '';
    const linkOk = isValidUrl(f.link?.value.trim() || '');
    const priceNum = Number(f.price?.value);
    const priceOk = f.price?.value !== '' && !isNaN(priceNum) && priceNum >= 0;
    const imgVal = f.imageUrl?.value.trim();
    const imgOk = !imgVal || isValidUrl(imgVal);
    const nameOk = (f.name?.value.trim().length || 0) <= 60;
    if (btn) btn.disabled = !(hasRequired && linkOk && priceOk && imgOk && nameOk);
  };

  const updateImagePreview = () => {
    const urlEl = document.getElementById('w-image-url');
    const preview = document.getElementById('wishlist-image-preview');
    if (!urlEl || !preview) return;
    const url = urlEl.value.trim();
    if (url && isValidUrl(url)) {
      preview.innerHTML = `<img src="${url}" alt="Preview" onerror="this.parentElement.innerHTML='<span>Не удалось загрузить изображение</span>'">`;
    } else if (!url) {
      preview.innerHTML = `<span>Вставьте URL фото для предпросмотра</span>`;
    }
  };

  const resetForm = () => {
    const f = fields();
    Object.values(f).forEach(el => el && (el.value = ''));
    Object.keys(errors()).forEach(k => clearError(k));
    document.getElementById('wishlist-image-preview').innerHTML = `<span>Вставьте URL фото для предпросмотра</span>`;
    updateSaveBtn();
    editingId = null;
    document.getElementById('modal-wishlist-title').textContent = 'Добавить в вишлист';
  };

  const openForCreate = () => {
    resetForm();
    Modal.open('modal-wishlist-overlay');
  };

  const openForEdit = (item) => {
    resetForm();
    editingId = item.id;
    document.getElementById('modal-wishlist-title').textContent = 'Редактировать запись';

    const f = fields();
    f.name.value = item.name || '';
    f.link.value = item.link || '';
    f.price.value = item.price ?? '';
    f.category.value = item.category || '';
    if (item.imageUrl) f.imageUrl.value = item.imageUrl;
    f.comment.value = item.comment || '';

    updateImagePreview();
    updateSaveBtn();
    Modal.open('modal-wishlist-overlay');
  };

  const handleSave = () => {
    if (!validateAll()) return;

    const f = fields();
    const data = {
      name: f.name.value.trim(),
      link: f.link.value.trim(),
      price: Number(f.price.value),
      category: f.category.value,
      imageUrl: f.imageUrl.value.trim(),
      comment: f.comment.value.trim(),
    };

    if (editingId) {
      AppState.updateWishlistItem(editingId, data);
      Toast.show('✓ Запись обновлена', 'success');
    } else {
      AppState.addWishlistItem(data);
      Toast.show('✓ Добавлено в вишлист', 'success');
    }

    Modal.close('modal-wishlist-overlay');
    render();
  };

  const renderCard = (item) => {
    const article = extractWbArticle(item.link);
    const icon = (item.category && CATEGORY_ICONS[item.category]) || '🛍️';

    const imagePart = item.imageUrl
      ? `<img src="${item.imageUrl}" alt="${item.name}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
      : '';
    const placeholderPart = `<div class="card-image-placeholder" style="${item.imageUrl ? 'display:none' : ''}">${icon}</div>`;

    return `
      <div class="card wishlist-card" data-id="${item.id}">
        <div class="card-image-wrap">
          ${imagePart}
          ${placeholderPart}
          <div class="wishlist-price-badge">${formatPrice(item.price)}</div>
        </div>
        <div class="card-body">
          <div class="card-name" title="${item.name}">${item.name}</div>
          <div class="card-meta">
            ${item.category ? `<span class="card-category">${item.category}</span>` : '<span></span>'}
            ${article ? `<span class="wb-article">WB: ${article}</span>` : ''}
          </div>
          ${item.comment ? `<div class="wishlist-comment">${item.comment}</div>` : ''}
          <div class="card-actions">
            <a class="card-action-btn" href="${item.link}" target="_blank" rel="noopener" title="Открыть на Wildberries">🔗</a>
            <button class="card-action-btn buy" data-wishlist-action="buy" data-id="${item.id}" title="Перенести в гардероб">🛒</button>
            <button class="card-action-btn" data-wishlist-action="edit" data-id="${item.id}" title="Редактировать">✏</button>
            <button class="card-action-btn delete" data-wishlist-action="delete" data-id="${item.id}" title="Удалить">🗑</button>
          </div>
        </div>
      </div>`;
  };

  const render = () => {
    const grid = document.getElementById('wishlist-grid');
    if (!grid) return;

    const countEl = document.getElementById('wishlist-items-count');
    const summaryEl = document.getElementById('wishlist-summary');
    const badgeEl = document.getElementById('wishlist-count-badge');

    const items = AppState.getSortedWishlist();

    if (countEl) countEl.textContent = `(${items.length})`;
    if (badgeEl) badgeEl.textContent = items.length;
    if (summaryEl) {
      summaryEl.textContent = items.length
        ? `Общая сумма: ${formatPrice(AppState.getWishlistTotal())}`
        : '';
    }

    if (!items.length) {
      grid.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🛍️</div>
          <h3>Вишлист пуст</h3>
          <p>Вставьте ссылку на вещь с Wildberries и укажите цену — мы сохраним её здесь</p>
        </div>`;
      return;
    }

    grid.innerHTML = items.map(renderCard).join('');
    bindCardEvents();
  };

  const bindCardEvents = () => {
    document.querySelectorAll('[data-wishlist-action]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = btn.dataset.wishlistAction;
        const id = btn.dataset.id;
        const item = AppState.wishlist.find(i => i.id === id);
        if (!item) return;

        if (action === 'edit') {
          openForEdit(item);
        } else if (action === 'buy') {
          ItemForm.openForWishlist(item);
        } else if (action === 'delete') {
          const cardEl = btn.closest('.card');
          ConfirmDialog.open(() => {
            AppState.deleteWishlistItem(id);
            render();
            Toast.show('✓ Удалено из вишлиста', 'info');
          }, {
            cardEl,
            title: 'Удалить из вишлиста?',
            text: 'Это действие нельзя отменить.',
          });
        }
      });
    });
  };

  const init = () => {
    document.getElementById('btn-add-wishlist')?.addEventListener('click', openForCreate);

    document.getElementById('w-name')?.addEventListener('input', updateSaveBtn);
    ['w-link', 'w-price', 'w-category'].forEach(id => {
      document.getElementById(id)?.addEventListener('input', updateSaveBtn);
    });
    document.getElementById('w-image-url')?.addEventListener('input', () => {
      updateSaveBtn();
      clearTimeout(imagePreviewTimer);
      imagePreviewTimer = setTimeout(updateImagePreview, 600);
    });

    [['w-name', 'name'], ['w-link', 'link'], ['w-price', 'price'], ['w-image-url', 'imageUrl']].forEach(([id, key]) => {
      document.getElementById(id)?.addEventListener('blur', () => {
        validateField(key);
        updateSaveBtn();
      });
    });

    document.getElementById('btn-save-wishlist')?.addEventListener('click', (e) => {
      e.preventDefault();
      if (!validateAll()) return;
      handleSave();
    });

    document.getElementById('btn-cancel-wishlist')?.addEventListener('click', () => {
      Modal.close('modal-wishlist-overlay');
    });

    document.getElementById('btn-modal-wishlist-close')?.addEventListener('click', () => {
      Modal.close('modal-wishlist-overlay');
    });

    document.getElementById('modal-wishlist-overlay')?.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) Modal.close('modal-wishlist-overlay');
    });

    document.getElementById('wishlist-sort-select')?.addEventListener('change', (e) => {
      AppState.wishlistSortBy = e.target.value;
      render();
    });
  };

  return { init, render, openForCreate, openForEdit };
})();
