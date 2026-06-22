const ItemForm = (() => {
  let editingId = null;
  let fromWishlistId = null; // set when the "add item" modal was opened via "Перенести в гардероб"
  let imagePreviewTimer = null;

  const fields = () => ({
    name: document.getElementById('f-name'),
    category: document.getElementById('f-category'),
    color: document.getElementById('f-color'),
    season: document.getElementById('f-season'),
    status: document.getElementById('f-status'),
    imageUrl: document.getElementById('f-image-url'),
    lastWorn: document.getElementById('f-last-worn'),
  });

  const errors = () => ({
    name: document.getElementById('f-name-error'),
    category: document.getElementById('f-category-error'),
    color: document.getElementById('f-color-error'),
    season: document.getElementById('f-season-error'),
    imageUrl: document.getElementById('f-image-url-error'),
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

    if (key === 'category') {
      if (!value) { setError('category', 'Выберите категорию'); return false; }
      clearError('category'); return true;
    }

    if (key === 'color') {
      if (!value) { setError('color', 'Укажите цвет'); return false; }
      if (value.length > 30) { setError('color', 'Максимум 30 символов'); return false; }
      clearError('color'); return true;
    }

    if (key === 'season') {
      if (!value) { setError('season', 'Выберите сезон'); return false; }
      clearError('season'); return true;
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

  const validateAll = () => {
    const results = ['name', 'category', 'color', 'season', 'imageUrl'].map(k => validateField(k));
    return results.every(Boolean);
  };

  const updateSaveBtn = () => {
    const btn = document.getElementById('btn-save-item');
    const f = fields();
    const hasRequired = f.name?.value.trim() && f.category?.value && f.color?.value.trim() && f.season?.value;
    const imgVal = f.imageUrl?.value.trim();
    const imgOk = !imgVal || isValidUrl(imgVal);
    const nameOk = (f.name?.value.trim().length || 0) <= 60;
    const colorOk = (f.color?.value.trim().length || 0) <= 30;
    if (btn) {
      btn.disabled = !(hasRequired && imgOk && nameOk && colorOk);
    }
  };

  const updateCharCount = () => {
    const nameEl = document.getElementById('f-name');
    const countEl = document.getElementById('name-char-count');
    if (nameEl && countEl) {
      const len = nameEl.value.length;
      countEl.textContent = `${len}/60`;
      countEl.classList.toggle('over', len > 60);
    }
  };

  const updateImagePreview = () => {
    const urlEl = document.getElementById('f-image-url');
    const preview = document.getElementById('image-preview');
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
    document.getElementById('image-preview').innerHTML = `<span>Вставьте URL фото для предпросмотра</span>`;
    document.getElementById('name-char-count').textContent = '0/60';
    updateSaveBtn();
    editingId = null;
    fromWishlistId = null;
    document.getElementById('modal-item-title').textContent = 'Новая вещь';
  };

  const openForEdit = (item) => {
    resetForm();
    editingId = item.id;
    document.getElementById('modal-item-title').textContent = 'Редактировать вещь';

    const f = fields();
    f.name.value = item.name;
    f.category.value = item.category;
    f.color.value = item.color;
    f.season.value = item.season;
    f.status.value = item.status;
    if (item.imageUrl) f.imageUrl.value = item.imageUrl;
    if (item.lastWorn) f.lastWorn.value = item.lastWorn.split('T')[0];

    updateCharCount();
    updateImagePreview();
    updateSaveBtn();
    Modal.open('modal-item-overlay');
  };

  const openForWishlist = (wishlistItem) => {
    resetForm();
    fromWishlistId = wishlistItem.id;
    document.getElementById('modal-item-title').textContent = 'Добавить вещь из вишлиста';

    const f = fields();
    f.name.value = wishlistItem.name || '';
    if (wishlistItem.category) f.category.value = wishlistItem.category;
    if (wishlistItem.imageUrl) f.imageUrl.value = wishlistItem.imageUrl;

    updateCharCount();
    updateImagePreview();
    updateSaveBtn();
    Modal.open('modal-item-overlay');
  };

  const handleSave = () => {
    if (!validateAll()) return;

    const f = fields();
    const data = {
      name: f.name.value.trim(),
      category: f.category.value,
      color: f.color.value.trim(),
      season: f.season.value,
      status: f.status.value,
      imageUrl: f.imageUrl.value.trim(),
      lastWorn: f.lastWorn.value || null,
    };

    if (editingId) {
      AppState.updateItem(editingId, data);
      Toast.show('✓ Изменения сохранены', 'success');
    } else {
      AppState.addItem(data);
      if (fromWishlistId) {
        AppState.deleteWishlistItem(fromWishlistId);
        Wishlist.render();
        Toast.show('✓ Вещь перенесена в гардероб из вишлиста', 'success');
      } else {
        Toast.show('✓ Вещь добавлена в гардероб', 'success');
      }
    }

    fromWishlistId = null;
    Modal.close('modal-item-overlay');
    UI.render();
  };

  const setupBlur = () => {
    ['name', 'category', 'color', 'season', 'imageUrl'].forEach(key => {
      const el = document.getElementById(`f-${key === 'imageUrl' ? 'image-url' : key}`);
      el?.addEventListener('blur', () => {
        validateField(key);
        updateSaveBtn();
      });
    });
  };

  const init = () => {
    document.getElementById('f-name')?.addEventListener('input', () => {
      updateCharCount();
      updateSaveBtn();
    });

    ['f-category', 'f-color', 'f-season', 'f-status'].forEach(id => {
      document.getElementById(id)?.addEventListener('input', updateSaveBtn);
    });

    document.getElementById('f-image-url')?.addEventListener('input', () => {
      updateSaveBtn();
      clearTimeout(imagePreviewTimer);
      imagePreviewTimer = setTimeout(updateImagePreview, 600);
    });

    document.getElementById('btn-save-item')?.addEventListener('click', (e) => {
      e.preventDefault();
      if (!validateAll()) return;
      handleSave();
    });

    document.getElementById('btn-cancel-item')?.addEventListener('click', () => {
      Modal.close('modal-item-overlay');
    });

    document.getElementById('btn-modal-item-close')?.addEventListener('click', () => {
      Modal.close('modal-item-overlay');
    });

    document.getElementById('modal-item-overlay')?.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) Modal.close('modal-item-overlay');
    });

    setupBlur();
  };

  return { init, openForEdit, openForWishlist, resetForm };
})();
