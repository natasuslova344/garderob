const Store = (() => {
  const DB_KEY = 'wardrobe_db';

  const getDB = () => {
    try {
      return JSON.parse(localStorage.getItem(DB_KEY)) || { users: [] };
    } catch {
      return { users: [] };
    }
  };

  const saveDB = (db) => {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  };

  const registerUser = (email, password) => {
    const db = getDB();
    if (db.users.find(u => u.email === email)) {
      throw new Error('Пользователь с таким email уже существует');
    }
    const user = {
      id: crypto.randomUUID(),
      email,
      passwordHash: btoa(password),
      items: [],
      wishlist: [],
      looks: [],
      wearLog: [],
      createdAt: new Date().toISOString(),
    };
    db.users.push(user);
    saveDB(db);
    return { id: user.id, email: user.email };
  };

  const loginUser = (email, password) => {
    const db = getDB();
    const user = db.users.find(u => u.email === email && u.passwordHash === btoa(password));
    if (!user) throw new Error('Неверный email или пароль');
    return { id: user.id, email: user.email };
  };

  const getSession = () => {
    try {
      return JSON.parse(sessionStorage.getItem('wardrobe_session'));
    } catch {
      return null;
    }
  };

  const setSession = (user) => {
    sessionStorage.setItem('wardrobe_session', JSON.stringify(user));
  };

  const clearSession = () => {
    sessionStorage.removeItem('wardrobe_session');
  };


  const getUserItems = (userId) => {
    const db = getDB();
    const user = db.users.find(u => u.id === userId);
    return user ? [...user.items] : [];
  };

  const saveItems = (userId, items) => {
    const db = getDB();
    const userIdx = db.users.findIndex(u => u.id === userId);
    if (userIdx === -1) return;
    db.users[userIdx].items = items;
    saveDB(db);
  };

  const addItem = (userId, itemData) => {
    const db = getDB();
    const userIdx = db.users.findIndex(u => u.id === userId);
    if (userIdx === -1) return null;
    const item = {
      id: crypto.randomUUID(),
      name: itemData.name,
      category: itemData.category,
      color: itemData.color,
      season: itemData.season,
      imageUrl: itemData.imageUrl,
      status: itemData.status || 'clean',
      lastWorn: itemData.lastWorn || null,
      wornCount: 0,
      createdAt: new Date().toISOString(),
    };
    db.users[userIdx].items.push(item);
    saveDB(db);
    return item;
  };

  const updateItem = (userId, itemId, updates) => {
    const db = getDB();
    const userIdx = db.users.findIndex(u => u.id === userId);
    if (userIdx === -1) return null;
    const itemIdx = db.users[userIdx].items.findIndex(i => i.id === itemId);
    if (itemIdx === -1) return null;
    const updated = { ...db.users[userIdx].items[itemIdx], ...updates };
    db.users[userIdx].items[itemIdx] = updated;
    saveDB(db);
    return updated;
  };

  const deleteItem = (userId, itemId) => {
    const db = getDB();
    const userIdx = db.users.findIndex(u => u.id === userId);
    if (userIdx === -1) return false;
    db.users[userIdx].items = db.users[userIdx].items.filter(i => i.id !== itemId);
    saveDB(db);
    return true;
  };

  const wearItem = (userId, itemId) => {
    const db = getDB();
    const userIdx = db.users.findIndex(u => u.id === userId);
    if (userIdx === -1) return null;
    const itemIdx = db.users[userIdx].items.findIndex(i => i.id === itemId);
    if (itemIdx === -1) return null;
    const item = db.users[userIdx].items[itemIdx];
    const now = new Date().toISOString();
    item.lastWorn = now;
    item.wornCount = (item.wornCount || 0) + 1;

    if (!db.users[userIdx].wearLog) db.users[userIdx].wearLog = [];
    db.users[userIdx].wearLog.push({ date: now, itemId });
    // Не даём логу расти бесконечно — для статистики достаточно последних 1000 записей.
    if (db.users[userIdx].wearLog.length > 1000) {
      db.users[userIdx].wearLog = db.users[userIdx].wearLog.slice(-1000);
    }

    saveDB(db);
    return item;
  };

  const getUserWearLog = (userId) => {
    const db = getDB();
    const user = db.users.find(u => u.id === userId);
    return user ? [...(user.wearLog || [])] : [];
  };


  const getUserWishlist = (userId) => {
    const db = getDB();
    const user = db.users.find(u => u.id === userId);
    return user ? [...(user.wishlist || [])] : [];
  };

  const addWishlistItem = (userId, data) => {
    const db = getDB();
    const userIdx = db.users.findIndex(u => u.id === userId);
    if (userIdx === -1) return null;
    if (!db.users[userIdx].wishlist) db.users[userIdx].wishlist = [];
    const item = {
      id: crypto.randomUUID(),
      name: data.name,
      link: data.link,
      price: Number(data.price) || 0,
      category: data.category || '',
      imageUrl: data.imageUrl || '',
      comment: data.comment || '',
      createdAt: new Date().toISOString(),
    };
    db.users[userIdx].wishlist.push(item);
    saveDB(db);
    return item;
  };

  const updateWishlistItem = (userId, itemId, updates) => {
    const db = getDB();
    const userIdx = db.users.findIndex(u => u.id === userId);
    if (userIdx === -1) return null;
    const list = db.users[userIdx].wishlist || [];
    const idx = list.findIndex(i => i.id === itemId);
    if (idx === -1) return null;
    const updated = { ...list[idx], ...updates };
    if (updates.price !== undefined) updated.price = Number(updates.price) || 0;
    list[idx] = updated;
    db.users[userIdx].wishlist = list;
    saveDB(db);
    return updated;
  };

  const deleteWishlistItem = (userId, itemId) => {
    const db = getDB();
    const userIdx = db.users.findIndex(u => u.id === userId);
    if (userIdx === -1) return false;
    db.users[userIdx].wishlist = (db.users[userIdx].wishlist || []).filter(i => i.id !== itemId);
    saveDB(db);
    return true;
  };


  const getUserLooks = (userId) => {
    const db = getDB();
    const user = db.users.find(u => u.id === userId);
    return user ? [...(user.looks || [])] : [];
  };

  const addLook = (userId, data) => {
    const db = getDB();
    const userIdx = db.users.findIndex(u => u.id === userId);
    if (userIdx === -1) return null;
    if (!db.users[userIdx].looks) db.users[userIdx].looks = [];
    const look = {
      id: crypto.randomUUID(),
      name: data.name,
      itemIds: Array.isArray(data.itemIds) ? [...data.itemIds] : [],
      createdAt: new Date().toISOString(),
    };
    db.users[userIdx].looks.push(look);
    saveDB(db);
    return look;
  };

  const updateLook = (userId, lookId, updates) => {
    const db = getDB();
    const userIdx = db.users.findIndex(u => u.id === userId);
    if (userIdx === -1) return null;
    const list = db.users[userIdx].looks || [];
    const idx = list.findIndex(l => l.id === lookId);
    if (idx === -1) return null;
    const updated = { ...list[idx], ...updates };
    list[idx] = updated;
    db.users[userIdx].looks = list;
    saveDB(db);
    return updated;
  };

  const deleteLook = (userId, lookId) => {
    const db = getDB();
    const userIdx = db.users.findIndex(u => u.id === userId);
    if (userIdx === -1) return false;
    db.users[userIdx].looks = (db.users[userIdx].looks || []).filter(l => l.id !== lookId);
    saveDB(db);
    return true;
  };

  const removeItemFromLooks = (userId, itemId) => {
    const db = getDB();
    const userIdx = db.users.findIndex(u => u.id === userId);
    if (userIdx === -1) return;
    const looks = db.users[userIdx].looks || [];
    let changed = false;
    looks.forEach(look => {
      if (look.itemIds.includes(itemId)) {
        look.itemIds = look.itemIds.filter(id => id !== itemId);
        changed = true;
      }
    });
    if (changed) {
      db.users[userIdx].looks = looks;
      saveDB(db);
    }
  };

  return {
    registerUser,
    loginUser,
    getSession,
    setSession,
    clearSession,
    getUserItems,
    saveItems,
    addItem,
    updateItem,
    deleteItem,
    wearItem,
    getUserWearLog,
    getUserWishlist,
    addWishlistItem,
    updateWishlistItem,
    deleteWishlistItem,
    getUserLooks,
    addLook,
    updateLook,
    deleteLook,
    removeItemFromLooks,
  };
})();

