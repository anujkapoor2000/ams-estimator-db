// Storage abstraction — uses window.storage if available (Claude artifact env)
// falls back to localStorage for Vercel/browser deployment

export const storage = {
  async get(key) {
    if (typeof window.storage !== 'undefined' && window.storage.get) {
      try {
        return await window.storage.get(key);
      } catch { return null; }
    }
    // localStorage fallback
    try {
      const val = localStorage.getItem(key);
      return val ? { value: val } : null;
    } catch { return null; }
  },

  async set(key, value) {
    if (typeof window.storage !== 'undefined' && window.storage.set) {
      try {
        return await window.storage.set(key, value);
      } catch { return null; }
    }
    try {
      localStorage.setItem(key, value);
      return { value };
    } catch { return null; }
  },

  async delete(key) {
    if (typeof window.storage !== 'undefined' && window.storage.delete) {
      try { return await window.storage.delete(key); } catch { return null; }
    }
    try { localStorage.removeItem(key); return { deleted: true }; } catch { return null; }
  }
};
