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
    item.lastWorn = new Date().toISOString();
    item.wornCount = (item.wornCount || 0) + 1;
    saveDB(db);
    return item;
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
  };
})();

const AppState = {
  currentUser: null,
  items: [],
  equippedItems: [],
  filters: {
    search: '',
    categories: [],
    statuses: [],
    seasons: [],
  },
  sortBy: 'name',
  sortDir: 'asc',

  setUser(user) {
    this.currentUser = user;
    this.items = Store.getUserItems(user.id);
    this.equippedItems = JSON.parse(localStorage.getItem("equipped_"+user.id) || "[]");
  },

  logout() {
    Store.clearSession();
    this.currentUser = null;
    this.items = [];
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
    this.items = this.items.filter(i => i.id !== id);
  },

  wearItem(id) {
    const updated = Store.wearItem(this.currentUser.id, id);
    if (updated) {
      const idx = this.items.findIndex(i => i.id === id);
      if (idx !== -1) this.items[idx] = updated;
    }
    if(updated && !this.equippedItems.includes(id)){ this.equippedItems.push(id); localStorage.setItem("equipped_"+this.currentUser.id, JSON.stringify(this.equippedItems)); }
    return updated;
  },

  removeEquipped(id){ this.equippedItems=this.equippedItems.filter(x=>x!==id); localStorage.setItem("equipped_"+this.currentUser.id, JSON.stringify(this.equippedItems)); },

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
};