const AppState = {
  currentUser: null,
  items: [],
  wishlist: [],
  looks: [],
  wearLog: [],
  equippedItems: [],
  currentView: 'wardrobe', 
  filters: {
    search: '',
    categories: [],
    statuses: [],
    seasons: [],
  },
  sortBy: 'name',
  sortDir: 'asc',
  wishlistSortBy: 'added',

  setUser(user) {
    this.currentUser = user;
    this.items = Store.getUserItems(user.id);
    this.wishlist = Store.getUserWishlist(user.id);
    this.looks = Store.getUserLooks(user.id);
    this.wearLog = Store.getUserWearLog(user.id);
    this.equippedItems = JSON.parse(localStorage.getItem('equipped_' + user.id) || '[]');
    this.currentView = 'wardrobe';
  },

  logout() {
    Store.clearSession();
    this.currentUser = null;
    this.items = [];
    this.wishlist = [];
    this.looks = [];
    this.wearLog = [];
    this.equippedItems = [];
    this.currentView = 'wardrobe';
    this.filters = { search: '', categories: [], statuses: [], seasons: [] };
  },

  addItem(data) {
    const item = Store.addItem(this.currentUser.id, data);
    if (item) this.items.unshift(item);
    return item;
  },

  updateItem(id, data) {
    const updated = Store.updateItem(this.currentUser.id, id, data);
    if (updated) {
      const idx = this.items.findIndex(i => i.id === id);
      if (idx !== -1) this.items[idx] = updated;
    }
    return updated;
  },

  deleteItem(id) {
    Store.deleteItem(this.currentUser.id, id);
    Store.removeItemFromLooks(this.currentUser.id, id);
    this.items = this.items.filter(i => i.id !== id);
    this.removeEquipped(id);
    // держим локальную копию образов в синхроне с тем, что только что почистили в Store
    this.looks = this.looks.map(l => ({ ...l, itemIds: l.itemIds.filter(itemId => itemId !== id) }));
  },

  wearItem(id) {
    const alreadyEquipped = this.equippedItems.includes(id);

    if (alreadyEquipped) {
      this.removeEquipped(id);
      const item = this.items.find(i => i.id === id);
      return { item, action: 'unworn' };
    }

    const updated = Store.wearItem(this.currentUser.id, id);
    if (!updated) return null;

    const idx = this.items.findIndex(i => i.id === id);
    if (idx !== -1) this.items[idx] = updated;

    this.equippedItems.push(id);
    localStorage.setItem('equipped_' + this.currentUser.id, JSON.stringify(this.equippedItems));

    this.wearLog.push({ date: updated.lastWorn, itemId: id });

    return { item: updated, action: 'worn' };
  },

  removeEquipped(id) {
    this.equippedItems = this.equippedItems.filter(x => x !== id);
    if (this.currentUser) {
      localStorage.setItem('equipped_' + this.currentUser.id, JSON.stringify(this.equippedItems));
    }
  },

  isForgotten(item) {
    if (!item.lastWorn) return true; // never worn
    const diff = (Date.now() - new Date(item.lastWorn)) / (1000 * 60 * 60 * 24);
    return diff > 90;
  },

  getFilteredItems() {
    let result = [...this.items];

    if (this.filters.search) {
      const q = this.filters.search.toLowerCase();
      result = result.filter(i =>
        i.name.toLowerCase().includes(q) ||
        i.color.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q)
      );
    }

    if (this.filters.categories.length) {
      result = result.filter(i => this.filters.categories.includes(i.category));
    }

    if (this.filters.statuses.length) {
      result = result.filter(i => this.filters.statuses.includes(i.status));
    }

    if (this.filters.seasons.length) {
      result = result.filter(i => this.filters.seasons.includes(i.season));
    }

    // Sort
    result.sort((a, b) => {
      let va, vb;
      if (this.sortBy === 'name') {
        va = a.name.toLowerCase();
        vb = b.name.toLowerCase();
      } else if (this.sortBy === 'date') {
        va = a.lastWorn ? new Date(a.lastWorn).getTime() : 0;
        vb = b.lastWorn ? new Date(b.lastWorn).getTime() : 0;
      } else if (this.sortBy === 'worn') {
        va = a.wornCount || 0;
        vb = b.wornCount || 0;
      } else if (this.sortBy === 'added') {
        va = new Date(a.createdAt).getTime();
        vb = new Date(b.createdAt).getTime();
      }
      const cmp = va < vb ? -1 : va > vb ? 1 : 0;
      return this.sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  },

  getStats() {
    const total = this.items.length;
    const forgotten = this.items.filter(i => this.isForgotten(i)).length;
    const inWash = this.items.filter(i => i.status === 'washing').length;
    const totalWorn = this.items.reduce((s, i) => s + (i.wornCount || 0), 0);
    return { total, forgotten, inWash, totalWorn };
  },

  getCategoryCounts() {
    const counts = {};
    for (const item of this.items) {
      counts[item.category] = (counts[item.category] || 0) + 1;
    }
    return counts;
  },


  addWishlistItem(data) {
    const item = Store.addWishlistItem(this.currentUser.id, data);
    if (item) this.wishlist.unshift(item);
    return item;
  },

  updateWishlistItem(id, data) {
    const updated = Store.updateWishlistItem(this.currentUser.id, id, data);
    if (updated) {
      const idx = this.wishlist.findIndex(i => i.id === id);
      if (idx !== -1) this.wishlist[idx] = updated;
    }
    return updated;
  },

  deleteWishlistItem(id) {
    Store.deleteWishlistItem(this.currentUser.id, id);
    this.wishlist = this.wishlist.filter(i => i.id !== id);
  },

  getWishlistTotal() {
    return this.wishlist.reduce((sum, i) => sum + (Number(i.price) || 0), 0);
  },

  getSortedWishlist() {
    const list = [...this.wishlist];
    list.sort((a, b) => {
      if (this.wishlistSortBy === 'price-asc') return (Number(a.price) || 0) - (Number(b.price) || 0);
      if (this.wishlistSortBy === 'price-desc') return (Number(b.price) || 0) - (Number(a.price) || 0);
      if (this.wishlistSortBy === 'name') return a.name.localeCompare(b.name, 'ru');
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(); // 'added'
    });
    return list;
  },


  addLook(data) {
    const look = Store.addLook(this.currentUser.id, data);
    if (look) this.looks.unshift(look);
    return look;
  },

  updateLook(id, data) {
    const updated = Store.updateLook(this.currentUser.id, id, data);
    if (updated) {
      const idx = this.looks.findIndex(l => l.id === id);
      if (idx !== -1) this.looks[idx] = updated;
    }
    return updated;
  },

  deleteLook(id) {
    Store.deleteLook(this.currentUser.id, id);
    this.looks = this.looks.filter(l => l.id !== id);
  },

  wearLook(lookId) {
    const look = this.looks.find(l => l.id === lookId);
    if (!look) return null;

    let worn = 0;
    let alreadyWorn = 0;
    let missing = 0;

    look.itemIds.forEach(itemId => {
      if (!this.items.find(i => i.id === itemId)) { missing++; return; }
      if (this.equippedItems.includes(itemId)) { alreadyWorn++; return; }
      const result = this.wearItem(itemId);
      if (result && result.action === 'worn') worn++;
    });

    return { worn, alreadyWorn, missing, total: look.itemIds.length };
  },

  getTopWornItems(limit = 5) {
    return [...this.items]
      .filter(i => (i.wornCount || 0) > 0)
      .sort((a, b) => (b.wornCount || 0) - (a.wornCount || 0))
      .slice(0, limit);
  },

  getMonthlyWearStats(months = 6) {
    const now = new Date();
    const buckets = [];
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push({ year: d.getFullYear(), month: d.getMonth(), count: 0 });
    }
    this.wearLog.forEach(entry => {
      const d = new Date(entry.date);
      const bucket = buckets.find(b => b.year === d.getFullYear() && b.month === d.getMonth());
      if (bucket) bucket.count++;
    });
    return buckets;
  },
};
